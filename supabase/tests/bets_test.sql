-- Fogadás teszt (rollback-kel, 'BETS TESTS PASSED' kivétellel végződik)
do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  c uuid := '00000000-0000-0000-0000-00000000000c';
  gid uuid; bid uuid; yes uuid; no uuid;
begin
  insert into auth.users (id, aud, role, email) values (a, 'authenticated', 'authenticated', 'ba@x.test'), (b, 'authenticated', 'authenticated', 'bb@x.test'), (c, 'authenticated', 'authenticated', 'bc@x.test');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  gid := public.create_group('Fogadásteszt');
  insert into public.group_members (group_id, user_id) values (gid, b), (gid, c);

  bid := public.create_bet(gid, 'Zoli elkésik', array['Igen', 'Nem'], 'egy kör', 1000, true);
  select id into yes from public.bet_sides where bet_id = bid and label = 'Igen';
  select id into no from public.bet_sides where bet_id = bid and label = 'Nem';
  insert into public.bet_picks (bet_id, user_id, group_id, side_id) values (bid, a, gid, yes), (bid, b, gid, yes), (bid, c, gid, no);

  -- nyitott fogadásra nem lehet eldöntő szavazat (trigger nem dönt)
  insert into public.bet_votes (bet_id, user_id, group_id, side_id) values (bid, a, gid, yes);
  assert (select status from public.bets where id = bid) = 'open', 'vote on open bet does nothing';
  delete from public.bet_votes where bet_id = bid;

  perform public.close_bet(bid);
  assert (select status from public.bets where id = bid) = 'closed', 'closed';
  insert into public.bet_votes (bet_id, user_id, group_id, side_id) values (bid, a, gid, yes);
  assert (select status from public.bets where id = bid) = 'closed', '1 of 3 not enough';
  insert into public.bet_votes (bet_id, user_id, group_id, side_id) values (bid, c, gid, yes);
  assert (select status from public.bets where id = bid) = 'resolved' and (select winning_side from public.bets where id = bid) = yes, 'resolved yes';

  -- c vesztett 1000-et: a és b kap 500-500-at
  assert (select balance from public.balances where group_id = gid and user_id = c) = -1000, 'loser owes stake';
  assert (select balance from public.balances where group_id = gid and user_id = a) = 500, 'winner a';
  assert (select balance from public.balances where group_id = gid and user_id = b) = 500, 'winner b';
  assert (select sum(balance) from public.balances where group_id = gid) = 0, 'balances sum zero';
  assert (select count(*) from public.xp_ledger where group_id = gid and reason = 'bets.bet_won') = 2, 'winners xp';
  assert (select count(*) from public.notifications where group_id = gid and type = 'bet_resolved') = 2, 'others notified';

  raise exception 'BETS TESTS PASSED';
end $$;
