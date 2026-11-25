-- Emlékeztető szövege: nevekhez nem fűzünk ragot
create or replace function public.lending_reminders(d date default (now() at time zone 'Europe/Budapest')::date) returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  with due as (
    update public.loans l set reminded_on = d
    where l.status = 'active' and l.due_date < d and (l.reminded_on is null or l.reminded_on < d)
    returning l.*
  ), info as (
    select due.*, i.name, i.owner_id, g.name as group_name,
      (select display_name from public.profiles where id = i.owner_id) as owner_name,
      (select display_name from public.profiles where id = due.borrower_id) as borrower_name
    from due join public.lend_items i on i.id = due.item_id join public.groups g on g.id = due.group_id
  ), ins as (
    insert into public.notifications (user_id, group_id, type, payload)
    select user_id, group_id, 'loan_overdue', jsonb_build_object('title', group_name, 'body', body, 'url', '/m/lending')
    from (
      select borrower_id as user_id, group_id, group_name, 'Lejárt a határidő: ' || name || ' (gazdája: ' || owner_name || '). Ideje visszavinni.' as body from info
      union all
      select owner_id, group_id, group_name, 'Lejárt a határidő: ' || name || ' (nála van: ' || borrower_name || ').' from info
    ) x
    where not exists (select 1 from public.notification_prefs p where p.user_id = x.user_id and p.type = 'loan_overdue' and not p.enabled)
    returning 1
  )
  select count(*) into n from due;
  return n;
end $$;
