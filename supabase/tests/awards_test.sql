-- Díjak teszt (rollback-kel, 'AWARDS TESTS PASSED' kivétellel végződik)
do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  c uuid := '00000000-0000-0000-0000-00000000000c';
  gid uuid; cid uuid; m date := date_trunc('month', now())::date;
begin
  insert into auth.users (id, aud, role, email) values (a, 'authenticated', 'authenticated', 'aa@x.test'), (b, 'authenticated', 'authenticated', 'ab@x.test'), (c, 'authenticated', 'authenticated', 'ac@x.test');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  gid := public.create_group('Díjteszt');
  insert into public.group_members (group_id, user_id) values (gid, b), (gid, c);
  insert into public.award_categories (group_id, title, created_by) values (gid, 'A hónap szervezője', a) returning id into cid;

  insert into public.award_votes (category_id, group_id, month, voter_id, nominee_id) values (cid, gid, m, a, b), (cid, gid, m, c, b), (cid, gid, m, b, c);
  assert (select nominee_id from public.award_results where category_id = cid and month = m and place = 1) = b, 'b wins';
  assert (select votes from public.award_results where category_id = cid and nominee_id = b) = 2, 'b has 2 votes';
  begin
    insert into public.award_votes (category_id, group_id, month, voter_id, nominee_id) values (cid, gid, m - interval '1 month', a, a);
    assert false, 'self vote should fail';
  exception when check_violation then null;
  end;

  raise exception 'AWARDS TESTS PASSED';
end $$;
