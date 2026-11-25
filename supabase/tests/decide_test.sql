-- Döntéssegítő teszt (rollback-kel, 'DECIDE TESTS PASSED' kivétellel végződik)
do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  gid uuid; did uuid; r jsonb; i integer;
begin
  -- rand_int tartomány
  for i in 1..200 loop
    assert public.rand_int(6) between 0 and 5, 'rand_int range';
  end loop;
  -- keverés: ugyanazok az elemek
  assert (select jsonb_agg(v order by v) from jsonb_array_elements(public.shuffle_jsonb('["a","b","c","d"]')) v) = '["a","b","c","d"]', 'shuffle keeps items';

  insert into auth.users (id, aud, role, email) values (a, 'authenticated', 'authenticated', 'da@x.test'), (b, 'authenticated', 'authenticated', 'db@x.test');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  gid := public.create_group('Sorsteszt');
  insert into public.group_members (group_id, user_id) values (gid, b);

  did := public.draw(gid, 'wheel', '{"items":["pizza","gyros","sushi"]}'); r := (select result from public.draws where id = did);
  assert r->>'value' in ('pizza', 'gyros', 'sushi') and (r->>'index')::int between 0 and 2, 'wheel';
  did := public.draw(gid, 'coin'); r := (select result from public.draws where id = did);
  assert r->>'side' in ('fej', 'írás'), 'coin';
  did := public.draw(gid, 'dice', '{"count":3}'); r := (select result from public.draws where id = did);
  assert jsonb_array_length(r->'rolls') = 3 and (select bool_and(v::int between 1 and 6) from jsonb_array_elements_text(r->'rolls') v), 'dice';
  did := public.draw(gid, 'number', '{"min":10,"max":12}'); r := (select result from public.draws where id = did);
  assert (r->>'value')::int between 10 and 12, 'number';
  did := public.draw(gid, 'shuffle', '{"items":["a","b","c"]}'); r := (select result from public.draws where id = did);
  assert jsonb_array_length(r->'order') = 3, 'shuffle';
  did := public.draw(gid, 'teams', '{"items":["a","b","c","d","e"],"teams":2}'); r := (select result from public.draws where id = did);
  assert jsonb_array_length(r->'teams') = 2 and (select sum(jsonb_array_length(t)) from jsonb_array_elements(r->'teams') t) = 5, 'teams';
  did := public.draw(gid, 'pay'); r := (select result from public.draws where id = did);
  assert (r->>'user_id')::uuid in (a, b), 'pay';
  did := public.draw(gid, 'pay', jsonb_build_object('user_ids', jsonb_build_array(b))); r := (select result from public.draws where id = did);
  assert (r->>'user_id')::uuid = b, 'pay subset';

  -- minden húzásnak van feed-eseménye
  assert (select count(*) from public.activity where group_id = gid and type = 'draw') = 8, 'activity per draw';
  -- a fizető húzás értesítést készít a másik tagnak
  assert (select count(*) from public.notifications where group_id = gid and type = 'draw') >= 1, 'pay notifies';

  begin
    perform public.draw(gid, 'wheel', '{"items":["egy"]}');
    assert false, 'wheel with 1 item should fail';
  exception when others then
    if sqlerrm like '%should fail%' then raise; end if;
  end;

  raise exception 'DECIDE TESTS PASSED';
end $$;
