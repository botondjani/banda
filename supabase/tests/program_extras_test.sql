-- Program-extrák teszt (rollback-kel, 'PROGRAM EXTRAS TESTS PASSED' kivétellel végződik)
do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  gid uuid; pid uuid; rid uuid;
begin
  insert into auth.users (id, aud, role, email) values (a, 'authenticated', 'authenticated', 'pa@x.test'), (b, 'authenticated', 'authenticated', 'pb@x.test');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  gid := public.create_group('Extrateszt');
  insert into public.group_members (group_id, user_id) values (gid, b);

  -- program 2026-06-14 19:00 (Budapest), b is megy
  insert into public.programs (group_id, title, starts_at, location, created_by) values (gid, 'Grill', '2026-06-14 19:00+02', 'Kert', a) returning id into pid;
  insert into public.program_attendees (program_id, user_id, status) values (pid, b, 'going');

  -- előző este 17:30: még nem; 18:05: igen (a + b), másodszor nem
  assert public.program_reminders('2026-06-13 17:30+02') = 0, 'too early for eve';
  assert public.program_reminders('2026-06-13 18:05+02') = 1, 'eve reminder';
  assert public.program_reminders('2026-06-13 18:20+02') = 0, 'eve once';
  assert (select count(*) from public.notifications where group_id = gid and type = 'program_reminder') = 2, 'both attendees';
  assert (select payload->>'body' from public.notifications where group_id = gid and type = 'program_reminder' limit 1) like 'Holnap 19:00%', 'eve text';
  -- kezdés előtt 3 órával még nem, 2 órával igen
  assert public.program_reminders('2026-06-14 16:00+02') = 0, 'too early for soon';
  assert public.program_reminders('2026-06-14 17:00+02') = 1, 'soon reminder';
  assert public.program_reminders('2026-06-14 17:15+02') = 0, 'soon once';

  -- beszélgetés: a ír -> b értesül, a nem
  insert into public.program_comments (program_id, group_id, user_id, body) values (pid, gid, a, 'Hozok szenet');
  assert (select count(*) from public.notifications where type = 'program_comment' and user_id = b) = 1, 'attendee notified';
  assert (select count(*) from public.notifications where type = 'program_comment' and user_id = a) = 0, 'author not notified';

  -- ismétlődés: heti sorozat, a következő 7 nappal később
  insert into public.programs (group_id, title, starts_at, created_by, recurrence) values (gid, 'Foci', '2026-06-10 18:00+02', a, 'weekly') returning id into rid;
  assert (select series_id from public.programs where id = rid) = rid, 'series id = first id';
  assert public.recurring_programs('2026-06-01') = 0, 'too early';
  assert public.recurring_programs('2026-06-09') = 1, 'next created';
  assert public.recurring_programs('2026-06-09') = 0, 'not twice';
  assert (select max(starts_at) from public.programs where series_id = rid) = '2026-06-17 18:00+02', 'one week later';
  -- leállítás: recurrence null a sorozaton -> nincs több
  update public.programs set recurrence = null where series_id = rid;
  assert public.recurring_programs('2026-06-16') = 0, 'stopped';

  raise exception 'PROGRAM EXTRAS TESTS PASSED';
end $$;
