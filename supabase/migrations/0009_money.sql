-- Modul: Kassza. Pénz integer forintban; minden számítás itt, a kliens csak megjelenít.

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  program_id uuid references public.programs on delete set null,
  title text not null check (char_length(title) between 1 and 60),
  amount integer not null check (amount > 0 and amount <= 10000000),
  currency text not null default 'HUF' check (currency = 'HUF'),
  paid_by uuid not null references public.profiles on delete cascade,
  split_mode text not null check (split_mode in ('equal', 'exact', 'shares')),
  created_by uuid not null references public.profiles on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.expenses (group_id, created_at desc);
create index on public.expenses (program_id);

create table public.expense_splits (
  expense_id uuid not null references public.expenses on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  amount integer not null check (amount >= 0),
  primary key (expense_id, user_id)
);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  from_user uuid not null references public.profiles on delete cascade,
  to_user uuid not null references public.profiles on delete cascade,
  amount integer not null check (amount > 0),
  created_by uuid not null references public.profiles on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);
create index on public.settlements (group_id);

alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;

-- Kiadás csak az add_expense RPC-vel jöhet létre (az osztást a szerver számolja)
create policy "expenses: members read" on public.expenses for select to authenticated
  using (public.is_group_member(group_id));
create policy "expenses: creator deletes" on public.expenses for delete to authenticated
  using (created_by = (select auth.uid()));
create policy "expense_splits: members read" on public.expense_splits for select to authenticated
  using (exists (select 1 from public.expenses e where e.id = expense_id and public.is_group_member(e.group_id)));

create policy "settlements: members read" on public.settlements for select to authenticated
  using (public.is_group_member(group_id));
create policy "settlements: party records" on public.settlements for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select auth.uid()) in (from_user, to_user)
    and exists (select 1 from public.group_members where group_id = settlements.group_id and user_id = from_user)
    and exists (select 1 from public.group_members where group_id = settlements.group_id and user_id = to_user)
  );
create policy "settlements: creator deletes" on public.settlements for delete to authenticated
  using (created_by = (select auth.uid()));

-- Tiszta függvények (unit tesztelve: supabase/tests/money_test.sql) ------------

-- total felosztása súlyok szerint; lefelé kerekít, a maradék forintokat a
-- legnagyobb törtrészűek kapják (holtversenyben user_id szerint) -> összeg pontos
create function public.split_amounts(total integer, weights jsonb)
returns table (user_id uuid, amount integer)
language sql immutable set search_path = '' as $$
  with w as (select key::uuid as u, value::numeric as wt from jsonb_each_text(weights)),
  raw as (select u, total * wt / (select sum(wt) from w) as exact from w),
  fl as (select u, floor(exact)::integer as base, exact - floor(exact) as frac from raw),
  ranked as (select u, base, row_number() over (order by frac desc, u) as rn from fl)
  select u, base + case when rn <= total - (select sum(base) from fl) then 1 else 0 end from ranked
$$;

-- Mohó minimális utalás: mindig a legnagyobb adós fizet a legnagyobb hitelezőnek.
-- balances: { user_id: egyenleg } (+ = kap, − = tartozik), összege 0.
create function public.min_transfers(balances jsonb)
returns table (from_user uuid, to_user uuid, amount integer)
language plpgsql immutable set search_path = '' as $$
declare
  b jsonb := balances;
  c uuid; cv integer; d uuid; dv integer; x integer;
begin
  loop
    select key::uuid, value::integer into c, cv from jsonb_each_text(b)
      where value::integer > 0 order by value::integer desc, key limit 1;
    select key::uuid, value::integer into d, dv from jsonb_each_text(b)
      where value::integer < 0 order by value::integer, key limit 1;
    exit when c is null or d is null;
    x := least(cv, -dv);
    from_user := d; to_user := c; amount := x;
    return next;
    b := b || jsonb_build_object(c::text, cv - x, d::text, dv + x);
  end loop;
end $$;

-- Egyenlegek ----------------------------------------------------------------
create view public.balances with (security_invoker = true) as
select m.group_id, m.user_id, (
    coalesce((select sum(e.amount) from public.expenses e where e.group_id = m.group_id and e.paid_by = m.user_id), 0)
  - coalesce((select sum(s.amount) from public.expense_splits s join public.expenses e on e.id = s.expense_id
              where e.group_id = m.group_id and s.user_id = m.user_id), 0)
  + coalesce((select sum(t.amount) from public.settlements t where t.group_id = m.group_id and t.from_user = m.user_id), 0)
  - coalesce((select sum(t.amount) from public.settlements t where t.group_id = m.group_id and t.to_user = m.user_id), 0)
  )::integer as balance
from public.group_members m;

create function public.settle_plan(gid uuid)
returns table (from_user uuid, to_user uuid, amount integer)
language sql stable security invoker set search_path = '' as $$
  select * from public.min_transfers(coalesce(
    (select jsonb_object_agg(user_id, balance) from public.balances where group_id = gid and balance <> 0), '{}'))
$$;

-- Kiadás felvétele: parts = { user_id: érték }; equal: érték mindegy,
-- shares: súly (>0), exact: forint (összege = amount)
create function public.add_expense(gid uuid, title text, amount integer, paid_by uuid, mode text, parts jsonb, program uuid default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  eid uuid;
  weights jsonb;
begin
  if not public.is_group_member(gid) then raise exception 'not a member'; end if;
  if not exists (select 1 from public.group_members where group_id = gid and user_id = paid_by) then raise exception 'payer not in group'; end if;
  if (select count(*) from jsonb_object_keys(parts)) = 0 then raise exception 'no participants'; end if;
  if exists (select 1 from jsonb_object_keys(parts) k where not exists (
    select 1 from public.group_members where group_id = gid and user_id = k::uuid)) then raise exception 'participant not in group'; end if;
  if program is not null and public.program_group(program) is distinct from gid then raise exception 'program not in group'; end if;

  insert into public.expenses (group_id, program_id, title, amount, paid_by, split_mode)
  values (gid, program, title, amount, paid_by, mode) returning id into eid;

  if mode = 'exact' then
    if exists (select 1 from jsonb_each_text(parts) where value::integer < 0) then raise exception 'negative part'; end if;
    if (select sum(value::integer) from jsonb_each_text(parts)) <> amount then raise exception 'parts do not add up'; end if;
    insert into public.expense_splits (expense_id, user_id, amount)
    select eid, key::uuid, value::integer from jsonb_each_text(parts);
  else
    if mode = 'equal' then
      weights := (select jsonb_object_agg(key, 1) from jsonb_object_keys(parts) key);
    elsif mode = 'shares' then
      if exists (select 1 from jsonb_each_text(parts) where value::numeric <= 0) then raise exception 'weights must be positive'; end if;
      weights := parts;
    else
      raise exception 'unknown mode';
    end if;
    insert into public.expense_splits (expense_id, user_id, amount)
    select eid, s.user_id, s.amount from public.split_amounts(amount, weights) s;
  end if;
  return eid;
end $$;

revoke execute on function public.add_expense from public, anon;
revoke execute on function public.settle_plan from public, anon;
