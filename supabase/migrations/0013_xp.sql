-- XP és jelvények (mag). Minden XP egy activity-ből születik, triggerrel, szerveroldalon.
-- xp_rules: (modul, típus) -> pont, napi plafon. badge_rules: (modul, típus) -> darabszám-küszöb.
-- A modulok a saját migrációjukban veszik fel a szabályaikat.

create table public.xp_rules (
  module_id text not null,
  type text not null,
  points integer not null check (points >= 0),
  daily_cap integer check (daily_cap > 0),
  primary key (module_id, type)
);

create table public.badge_rules (
  key text primary key,
  label text not null,
  description text not null,
  module_id text not null,
  type text not null,
  threshold integer not null check (threshold > 0)
);

create table public.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  group_id uuid not null references public.groups on delete cascade,
  activity_id uuid not null unique references public.activity on delete cascade,
  points integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
create index on public.xp_ledger (group_id, user_id, created_at);

alter table public.xp_rules enable row level security;
alter table public.badge_rules enable row level security;
alter table public.xp_ledger enable row level security;
create policy "xp_rules: read" on public.xp_rules for select to authenticated using (true);
create policy "badge_rules: read" on public.badge_rules for select to authenticated using (true);
create policy "xp_ledger: members read" on public.xp_ledger for select to authenticated
  using (public.is_group_member(group_id));

create function public.handle_activity_xp() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r public.xp_rules;
begin
  select * into r from public.xp_rules where module_id = new.module_id and type = new.type;
  if r.points is null or r.points = 0 then return new; end if;
  if r.daily_cap is not null and (
    select count(*) from public.xp_ledger
    where user_id = new.actor_id and group_id = new.group_id and reason = r.module_id || '.' || r.type
      and created_at >= date_trunc('day', now())
  ) >= r.daily_cap then return new; end if;
  insert into public.xp_ledger (user_id, group_id, activity_id, points, reason, created_at)
  values (new.actor_id, new.group_id, new.id, r.points, r.module_id || '.' || r.type, new.created_at);
  return new;
end $$;

create trigger on_activity_xp after insert on public.activity
  for each row execute function public.handle_activity_xp();
revoke execute on function public.handle_activity_xp from public, anon, authenticated;

-- Szezon = naptári negyedév
create view public.league_standings with (security_invoker = true) as
select m.group_id, m.user_id,
  coalesce(sum(l.points) filter (where l.created_at >= date_trunc('quarter', now())), 0)::integer as season_xp,
  coalesce(sum(l.points), 0)::integer as total_xp
from public.group_members m
left join public.xp_ledger l on l.group_id = m.group_id and l.user_id = m.user_id
group by m.group_id, m.user_id;

create view public.user_badges with (security_invoker = true) as
select m.group_id, m.user_id, b.key, b.label, b.description
from public.group_members m
join public.badge_rules b on (
  select count(*) from public.activity a
  where a.group_id = m.group_id and a.actor_id = m.user_id and a.module_id = b.module_id and a.type = b.type
) >= b.threshold;

-- Szabályok: mag + a már meglévő modulok
insert into public.xp_rules (module_id, type, points, daily_cap) values
  ('core', 'program_created', 10, 3),
  ('core', 'member_joined', 5, null),
  ('available', 'ping', 3, 1),
  ('available', 'ping_joined', 5, 3),
  ('money', 'expense_added', 2, 5),
  ('money', 'settled', 3, 5),
  ('lists', 'item_added', 3, 5),
  ('ideas', 'idea_added', 3, 3),
  ('ideas', 'idea_planned', 5, null);

insert into public.badge_rules (key, label, description, module_id, type, threshold) values
  ('organizer', 'Szervező', '5 programot szervezett', 'core', 'program_created', 5),
  ('always_free', 'Mindig ráér', '5-ször szólt, hogy ráér', 'available', 'ping', 5),
  ('banker', 'Bankár', '10 kiadást vett fel', 'money', 'expense_added', 10),
  ('curator', 'Ajánlógép', '10 dolgot ajánlott', 'lists', 'item_added', 10),
  ('idea_factory', 'Ötletgyár', '5 ötletet dobott be', 'ideas', 'idea_added', 5),
  ('indecisive', 'Döntésképtelen', '20-szor sorsolt', 'decide', 'draw', 20);

-- Visszamenőleg a meglévő eseményekre (plafon nélkül)
insert into public.xp_ledger (user_id, group_id, activity_id, points, reason, created_at)
select a.actor_id, a.group_id, a.id, r.points, r.module_id || '.' || r.type, a.created_at
from public.activity a join public.xp_rules r on r.module_id = a.module_id and r.type = a.type
where r.points > 0
on conflict (activity_id) do nothing;
