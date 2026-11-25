-- Általános értesítés modul-eseményekhez: ha az activity payloadja tartalmaz
-- notify_text-et, a trigger értesítést készít ("<szereplő> <notify_text>").
-- notify_to: csak egy címzett (pl. a ráérés gazdája); notify_url: kattintási cél.
create or replace function public.handle_activity_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  actor_name text := (select display_name from public.profiles where id = new.actor_id);
  group_name text := (select name from public.groups where id = new.group_id);
  body text;
  url text := coalesce(new.payload->>'notify_url', '/');
  recipient uuid := (new.payload->>'notify_to')::uuid;
begin
  case new.type
    when 'program_created' then
      body := actor_name || ' programot szervez: ' || (new.payload->>'title');
      url := '/programs/' || new.ref_id;
    when 'member_joined' then
      body := actor_name || ' csatlakozott a bandához.';
    else
      if new.payload ? 'notify_text' then body := actor_name || ' ' || (new.payload->>'notify_text'); end if;
  end case;
  if body is null then return new; end if;

  if recipient is null then
    perform public.notify_group(new.group_id, new.actor_id, new.type, jsonb_build_object('title', group_name, 'body', body, 'url', url));
  elsif recipient <> new.actor_id
    and exists (select 1 from public.group_members where group_id = new.group_id and user_id = recipient)
    and not exists (select 1 from public.notification_prefs where user_id = recipient and type = new.type and not enabled) then
    insert into public.notifications (user_id, group_id, type, payload)
    values (recipient, new.group_id, new.type, jsonb_build_object('title', group_name, 'body', body, 'url', url));
  end if;
  return new;
end $$;
