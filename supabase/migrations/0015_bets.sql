-- Modul: Fogadás. "Fogadjunk, hogy…": oldalak, tippek, lezárás, döntés többségi szavazással.
-- Ha to_kassza és stake_amount meg van adva, minden vesztes tétje a nyertesek közt
-- oszlik szét, Kassza-kiadásként (a nyertes "fizette", a vesztes tartozik).

create table public.bets (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  stake text check (char_length(stake) <= 60),
  stake_amount integer check (stake_amount > 0 and stake_amount <= 1000000),
  to_kassza boolean not null default false,
  status text not null default 'open' check (status in ('open', 'closed', 'resolved')),
  winning_side uuid,
  created_by uuid not null references public.profiles on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.bets (group_id, created_at desc);

create table public.bet_sides (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets on delete cascade,
  group_id uuid not null references public.groups on delete cascade,
  label text not null check (char_length(label) between 1 and 40)
);

-- ki melyik oldalra tett
create table public.bet_picks (
  bet_id uuid not null references public.bets on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  group_id uuid not null references public.groups on delete cascade,
  side_id uuid not null references public.bet_sides on delete cascade,
  primary key (bet_id, user_id)
);

-- melyik oldal nyert (szavazás lezárás után)
create table public.bet_votes (
  bet_id uuid not null references public.bets on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  group_id uuid not null references public.groups on delete cascade,
  side_id uuid not null references public.bet_sides on delete cascade,
  primary key (bet_id, user_id)
);

-- side a megadott fogadáshoz tartozik és a fogadás adott állapotban van -> group_id
create function public.bet_side_group(bid uuid, sid uuid, want_status text) returns uuid
language sql stable security definer set search_path = '' as $$
  select b.group_id from public.bets b join public.bet_sides s on s.bet_id = b.id
  where b.id = bid and s.id = sid and b.status = want_status
$$;
revoke execute on function public.bet_side_group from public, anon;

alter table public.bets enable row level security;
alter table public.bet_sides enable row level security;
alter table public.bet_picks enable row level security;
alter table public.bet_votes enable row level security;

create policy "bets: members read" on public.bets for select to authenticated using (public.is_group_member(group_id));
create policy "bet_sides: members read" on public.bet_sides for select to authenticated using (public.is_group_member(group_id));
create policy "bet_picks: members read" on public.bet_picks for select to authenticated using (public.is_group_member(group_id));
create policy "bet_votes: members read" on public.bet_votes for select to authenticated using (public.is_group_member(group_id));

create policy "bet_picks: own while open" on public.bet_picks for insert to authenticated
  with check (user_id = (select auth.uid()) and group_id = public.bet_side_group(bet_id, side_id, 'open') and public.is_group_member(group_id));
create policy "bet_picks: change while open" on public.bet_picks for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and group_id = public.bet_side_group(bet_id, side_id, 'open'));
create policy "bet_votes: own while closed" on public.bet_votes for insert to authenticated
  with check (user_id = (select auth.uid()) and group_id = public.bet_side_group(bet_id, side_id, 'closed') and public.is_group_member(group_id));
create policy "bet_votes: change while closed" on public.bet_votes for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and group_id = public.bet_side_group(bet_id, side_id, 'closed'));

create function public.create_bet(gid uuid, title text, sides text[], stake text default null, stake_amount integer default null, to_kassza boolean default false)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare bid uuid;
begin
  if not public.is_group_member(gid) then raise exception 'not a member'; end if;
  if coalesce(array_length(sides, 1), 0) < 2 or array_length(sides, 1) > 6 then raise exception 'need 2-6 sides'; end if;
  insert into public.bets (group_id, title, stake, stake_amount, to_kassza)
  values (gid, title, stake, stake_amount, to_kassza and stake_amount is not null) returning id into bid;
  insert into public.bet_sides (bet_id, group_id, label) select bid, gid, s from unnest(sides) s;
  return bid;
end $$;

create function public.close_bet(bid uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.bets set status = 'closed' where id = bid and status = 'open' and created_by = auth.uid();
  if not found then raise exception 'not allowed'; end if;
end $$;
revoke execute on function public.create_bet, public.close_bet from public, anon;

create function public.handle_bet_vote() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  b public.bets;
  win uuid;
  need integer;
  winners jsonb;
  loser uuid;
  sh record;
  eid uuid;
  side_label text;
begin
  select * into b from public.bets where id = new.bet_id for update;
  if b.status <> 'closed' then return new; end if;
  need := (select count(*) from public.group_members where group_id = b.group_id) / 2 + 1;
  select side_id into win from public.bet_votes where bet_id = b.id group by side_id having count(*) >= need limit 1;
  if win is null then return new; end if;

  update public.bets set status = 'resolved', winning_side = win where id = b.id;
  side_label := (select label from public.bet_sides where id = win);
  winners := (select jsonb_object_agg(user_id, 1) from public.bet_picks where bet_id = b.id and side_id = win);

  -- tét a kasszába: minden vesztes tétje a nyertesek közt (pontos forint-osztás)
  if b.to_kassza and b.stake_amount is not null and winners is not null then
    for loser in select user_id from public.bet_picks where bet_id = b.id and side_id <> win loop
      for sh in select * from public.split_amounts(b.stake_amount, winners) loop
        continue when sh.amount = 0;
        insert into public.expenses (group_id, title, amount, paid_by, split_mode, created_by)
        values (b.group_id, left('Fogadás: ' || b.title, 60), sh.amount, sh.user_id, 'exact', sh.user_id) returning id into eid;
        insert into public.expense_splits (expense_id, user_id, amount) values (eid, loser, sh.amount);
      end loop;
    end loop;
  end if;

  insert into public.activity (group_id, actor_id, module_id, type, ref_id, payload)
  select b.group_id, p.user_id, 'bets', 'bet_won', b.id, jsonb_build_object('title', b.title)
  from public.bet_picks p where p.bet_id = b.id and p.side_id = win;
  insert into public.activity (group_id, actor_id, module_id, type, ref_id, payload)
  values (b.group_id, new.user_id, 'bets', 'bet_resolved', b.id, jsonb_build_object(
    'title', b.title, 'side', side_label,
    'notify_text', 'lezárta a szavazást: ' || b.title || ' – ' || side_label || ' nyert.', 'notify_url', '/m/bets'));
  return new;
end $$;

create trigger on_bet_vote after insert or update on public.bet_votes
  for each row execute function public.handle_bet_vote();
revoke execute on function public.handle_bet_vote from public, anon, authenticated;

insert into public.xp_rules (module_id, type, points, daily_cap) values
  ('bets', 'bet_created', 2, 2),
  ('bets', 'bet_won', 10, null);
insert into public.badge_rules (key, label, description, module_id, type, threshold) values
  ('lucky', 'Szerencsés', '3 fogadást nyert', 'bets', 'bet_won', 3);
