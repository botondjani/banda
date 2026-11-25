-- Modul: Kihívások. Heti kihívás, fotós bizonyíték, a többiek szavaznak az érvényességről.
-- Eldől, ha a beküldőn kívüli tagok többsége (floor(n/2)+1) ugyanúgy szavazott.

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  description text check (char_length(description) <= 280),
  ends_at timestamptz not null default now() + interval '7 days',
  created_by uuid not null references public.profiles on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.challenges (group_id, ends_at desc);

create table public.challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges on delete cascade,
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  photo_path text not null,
  note text check (char_length(note) <= 140),
  status text not null default 'pending' check (status in ('pending', 'valid', 'invalid')),
  created_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create table public.submission_votes (
  submission_id uuid not null references public.challenge_submissions on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  group_id uuid not null references public.groups on delete cascade,
  valid boolean not null,
  primary key (submission_id, user_id)
);

create function public.challenge_group(cid uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select group_id from public.challenges where id = cid and ends_at > now()
$$;
create function public.pending_submission_group(sid uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select group_id from public.challenge_submissions where id = sid and status = 'pending' and user_id <> auth.uid()
$$;
revoke execute on function public.challenge_group, public.pending_submission_group from public, anon;

alter table public.challenges enable row level security;
alter table public.challenge_submissions enable row level security;
alter table public.submission_votes enable row level security;

create policy "challenges: members read" on public.challenges for select to authenticated
  using (public.is_group_member(group_id));
create policy "challenges: members create" on public.challenges for insert to authenticated
  with check (public.is_group_member(group_id) and created_by = (select auth.uid()));

create policy "submissions: members read" on public.challenge_submissions for select to authenticated
  using (public.is_group_member(group_id));
-- csak élő kihívásra, a saját nevében, pending állapotban
create policy "submissions: own insert" on public.challenge_submissions for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and group_id = public.challenge_group(challenge_id)
    and public.is_group_member(group_id));
create policy "submissions: own delete pending" on public.challenge_submissions for delete to authenticated
  using (user_id = (select auth.uid()) and status = 'pending');

create policy "submission_votes: members read" on public.submission_votes for select to authenticated
  using (public.is_group_member(group_id));
-- saját beküldésre nem lehet, csak függőben lévőre
create policy "submission_votes: own insert" on public.submission_votes for insert to authenticated
  with check (user_id = (select auth.uid()) and group_id = public.pending_submission_group(submission_id));
create policy "submission_votes: own update" on public.submission_votes for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and group_id = public.pending_submission_group(submission_id));

create function public.handle_submission_vote() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  s public.challenge_submissions;
  need integer;
  yes integer;
  no integer;
  title text;
begin
  select * into s from public.challenge_submissions where id = new.submission_id for update;
  if s.status <> 'pending' then return new; end if;
  need := (select count(*) - 1 from public.group_members where group_id = s.group_id) / 2 + 1;
  select count(*) filter (where valid), count(*) filter (where not valid) into yes, no
    from public.submission_votes where submission_id = s.id;
  title := (select c.title from public.challenges c where c.id = s.challenge_id);

  if yes >= need then
    update public.challenge_submissions set status = 'valid' where id = s.id;
    insert into public.activity (group_id, actor_id, module_id, type, ref_id, payload)
    values (s.group_id, s.user_id, 'challenges', 'challenge_completed', s.challenge_id, jsonb_build_object(
      'title', title, 'notify_text', 'teljesítette a kihívást: ' || title || '!', 'notify_url', '/m/challenges'));
  elsif no >= need then
    update public.challenge_submissions set status = 'invalid' where id = s.id;
    insert into public.notifications (user_id, group_id, type, payload)
    select s.user_id, s.group_id, 'challenge_rejected', jsonb_build_object(
      'title', (select name from public.groups where id = s.group_id),
      'body', 'A többiek szerint nem ér: ' || title || '. Próbáld újra legközelebb.',
      'url', '/m/challenges')
    where not exists (select 1 from public.notification_prefs where user_id = s.user_id and type = 'challenge_rejected' and not enabled);
  end if;
  return new;
end $$;

create trigger on_submission_vote after insert or update on public.submission_votes
  for each row execute function public.handle_submission_vote();
revoke execute on function public.handle_submission_vote from public, anon, authenticated;

-- Fotók: privát bucket, útvonal <group_id>/<user_id>/<fájl>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('challenges', 'challenges', false, 1048576, array['image/webp', 'image/jpeg']);

create policy "challenges bucket: members read" on storage.objects for select to authenticated
  using (bucket_id = 'challenges' and public.is_group_member(((storage.foldername(name))[1])::uuid));
create policy "challenges bucket: own upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'challenges' and public.is_group_member(((storage.foldername(name))[1])::uuid)
    and (storage.foldername(name))[2] = (select auth.uid())::text);

insert into public.xp_rules (module_id, type, points, daily_cap) values
  ('challenges', 'challenge_created', 2, 1),
  ('challenges', 'challenge_submitted', 2, 3),
  ('challenges', 'challenge_completed', 20, null);
insert into public.badge_rules (key, label, description, module_id, type, threshold) values
  ('challenger', 'Kihívásfaló', '3 kihívást teljesített', 'challenges', 'challenge_completed', 3);
