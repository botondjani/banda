-- Modul: Kölcsönző. Tárgyak, kölcsönzések; állapotváltás csak RPC-n át.
-- requested -> active (gazda jóváhagyja) | declined; active -> returned (gazda visszakapta).
-- Lejárt határidő: lending_reminders() pg_cron-nal naponta, naponta legfeljebb egy emlékeztető.

create table public.lend_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  owner_id uuid not null references public.profiles on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 60),
  note text check (char_length(note) <= 140),
  created_at timestamptz not null default now()
);
create index on public.lend_items (group_id, created_at desc);

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  item_id uuid not null references public.lend_items on delete cascade,
  borrower_id uuid not null references public.profiles on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'active', 'returned', 'declined')),
  due_date date not null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  returned_at timestamptz,
  reminded_on date
);
create index on public.loans (item_id, created_at desc);
-- egy tárgy egyszerre csak egy függő / aktív kölcsönzésben
create unique index loans_one_open_per_item on public.loans (item_id) where status in ('requested', 'active');

alter table public.lend_items enable row level security;
alter table public.loans enable row level security;

create policy "lend_items: members read" on public.lend_items for select to authenticated using (public.is_group_member(group_id));
create policy "lend_items: own insert" on public.lend_items for insert to authenticated
  with check (owner_id = (select auth.uid()) and public.is_group_member(group_id));
create policy "lend_items: owner deletes" on public.lend_items for delete to authenticated using (owner_id = (select auth.uid()));
create policy "loans: members read" on public.loans for select to authenticated using (public.is_group_member(group_id));

create function public.request_loan(iid uuid, due date) returns uuid
language plpgsql security definer set search_path = '' as $$
declare it public.lend_items; lid uuid;
begin
  select * into it from public.lend_items where id = iid;
  if it.id is null or not public.is_group_member(it.group_id) then raise exception 'not found'; end if;
  if it.owner_id = auth.uid() then raise exception 'own item'; end if;
  if due < (now() at time zone 'Europe/Budapest')::date then raise exception 'due in past'; end if;
  insert into public.loans (group_id, item_id, borrower_id, due_date) values (it.group_id, iid, auth.uid(), due) returning id into lid;
  return lid;
end $$;

create function public.respond_loan(lid uuid, approve boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.loans l set status = case when approve then 'active' else 'declined' end,
    started_at = case when approve then now() end
  from public.lend_items i
  where l.id = lid and i.id = l.item_id and i.owner_id = auth.uid() and l.status = 'requested';
  if not found then raise exception 'not allowed'; end if;
end $$;

create function public.return_loan(lid uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.loans l set status = 'returned', returned_at = now()
  from public.lend_items i
  where l.id = lid and i.id = l.item_id and i.owner_id = auth.uid() and l.status = 'active';
  if not found then raise exception 'not allowed'; end if;
end $$;

revoke execute on function public.request_loan, public.respond_loan, public.return_loan from public, anon;

-- Lejárt aktív kölcsönzések: emlékeztető a kölcsönzőnek (és a gazdának), naponta egyszer
create function public.lending_reminders(d date default (now() at time zone 'Europe/Budapest')::date) returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  with due as (
    update public.loans l set reminded_on = d
    where l.status = 'active' and l.due_date < d and (l.reminded_on is null or l.reminded_on < d)
    returning l.*
  ), info as (
    select due.*, i.name, i.owner_id, g.name as group_name,
      (select display_name from public.profiles where id = i.owner_id) as owner_name,
      (select display_name from public.profiles where id = due.borrower_id) as borrower_name
    from due join public.lend_items i on i.id = due.item_id join public.groups g on g.id = due.group_id
  ), ins as (
    insert into public.notifications (user_id, group_id, type, payload)
    select user_id, group_id, 'loan_overdue', jsonb_build_object('title', group_name, 'body', body, 'url', '/m/lending')
    from (
      select borrower_id as user_id, group_id, group_name, 'Lejárt: vidd vissza ' || owner_name || ' ' || name || ' nevű cuccát.' as body from info
      union all
      select owner_id, group_id, group_name, borrower_name || ' még nem hozta vissza: ' || name || '.' from info
    ) x
    where not exists (select 1 from public.notification_prefs p where p.user_id = x.user_id and p.type = 'loan_overdue' and not p.enabled)
    returning 1
  )
  select count(*) into n from due;
  return n;
end $$;
revoke execute on function public.lending_reminders from public, anon, authenticated;

select cron.schedule('lending-reminders', '13 7 * * *', 'select public.lending_reminders()');

insert into public.xp_rules (module_id, type, points, daily_cap) values
  ('lending', 'item_added', 2, 3),
  ('lending', 'loan_approved', 5, 3);
insert into public.badge_rules (key, label, description, module_id, type, threshold) values
  ('lender', 'Jószívű', '5-ször adott kölcsön', 'lending', 'loan_approved', 5);
