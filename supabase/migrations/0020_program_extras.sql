-- Mag-bővítés: program-emlékeztető, program-beszélgetés, ismétlődő programok, utalási adatok.

-- Utalási adatok (a banda-tagok látják, a profiles RLS szerint) -------------
alter table public.profiles
  add column bank_account text check (char_length(bank_account) <= 40),
  add column revolut text check (revolut ~ '^[A-Za-z0-9._-]{1,32}$');

-- Ismétlődés + emlékeztető-jelzők -------------------------------------------
alter table public.programs
  add column recurrence text check (recurrence in ('weekly', 'biweekly', 'monthly')),
  add column series_id uuid,
  add column reminded_eve boolean not null default false,
  add column reminded_soon boolean not null default false;
create index on public.programs (series_id, starts_at desc);

create function public.handle_program_series() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.recurrence is not null and new.series_id is null then new.series_id := new.id; end if;
  return new;
end $$;
create trigger on_program_series before insert on public.programs
  for each row execute function public.handle_program_series();

-- Résztvevők (megy / talán) értesítése, a megadott user kivételével
create function public.notify_attendees(pid uuid, except_user uuid, ntype text, title text, body text) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, group_id, type, payload)
  select a.user_id, p.group_id, ntype, jsonb_build_object('title', title, 'body', body, 'url', '/programs/' || p.id)
  from public.program_attendees a join public.programs p on p.id = a.program_id
  where a.program_id = pid and a.status in ('going', 'maybe') and a.user_id is distinct from except_user
    and not exists (select 1 from public.notification_prefs n where n.user_id = a.user_id and n.type = ntype and not n.enabled)
$$;

-- Emlékeztető: előző este 18 óra után és ~2 órával kezdés előtt. pg_cron 15 percenként.
create function public.program_reminders(at timestamptz default now()) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  loc timestamp := at at time zone 'Europe/Budapest';
  p record;
  n integer := 0;
begin
  for p in
    update public.programs set reminded_eve = true
    where status = 'planned' and not reminded_eve and starts_at is not null and extract(hour from loc) >= 18
      and (starts_at at time zone 'Europe/Budapest')::date = loc::date + 1
    returning *
  loop
    perform public.notify_attendees(p.id, null, 'program_reminder', p.title,
      'Holnap ' || to_char(p.starts_at at time zone 'Europe/Budapest', 'HH24:MI') || coalesce(' · ' || p.location, '') || '. Ott leszel?');
    n := n + 1;
  end loop;
  for p in
    update public.programs set reminded_soon = true
    where status = 'planned' and not reminded_soon and starts_at > at and starts_at <= at + interval '2 hours 15 minutes'
    returning *
  loop
    perform public.notify_attendees(p.id, null, 'program_reminder', p.title,
      'Ma ' || to_char(p.starts_at at time zone 'Europe/Budapest', 'HH24:MI') || '-kor kezdődik' || coalesce(' · ' || p.location, '') || '.');
    n := n + 1;
  end loop;
  return n;
end $$;

-- Ismétlődő sorozat: ha a legutóbbi alkalom 2 napon belül van (vagy elmúlt), jön a következő
create function public.recurring_programs(at timestamptz default now()) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  p record;
  next_id uuid;
  n integer := 0;
begin
  for p in
    select * from (
      select distinct on (series_id) * from public.programs
      where series_id is not null and starts_at is not null and status in ('planned', 'done')
      order by series_id, starts_at desc
    ) latest
    where recurrence is not null and starts_at < at + interval '2 days'
  loop
    insert into public.programs (group_id, title, starts_at, location, status, created_by, recurrence, series_id)
    values (p.group_id, p.title,
      p.starts_at + case p.recurrence when 'weekly' then interval '7 days' when 'biweekly' then interval '14 days' else interval '1 month' end,
      p.location, 'planned', p.created_by, p.recurrence, p.series_id)
    returning id into next_id;
    insert into public.activity (group_id, actor_id, type, ref_id, payload)
    values (p.group_id, p.created_by, 'program_created', next_id, jsonb_build_object('title', p.title,
      'starts_at', p.starts_at + case p.recurrence when 'weekly' then interval '7 days' when 'biweekly' then interval '14 days' else interval '1 month' end));
    n := n + 1;
  end loop;
  return n;
end $$;

revoke execute on function public.notify_attendees, public.program_reminders, public.recurring_programs, public.handle_program_series
  from public, anon, authenticated;

select cron.schedule('program-reminders', '*/15 * * * *', 'select public.program_reminders()');
select cron.schedule('recurring-programs', '29 4 * * *', 'select public.recurring_programs()');

-- Program-beszélgetés -------------------------------------------------------
create table public.program_comments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs on delete cascade,
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index on public.program_comments (program_id, created_at);

alter table public.program_comments enable row level security;
create policy "program_comments: members read" on public.program_comments for select to authenticated
  using (public.is_group_member(group_id));
create policy "program_comments: own insert" on public.program_comments for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_group_member(group_id) and group_id = public.program_group(program_id));
create policy "program_comments: own delete" on public.program_comments for delete to authenticated
  using (user_id = (select auth.uid()));

create function public.handle_program_comment() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.notify_attendees(new.program_id, new.user_id, 'program_comment',
    (select title from public.programs where id = new.program_id),
    (select display_name from public.profiles where id = new.user_id) || ': ' || left(new.body, 120));
  return new;
end $$;
create trigger on_program_comment after insert on public.program_comments
  for each row execute function public.handle_program_comment();
revoke execute on function public.handle_program_comment from public, anon, authenticated;

alter publication supabase_realtime add table public.program_comments;
