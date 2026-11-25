-- Modul: Ötletbank. Ötlet = programs.status 'idea'. Ha a "benne" szavazatok elérik
-- a küszöböt, a szerver programmá teszi (planned), a benne-szavazókat felveszi
-- résztvevőnek, és feed-eseményt + értesítést készít.
-- Küszöb: group_modules.settings.threshold (ideas), alapból least(3, létszám).

create table public.idea_votes (
  program_id uuid not null references public.programs on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  group_id uuid not null references public.groups on delete cascade,
  vote text not null check (vote in ('in', 'pass')),
  created_at timestamptz not null default now(),
  primary key (program_id, user_id)
);

alter table public.idea_votes enable row level security;

create policy "idea_votes: members read" on public.idea_votes for select to authenticated
  using (public.is_group_member(group_id));
create policy "idea_votes: own insert" on public.idea_votes for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_group_member(group_id) and group_id = public.program_group(program_id));
create policy "idea_votes: own update" on public.idea_votes for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and group_id = public.program_group(program_id));
create policy "idea_votes: own delete" on public.idea_votes for delete to authenticated
  using (user_id = (select auth.uid()));

create function public.idea_threshold(gid uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select (settings->>'threshold')::integer from public.group_modules where group_id = gid and module_id = 'ideas'),
    least(3, (select count(*)::integer from public.group_members where group_id = gid)))
$$;
revoke execute on function public.idea_threshold from public, anon;

create function public.handle_idea_vote() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  p public.programs;
begin
  if new.vote <> 'in' then return new; end if;
  select * into p from public.programs where id = new.program_id for update;
  if p.status <> 'idea' then return new; end if;
  if (select count(*) from public.idea_votes where program_id = p.id and vote = 'in') < public.idea_threshold(p.group_id) then
    return new;
  end if;

  update public.programs set status = 'planned' where id = p.id;
  insert into public.program_attendees (program_id, user_id, status)
  select p.id, v.user_id, 'going' from public.idea_votes v where v.program_id = p.id and v.vote = 'in'
  on conflict (program_id, user_id) do update set status = 'going';
  insert into public.activity (group_id, actor_id, module_id, type, ref_id, payload)
  values (p.group_id, new.user_id, 'ideas', 'idea_planned', p.id, jsonb_build_object(
    'title', p.title,
    'notify_text', 'szavazatával összejött: ' || p.title || '. Lesz belőle program!',
    'notify_url', '/programs/' || p.id));
  return new;
end $$;

create trigger on_idea_vote after insert or update on public.idea_votes
  for each row execute function public.handle_idea_vote();

revoke execute on function public.handle_idea_vote from public, anon, authenticated;
