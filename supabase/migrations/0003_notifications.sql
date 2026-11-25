-- Értesítések: app-on belüli lista, push feliratkozások, típusonkénti beállítás.
-- Az értesítést triggerek hozzák létre; új sor -> pg_net -> send-push Edge Function.
-- VAPID kulcsok a Vaultban (vapid_public, vapid_private), migráción kívül felvéve.

create extension if not exists pg_net;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  group_id uuid not null references public.groups on delete cascade,
  type text not null,
  payload jsonb not null default '{}', -- { title, body, url }
  read_at timestamptz,
  pushed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references public.profiles on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index on public.push_subscriptions (user_id);

create table public.notification_prefs (
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  type text not null,
  enabled boolean not null,
  primary key (user_id, type)
);

alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_prefs enable row level security;

create policy "notifications: own read" on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy "notifications: own mark read" on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "push_subscriptions: own read" on public.push_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "push_subscriptions: own delete" on public.push_subscriptions for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "notification_prefs: own" on public.notification_prefs for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Egy eszköz endpointja átkerülhet másik userhez (kijelentkezés után), ezért RPC
create function public.save_push_subscription(endpoint text, p256dh text, auth text) returns void
language sql security definer set search_path = '' as $$
  insert into public.push_subscriptions (endpoint, user_id, p256dh, auth)
  values (endpoint, auth.uid(), p256dh, auth)
  on conflict (endpoint) do update set user_id = auth.uid(), p256dh = excluded.p256dh, auth = excluded.auth
$$;
revoke execute on function public.save_push_subscription from public, anon;

-- Értesítés a banda tagjainak (a szereplő kivételével), ha nem kapcsolták ki
create function public.notify_group(gid uuid, actor uuid, ntype text, payload jsonb) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, group_id, type, payload)
  select m.user_id, gid, ntype, payload
  from public.group_members m
  where m.group_id = gid and m.user_id <> actor
    and not exists (select 1 from public.notification_prefs p where p.user_id = m.user_id and p.type = ntype and not p.enabled)
$$;

create function public.handle_activity_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  actor_name text := (select display_name from public.profiles where id = new.actor_id);
  group_name text := (select name from public.groups where id = new.group_id);
begin
  case new.type
    when 'program_created' then
      perform public.notify_group(new.group_id, new.actor_id, new.type, jsonb_build_object(
        'title', group_name, 'body', actor_name || ' programot szervez: ' || (new.payload->>'title'), 'url', '/programs/' || new.ref_id));
    when 'member_joined' then
      perform public.notify_group(new.group_id, new.actor_id, new.type, jsonb_build_object(
        'title', group_name, 'body', actor_name || ' csatlakozott a bandához.', 'url', '/'));
    else null;
  end case;
  return new;
end $$;

create trigger on_activity_notify after insert on public.activity
  for each row execute function public.handle_activity_notify();

-- Komment: a bejegyzés szerzője kap értesítést
create function public.handle_comment_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare a public.activity;
begin
  select * into a from public.activity where id = new.activity_id;
  if a.actor_id = new.user_id then return new; end if;
  if exists (select 1 from public.notification_prefs where user_id = a.actor_id and type = 'comment' and not enabled) then return new; end if;
  insert into public.notifications (user_id, group_id, type, payload) values (a.actor_id, a.group_id, 'comment', jsonb_build_object(
    'title', (select name from public.groups where id = a.group_id),
    'body', (select display_name from public.profiles where id = new.user_id) || ': ' || left(new.body, 120),
    'url', '/'));
  return new;
end $$;

create trigger on_comment_notify after insert on public.comments
  for each row execute function public.handle_comment_notify();

-- Push küldés, ha a címzettnek van feliratkozása
create function public.handle_notification_push() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.push_subscriptions where user_id = new.user_id) then
    perform net.http_post(
      url := 'https://zccnafkupundvovwyypk.supabase.co/functions/v1/send-push',
      body := jsonb_build_object('id', new.id),
      headers := '{"Content-Type": "application/json"}'
    );
  end if;
  return new;
end $$;

create trigger on_notification_push after insert on public.notifications
  for each row execute function public.handle_notification_push();

-- Csak a send-push (service_role) olvassa
create function public.get_push_config() returns jsonb
language sql security definer set search_path = '' as $$
  select jsonb_object_agg(name, decrypted_secret) from vault.decrypted_secrets where name in ('vapid_public', 'vapid_private')
$$;

revoke execute on function public.notify_group, public.handle_activity_notify, public.handle_comment_notify,
  public.handle_notification_push, public.get_push_config from public, anon, authenticated;
grant execute on function public.get_push_config to service_role;
