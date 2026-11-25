-- Kihívás + XP teszt (rollback-kel, 'CHALLENGE TESTS PASSED' kivétellel végződik)
do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  c uuid := '00000000-0000-0000-0000-00000000000c';
  gid uuid; cid uuid; sid uuid; sid2 uuid;
begin
  insert into auth.users (id, aud, role, email) values (a, 'authenticated', 'authenticated', 'ca@x.test'), (b, 'authenticated', 'authenticated', 'cb@x.test'), (c, 'authenticated', 'authenticated', 'cc@x.test');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  gid := public.create_group('Kihívásteszt');
  insert into public.group_members (group_id, user_id) values (gid, b), (gid, c);

  -- XP: program létrehozás 10 pont, napi plafon 3
  insert into public.activity (group_id, actor_id, type) select gid, a, 'program_created' from generate_series(1, 4);
  assert (select season_xp from public.league_standings where group_id = gid and user_id = a) = 30, 'xp daily cap';
  assert (select sum(total_xp) from public.league_standings where group_id = gid) = (select sum(points) from public.xp_ledger where group_id = gid), 'standings = ledger';

  insert into public.challenges (group_id, title, created_by) values (gid, '10 km futás', a) returning id into cid;
  insert into public.challenge_submissions (challenge_id, group_id, user_id, photo_path) values (cid, gid, a, 'x/a.webp') returning id into sid;
  insert into public.challenge_submissions (challenge_id, group_id, user_id, photo_path) values (cid, gid, b, 'x/b.webp') returning id into sid2;

  -- 3 tag: a beküldőn kívül 2 -> 2 egyező szavazat kell
  insert into public.submission_votes (submission_id, user_id, group_id, valid) values (sid, b, gid, true);
  assert (select status from public.challenge_submissions where id = sid) = 'pending', 'one vote not enough';
  insert into public.submission_votes (submission_id, user_id, group_id, valid) values (sid, c, gid, true);
  assert (select status from public.challenge_submissions where id = sid) = 'valid', 'majority valid';
  assert (select count(*) from public.xp_ledger where group_id = gid and user_id = a and reason = 'challenges.challenge_completed') = 1, 'completion xp';
  assert (select season_xp from public.league_standings where group_id = gid and user_id = a) = 50, 'xp after challenge';

  insert into public.submission_votes (submission_id, user_id, group_id, valid) values (sid2, a, gid, false), (sid2, c, gid, false);
  assert (select status from public.challenge_submissions where id = sid2) = 'invalid', 'majority invalid';
  assert (select count(*) from public.notifications where user_id = b and type = 'challenge_rejected') = 1, 'rejected notified';
  assert (select count(*) from public.xp_ledger where user_id = b and reason = 'challenges.challenge_completed') = 0, 'no xp for invalid';

  raise exception 'CHALLENGE TESTS PASSED';
end $$;
