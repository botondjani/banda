-- Emlékek teszt (rollback-kel, 'MEMORIES TESTS PASSED' kivétellel végződik)
do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  gid uuid; pid uuid; w jsonb; n integer;
begin
  insert into auth.users (id, aud, role, email) values (a, 'authenticated', 'authenticated', 'ma@x.test'), (b, 'authenticated', 'authenticated', 'mb@x.test');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  gid := public.create_group('Emlékteszt');
  insert into public.group_members (group_id, user_id) values (gid, b);

  -- program 2025-06-14-én, két fotóval
  insert into public.programs (group_id, title, starts_at, created_by) values (gid, 'Balaton', '2025-06-14 18:00+02', a) returning id into pid;
  insert into public.program_attendees (program_id, user_id, status) values (pid, b, 'going');
  insert into public.photos (group_id, program_id, path, size_bytes, uploaded_by, created_at) values
    (gid, pid, gid || '/' || pid || '/1.webp', 300000, b, '2025-06-15'), (gid, pid, gid || '/' || pid || '/2.webp', 400000, b, '2025-06-15');

  -- Egy éve ma: teszt-dátummal
  assert public.memories_daily('2026-06-13') = 0, 'wrong day: nothing';
  n := public.memories_daily('2026-06-14');
  assert n = 1, 'one year ago found';
  assert public.memories_daily('2026-06-14') = 0, 'idempotent';
  assert (select payload->>'photos' from public.activity where ref_id = pid and type = 'one_year_ago') = '2', 'photo count in payload';
  assert (select count(*) from public.notifications where group_id = gid and type = 'one_year_ago') = 1, 'notified (not the creator)';

  -- Wrapped 2025 == közvetlen lekérdezések
  insert into public.expenses (group_id, title, amount, paid_by, split_mode, created_at) values (gid, 'Szállás', 60000, a, 'equal', '2025-06-14'), (gid, 'Kaja', 12000, b, 'equal', '2025-06-15');
  w := public.wrapped(gid, 2025);
  assert (w->>'programs')::int = (select count(*) from public.programs where group_id = gid and starts_at >= '2025-01-01' and starts_at < '2026-01-01'), 'programs';
  assert (w->>'photos')::int = 2, 'photos';
  assert w->'top_photographer'->>'name' = (select display_name from public.profiles where id = b), 'top photographer';
  assert (w->>'spent')::int = 72000, 'spent';
  assert w->'biggest_expense'->>'title' = 'Szállás', 'biggest expense';
  assert (w->'top_attendee'->>'count')::int = 1, 'top attendee';
  assert (public.wrapped(gid, 2024)->>'programs')::int = 0, 'other year empty';

  raise exception 'MEMORIES TESTS PASSED';
end $$;
