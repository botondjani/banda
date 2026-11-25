-- Kölcsönző teszt (rollback-kel, 'LENDING TESTS PASSED' kivétellel végződik)
do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  gid uuid; iid uuid; lid uuid;
begin
  insert into auth.users (id, aud, role, email) values (a, 'authenticated', 'authenticated', 'la@x.test'), (b, 'authenticated', 'authenticated', 'lb@x.test');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  gid := public.create_group('Kölcsönteszt');
  insert into public.group_members (group_id, user_id) values (gid, b);
  insert into public.lend_items (group_id, owner_id, name) values (gid, a, 'Sátor') returning id into iid;

  -- saját tárgyat nem lehet kérni
  begin perform public.request_loan(iid, current_date + 3); assert false, 'own item should fail';
  exception when others then if sqlerrm like '%should fail%' then raise; end if; end;

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  lid := public.request_loan(iid, current_date + 3);
  -- egyszerre csak egy nyitott kérés
  begin perform public.request_loan(iid, current_date + 5); assert false, 'second open loan should fail';
  exception when others then if sqlerrm like '%should fail%' then raise; end if; end;
  -- nem a gazda nem hagyhatja jóvá
  begin perform public.respond_loan(lid, true); assert false, 'borrower approve should fail';
  exception when others then if sqlerrm like '%should fail%' then raise; end if; end;

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.respond_loan(lid, true);
  assert (select status from public.loans where id = lid) = 'active', 'approved';

  -- határidő előtt nincs emlékeztető, utána igen, naponta egyszer
  assert public.lending_reminders(current_date + 3) = 0, 'not overdue on due date';
  assert public.lending_reminders(current_date + 4) = 1, 'overdue reminded';
  assert public.lending_reminders(current_date + 4) = 0, 'once per day';
  assert (select count(*) from public.notifications where group_id = gid and type = 'loan_overdue') = 2, 'borrower + owner notified';
  assert public.lending_reminders(current_date + 5) = 1, 'next day again';

  perform public.return_loan(lid);
  assert (select status from public.loans where id = lid) = 'returned', 'returned';
  assert public.lending_reminders(current_date + 6) = 0, 'no reminder after return';
  -- visszaadás után újra kölcsönkérhető
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform public.request_loan(iid, current_date + 2);

  raise exception 'LENDING TESTS PASSED';
end $$;
