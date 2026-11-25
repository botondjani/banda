-- Modul: Gyors szavazás. "Hova menjünk: A / B / C?", opcionális határidővel és több választással.
-- Szavazni csak a vote_poll RPC-vel lehet (lecseréli a saját szavazatokat, ellenőrzi a szabályokat).

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  question text not null check (char_length(question) between 1 and 140),
  multi boolean not null default false,
  closes_at timestamptz,
  created_by uuid not null references public.profiles on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.polls (group_id, created_at desc);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls on delete cascade,
  group_id uuid not null references public.groups on delete cascade,
  label text not null check (char_length(label) between 1 and 60),
  position integer not null
);

create table public.poll_votes (
  poll_id uuid not null references public.polls on delete cascade,
  option_id uuid not null references public.poll_options on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  group_id uuid not null references public.groups on delete cascade,
  created_at timestamptz not null default now(),
  primary key (option_id, user_id)
);
create index on public.poll_votes (poll_id);

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
create policy "polls: members read" on public.polls for select to authenticated using (public.is_group_member(group_id));
create policy "polls: creator deletes" on public.polls for delete to authenticated using (created_by = (select auth.uid()));
create policy "poll_options: members read" on public.poll_options for select to authenticated using (public.is_group_member(group_id));
create policy "poll_votes: members read" on public.poll_votes for select to authenticated using (public.is_group_member(group_id));

create function public.create_poll(gid uuid, question text, options text[], multi boolean default false, closes_at timestamptz default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare pid uuid;
begin
  if not public.is_group_member(gid) then raise exception 'not a member'; end if;
  if coalesce(array_length(options, 1), 0) not between 2 and 8 then raise exception 'need 2-8 options'; end if;
  if closes_at is not null and closes_at <= now() then raise exception 'closes in past'; end if;
  insert into public.polls (group_id, question, multi, closes_at) values (gid, question, multi, closes_at) returning id into pid;
  insert into public.poll_options (poll_id, group_id, label, position)
  select pid, gid, o, i from unnest(options) with ordinality as t(o, i);
  return pid;
end $$;

-- A saját szavazatok cseréje; üres tömb = visszavonás
create function public.vote_poll(pid uuid, option_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare p public.polls;
begin
  select * into p from public.polls where id = pid;
  if p.id is null or not public.is_group_member(p.group_id) then raise exception 'not found'; end if;
  if p.closes_at is not null and p.closes_at <= now() then raise exception 'closed'; end if;
  if not p.multi and coalesce(array_length(option_ids, 1), 0) > 1 then raise exception 'single choice'; end if;
  if exists (select 1 from unnest(option_ids) o where not exists (select 1 from public.poll_options where id = o and poll_id = pid)) then
    raise exception 'bad option';
  end if;
  delete from public.poll_votes where poll_id = pid and user_id = auth.uid();
  insert into public.poll_votes (poll_id, option_id, user_id, group_id)
  select pid, o, auth.uid(), p.group_id from unnest(option_ids) o;
end $$;

revoke execute on function public.create_poll, public.vote_poll from public, anon;

alter publication supabase_realtime add table public.poll_votes;

insert into public.xp_rules (module_id, type, points, daily_cap) values ('polls', 'poll_created', 2, 2);
