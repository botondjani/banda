-- Ötletbank teszt (rollback-kel, 'IDEAS TESTS PASSED' kivétellel végződik)
do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  c uuid := '00000000-0000-0000-0000-00000000000c';
  gid uuid; pid uuid;
begin
  insert into auth.users (id, aud, role, email) values (a, 'authenticated', 'authenticated', 'ia@x.test'), (b, 'authenticated', 'authenticated', 'ib@x.test'), (c, 'authenticated', 'authenticated', 'ic@x.test');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  gid := public.create_group('Ötletteszt');
  insert into public.group_members (group_id, user_id) values (gid, b), (gid, c);
  assert public.idea_threshold(gid) = 3, 'default threshold = least(3, members)';

  insert into public.programs (group_id, title, status, created_by) values (gid, 'Bowling', 'idea', a) returning id into pid;
  insert into public.idea_votes (program_id, user_id, group_id, vote) values (pid, a, gid, 'in'), (pid, b, gid, 'pass');
  assert (select status from public.programs where id = pid) = 'idea', 'below threshold stays idea';
  update public.idea_votes set vote = 'in' where program_id = pid and user_id = b;
  assert (select status from public.programs where id = pid) = 'idea', '2 of 3 stays idea';
  insert into public.idea_votes (program_id, user_id, group_id, vote) values (pid, c, gid, 'in');
  assert (select status from public.programs where id = pid) = 'planned', 'threshold reached -> planned';
  assert (select count(*) from public.program_attendees where program_id = pid and status = 'going') = 3, 'voters going';
  assert (select count(*) from public.activity where ref_id = pid and type = 'idea_planned') = 1, 'one activity';
  assert (select count(*) from public.notifications where group_id = gid and type = 'idea_planned') = 2, 'others notified';

  -- egyedi küszöb
  insert into public.group_modules (group_id, module_id, settings) values (gid, 'ideas', '{"threshold": 1}');
  insert into public.programs (group_id, title, status, created_by) values (gid, 'Mozi', 'idea', a) returning id into pid;
  insert into public.idea_votes (program_id, user_id, group_id, vote) values (pid, a, gid, 'in');
  assert (select status from public.programs where id = pid) = 'planned', 'custom threshold 1';

  raise exception 'IDEAS TESTS PASSED';
end $$;
