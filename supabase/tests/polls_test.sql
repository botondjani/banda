-- Szavazás teszt (rollback-kel, 'POLLS TESTS PASSED' kivétellel végződik)
do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  gid uuid; pid uuid; o1 uuid; o2 uuid; o3 uuid;
begin
  insert into auth.users (id, aud, role, email) values (a, 'authenticated', 'authenticated', 'qa@x.test'), (b, 'authenticated', 'authenticated', 'qb@x.test');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  gid := public.create_group('Szavazásteszt');
  insert into public.group_members (group_id, user_id) values (gid, b);

  pid := public.create_poll(gid, 'Hova menjünk?', array['Kisüzem', 'Szimpla', 'Instant']);
  select id into o1 from public.poll_options where poll_id = pid and position = 1;
  select id into o2 from public.poll_options where poll_id = pid and position = 2;
  select id into o3 from public.poll_options where poll_id = pid and position = 3;

  perform public.vote_poll(pid, array[o1]);
  perform public.vote_poll(pid, array[o2]); -- csere
  assert (select count(*) from public.poll_votes where poll_id = pid and user_id = a) = 1, 'single vote replaced';
  assert (select option_id from public.poll_votes where poll_id = pid and user_id = a) = o2, 'changed to o2';
  begin perform public.vote_poll(pid, array[o1, o3]); assert false, 'multi on single should fail';
  exception when others then if sqlerrm like '%should fail%' then raise; end if; end;

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform public.vote_poll(pid, array[o2]);
  assert (select count(*) from public.poll_votes where option_id = o2) = 2, 'two votes on o2';
  perform public.vote_poll(pid, array[]::uuid[]);
  assert (select count(*) from public.poll_votes where poll_id = pid and user_id = b) = 0, 'withdraw';

  -- lezárt szavazásra nem lehet
  update public.polls set closes_at = now() - interval '1 minute' where id = pid;
  begin perform public.vote_poll(pid, array[o1]); assert false, 'closed should fail';
  exception when others then if sqlerrm like '%should fail%' then raise; end if; end;

  raise exception 'POLLS TESTS PASSED';
end $$;
