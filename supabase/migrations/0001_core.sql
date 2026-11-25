-- Mag: profilok, csoportok, programok, feed (activity, reakciók, kommentek)

-- Profilok ------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar_url text,
  color smallint not null default 0 check (color between 0 and 7),
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, avatar_url, color)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 40),
    new.raw_user_meta_data->>'avatar_url',
    floor(random() * 8)::smallint
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- meglévő userek
insert into public.profiles (id, display_name, avatar_url, color)
select id,
  left(coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)), 40),
  raw_user_meta_data->>'avatar_url',
  floor(random() * 8)::smallint
from auth.users
on conflict do nothing;

-- Csoportok -----------------------------------------------------------------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  invite_code text not null unique default encode(extensions.gen_random_bytes(9), 'hex'),
  created_by uuid not null references public.profiles default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index on public.group_members (user_id);

create function public.is_group_member(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.group_members where group_id = gid and user_id = auth.uid())
$$;

create function public.is_group_owner(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.group_members where group_id = gid and user_id = auth.uid() and role = 'owner')
$$;

create function public.shares_group(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.group_members a
    join public.group_members b on a.group_id = b.group_id
    where a.user_id = auth.uid() and b.user_id = uid
  )
$$;

create table public.group_modules (
  group_id uuid not null references public.groups on delete cascade,
  module_id text not null,
  enabled boolean not null default true,
  settings jsonb not null default '{}',
  primary key (group_id, module_id)
);

-- Programok -----------------------------------------------------------------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  status text not null default 'planned' check (status in ('idea', 'planned', 'done', 'cancelled')),
  created_by uuid not null references public.profiles default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.programs (group_id, starts_at);

create table public.program_attendees (
  program_id uuid not null references public.programs on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  status text not null check (status in ('going', 'maybe', 'no')),
  primary key (program_id, user_id)
);

create function public.program_group(pid uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select group_id from public.programs where id = pid
$$;

-- a létrehozó automatikusan megy
create function public.handle_new_program() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.program_attendees (program_id, user_id, status) values (new.id, new.created_by, 'going');
  return new;
end $$;

create trigger on_program_created after insert on public.programs
  for each row execute function public.handle_new_program();

-- Feed ----------------------------------------------------------------------
create table public.activity (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  actor_id uuid not null references public.profiles on delete cascade default auth.uid(),
  module_id text not null default 'core',
  type text not null,
  ref_id uuid,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on public.activity (group_id, created_at desc);

create function public.activity_group(aid uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select group_id from public.activity where id = aid
$$;

create table public.reactions (
  activity_id uuid not null references public.activity on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  emoji text not null check (char_length(emoji) between 1 and 8),
  primary key (activity_id, user_id, emoji)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activity on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index on public.comments (activity_id, created_at);

-- RPC-k ---------------------------------------------------------------------
create function public.create_group(group_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare gid uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.groups (name, created_by) values (group_name, auth.uid()) returning id into gid;
  insert into public.group_members (group_id, user_id, role) values (gid, auth.uid(), 'owner');
  return gid;
end $$;

create function public.join_group(code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare gid uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select id into gid from public.groups where invite_code = code;
  if gid is null then raise exception 'invalid invite code'; end if;
  insert into public.group_members (group_id, user_id) values (gid, auth.uid()) on conflict do nothing;
  if found then
    insert into public.activity (group_id, actor_id, type) values (gid, auth.uid(), 'member_joined');
  end if;
  return gid;
end $$;

create function public.reset_invite_code(gid uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare code text;
begin
  if not public.is_group_owner(gid) then raise exception 'not allowed'; end if;
  update public.groups set invite_code = encode(extensions.gen_random_bytes(9), 'hex') where id = gid returning invite_code into code;
  return code;
end $$;

revoke execute on function public.create_group, public.join_group, public.reset_invite_code from public, anon;

-- RLS -----------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_modules enable row level security;
alter table public.programs enable row level security;
alter table public.program_attendees enable row level security;
alter table public.activity enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;

create policy "profiles: self or shared group" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_group(id));
create policy "profiles: update self" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "groups: members read" on public.groups for select to authenticated
  using (public.is_group_member(id));
create policy "groups: owner updates" on public.groups for update to authenticated
  using (public.is_group_owner(id)) with check (public.is_group_owner(id));

create policy "group_members: members read" on public.group_members for select to authenticated
  using (public.is_group_member(group_id));
create policy "group_members: leave or owner removes" on public.group_members for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_group_owner(group_id));

create policy "group_modules: members read" on public.group_modules for select to authenticated
  using (public.is_group_member(group_id));
create policy "group_modules: members insert" on public.group_modules for insert to authenticated
  with check (public.is_group_member(group_id));
create policy "group_modules: members update" on public.group_modules for update to authenticated
  using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));

create policy "programs: members read" on public.programs for select to authenticated
  using (public.is_group_member(group_id));
create policy "programs: members create" on public.programs for insert to authenticated
  with check (public.is_group_member(group_id) and created_by = (select auth.uid()));
create policy "programs: creator updates" on public.programs for update to authenticated
  using (created_by = (select auth.uid())) with check (public.is_group_member(group_id));
create policy "programs: creator deletes" on public.programs for delete to authenticated
  using (created_by = (select auth.uid()));

create policy "attendees: members read" on public.program_attendees for select to authenticated
  using (public.is_group_member(public.program_group(program_id)));
create policy "attendees: self insert" on public.program_attendees for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_group_member(public.program_group(program_id)));
create policy "attendees: self update" on public.program_attendees for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "attendees: self delete" on public.program_attendees for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "activity: members read" on public.activity for select to authenticated
  using (public.is_group_member(group_id));
create policy "activity: members emit" on public.activity for insert to authenticated
  with check (public.is_group_member(group_id) and actor_id = (select auth.uid()));

create policy "reactions: members read" on public.reactions for select to authenticated
  using (public.is_group_member(public.activity_group(activity_id)));
create policy "reactions: self insert" on public.reactions for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_group_member(public.activity_group(activity_id)));
create policy "reactions: self delete" on public.reactions for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "comments: members read" on public.comments for select to authenticated
  using (public.is_group_member(public.activity_group(activity_id)));
create policy "comments: self insert" on public.comments for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_group_member(public.activity_group(activity_id)));
create policy "comments: self delete" on public.comments for delete to authenticated
  using (user_id = (select auth.uid()));

-- Realtime: csak a feed ------------------------------------------------------
alter publication supabase_realtime add table public.activity, public.reactions, public.comments;

-- Avatarok (mindig új fájlnév, ezért csak insert kell) ---------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 512000, array['image/webp', 'image/jpeg', 'image/png']);

create policy "avatars: own folder insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
