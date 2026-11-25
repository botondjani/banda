-- Modul: Emlékek. Programonkénti album (privát bucket), "Egy éve ma" napi job (pg_cron),
-- év végi Wrapped: minden szám a wrapped() SQL függvényből jön.

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  program_id uuid not null references public.programs on delete cascade,
  path text not null unique,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 512000),
  taken_at timestamptz,
  uploaded_by uuid not null references public.profiles on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.photos (program_id, created_at);
create index on public.photos (group_id, created_at);

alter table public.photos enable row level security;
create policy "photos: members read" on public.photos for select to authenticated
  using (public.is_group_member(group_id));
create policy "photos: members upload" on public.photos for insert to authenticated
  with check (uploaded_by = (select auth.uid()) and public.is_group_member(group_id) and group_id = public.program_group(program_id));
create policy "photos: uploader deletes" on public.photos for delete to authenticated
  using (uploaded_by = (select auth.uid()));

-- <group_id>/<program_id>/<user_id>-<idő>.webp, max 500 KB
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memories', 'memories', false, 512000, array['image/webp', 'image/jpeg']);
create policy "memories bucket: members read" on storage.objects for select to authenticated
  using (bucket_id = 'memories' and public.is_group_member(((storage.foldername(name))[1])::uuid));
create policy "memories bucket: members upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'memories' and public.is_group_member(((storage.foldername(name))[1])::uuid)
    and public.program_group(((storage.foldername(name))[2])::uuid) = ((storage.foldername(name))[1])::uuid);
create policy "memories bucket: uploader deletes" on storage.objects for delete to authenticated
  using (bucket_id = 'memories' and owner_id = (select auth.uid())::text);

-- "Egy éve ma": a megadott napon pontosan egy éve volt programokról feed-esemény + értesítés.
-- Idempotens (egy programról egyszer). pg_cron hívja naponta; teszthez dátum adható.
create function public.memories_daily(d date default (now() at time zone 'Europe/Budapest')::date) returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  insert into public.activity (group_id, actor_id, module_id, type, ref_id, payload)
  select p.group_id, p.created_by, 'memories', 'one_year_ago', p.id, jsonb_build_object(
    'title', p.title,
    'photos', (select count(*) from public.photos ph where ph.program_id = p.id),
    'notify_text', 'egy éve ma szervezte: ' || p.title || '. Emlékszel?',
    'notify_url', '/programs/' || p.id)
  from public.programs p
  where p.status in ('planned', 'done')
    and (p.starts_at at time zone 'Europe/Budapest')::date = (d - interval '1 year')::date
    and not exists (select 1 from public.activity a where a.ref_id = p.id and a.type = 'one_year_ago');
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.memories_daily from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('memories-daily', '7 6 * * *', 'select public.memories_daily()');

-- Wrapped: egy év számai egy bandára
create function public.wrapped(gid uuid, yr integer) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  t0 timestamptz := make_timestamptz(yr, 1, 1, 0, 0, 0, 'Europe/Budapest');
  t1 timestamptz := make_timestamptz(yr + 1, 1, 1, 0, 0, 0, 'Europe/Budapest');
  res jsonb;
begin
  if not public.is_group_member(gid) then raise exception 'not a member'; end if;
  with
  progs as (select * from public.programs where group_id = gid and status in ('planned', 'done') and coalesce(starts_at, created_at) >= t0 and coalesce(starts_at, created_at) < t1),
  name_of as (select id, display_name from public.profiles)
  select jsonb_build_object(
    'year', yr,
    'programs', (select count(*) from progs),
    'top_attendee', (select jsonb_build_object('name', n.display_name, 'count', count(*)) from public.program_attendees a join progs p on p.id = a.program_id join name_of n on n.id = a.user_id
                     where a.status = 'going' group by n.display_name order by count(*) desc, n.display_name limit 1),
    'photos', (select count(*) from public.photos where group_id = gid and created_at >= t0 and created_at < t1),
    'top_photographer', (select jsonb_build_object('name', n.display_name, 'count', count(*)) from public.photos ph join name_of n on n.id = ph.uploaded_by
                         where ph.group_id = gid and ph.created_at >= t0 and ph.created_at < t1 group by n.display_name order by count(*) desc, n.display_name limit 1),
    'spent', (select coalesce(sum(amount), 0) from public.expenses where group_id = gid and created_at >= t0 and created_at < t1),
    'biggest_expense', (select jsonb_build_object('title', title, 'amount', amount) from public.expenses where group_id = gid and created_at >= t0 and created_at < t1 order by amount desc, created_at limit 1),
    'pings', (select count(*) from public.availability_pings where group_id = gid and created_at >= t0 and created_at < t1),
    'top_tag', (select tag from public.availability_pings where group_id = gid and created_at >= t0 and created_at < t1 group by tag order by count(*) desc, tag limit 1),
    'draws', (select count(*) from public.draws where group_id = gid and created_at >= t0 and created_at < t1),
    'top_payer', (select jsonb_build_object('name', result->>'name', 'count', count(*)) from public.draws where group_id = gid and kind = 'pay' and created_at >= t0 and created_at < t1
                  group by result->>'name' order by count(*) desc, result->>'name' limit 1),
    'challenges_completed', (select count(*) from public.challenge_submissions where group_id = gid and status = 'valid' and created_at >= t0 and created_at < t1),
    'bets', (select count(*) from public.bets where group_id = gid and status = 'resolved' and created_at >= t0 and created_at < t1),
    'top_xp', (select jsonb_build_object('name', n.display_name, 'xp', sum(l.points)) from public.xp_ledger l join name_of n on n.id = l.user_id
               where l.group_id = gid and l.created_at >= t0 and l.created_at < t1 group by n.display_name order by sum(l.points) desc, n.display_name limit 1),
    'top_item', (select jsonb_build_object('title', i.title, 'rating', round(avg(m.rating), 1)) from public.list_items i join public.list_marks m on m.item_id = i.id
                 where i.group_id = gid and m.rating is not null and m.created_at >= t0 and m.created_at < t1 group by i.id, i.title order by avg(m.rating) desc, count(*) desc limit 1)
  ) into res;
  return res;
end $$;
revoke execute on function public.wrapped from public, anon;

insert into public.xp_rules (module_id, type, points, daily_cap) values ('memories', 'photos_added', 2, 3);
insert into public.badge_rules (key, label, description, module_id, type, threshold) values
  ('photographer', 'Fotós', '10-szer töltött fel képeket', 'memories', 'photos_added', 10);
