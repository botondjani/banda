-- Kassza unit + integrációs teszt. Futtatás: az egész fájl egy SQL-hívásban.
-- A végén szándékosan kivételt dob ('MONEY TESTS PASSED'), így minden visszagörgetődik.
do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  c uuid := '00000000-0000-0000-0000-00000000000c';
  gid uuid;
  total integer;
  r record;
begin
  -- split_amounts: egyenlő, kerekítéssel ------------------------------------
  select sum(amount) into total from public.split_amounts(1000, jsonb_build_object(a, 1, b, 1, c, 1));
  assert total = 1000, 'equal split sum';
  assert (select array_agg(amount order by amount) from public.split_amounts(1000, jsonb_build_object(a, 1, b, 1, c, 1))) = array[333, 333, 334], 'equal split rounding';
  -- arányos 2:1
  assert (select amount from public.split_amounts(900, jsonb_build_object(a, 2, b, 1)) where user_id = a) = 600, 'shares 2:1';
  -- kis összeg sok emberre
  select sum(amount) into total from public.split_amounts(2, jsonb_build_object(a, 1, b, 1, c, 1));
  assert total = 2, 'tiny split sum';

  -- min_transfers -----------------------------------------------------------
  assert (select count(*) from public.min_transfers('{}')) = 0, 'empty';
  assert (select count(*) from public.min_transfers(jsonb_build_object(a, 2000, b, -1000, c, -1000))) = 2, 'one creditor two debtors';
  assert (select count(*) from public.min_transfers(jsonb_build_object(a, 500, b, 500, c, -1000))) = 2, 'two creditors one debtor';
  -- utalások után mindenki 0
  for r in select * from public.min_transfers(jsonb_build_object(a, 1700, b, -1200, c, -500)) loop
    assert r.amount > 0, 'positive transfer';
  end loop;
  assert (select sum(amount) from public.min_transfers(jsonb_build_object(a, 1700, b, -1200, c, -500))) = 1700, 'transfers cover debt';

  -- Integráció: 3 fős banda --------------------------------------------------
  insert into auth.users (id, aud, role, email) values (a, 'authenticated', 'authenticated', 'ta@x.test'), (b, 'authenticated', 'authenticated', 'tb@x.test'), (c, 'authenticated', 'authenticated', 'tc@x.test');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  gid := public.create_group('Pénzteszt');
  insert into public.group_members (group_id, user_id) values (gid, b), (gid, c);

  perform public.add_expense(gid, 'Kaja', 9000, a, 'equal', jsonb_build_object(a, 0, b, 0, c, 0));
  perform public.add_expense(gid, 'Benzin', 1001, b, 'shares', jsonb_build_object(a, 1, b, 1, c, 2));
  perform public.add_expense(gid, 'Jegyek', 4500, c, 'exact', jsonb_build_object(a, 1500, b, 3000));
  begin
    perform public.add_expense(gid, 'Rossz', 100, a, 'exact', jsonb_build_object(a, 50));
    assert false, 'exact mismatch should fail';
  exception when others then
    if sqlerrm like '%should fail%' then raise; end if;
  end;

  assert (select sum(balance) from public.balances where group_id = gid) = 0, 'balances sum to zero';
  assert (select count(*) from public.balances where group_id = gid and balance <> 0) > 0, 'someone owes';

  -- Nullázás végrehajtása
  insert into public.settlements (group_id, from_user, to_user, amount, created_by)
  select gid, p.from_user, p.to_user, p.amount, p.from_user from public.settle_plan(gid) p;
  assert (select count(*) from public.balances where group_id = gid and balance <> 0) = 0, 'everyone at zero after settle';
  assert (select count(*) from public.settle_plan(gid)) = 0, 'nothing left to settle';

  raise exception 'MONEY TESTS PASSED';
end $$;
