-- Modul: Ráérek most
create table public.availability_pings (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  tag text not null check (char_length(tag) between 1 and 30),
  note text check (char_length(note) <= 140),
  until timestamptz not null,
  program_id uuid references public.programs on delete set null,
  created_at timestamptz not null default now()
);
create index on public.availability_pings (group_id, until);

create table public.ping_joins (
  ping_id uuid not null references public.availability_pings on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ping_id, user_id)
);

alter table public.availability_pings enable row level security;
alter table public.ping_joins enable row level security;

create policy "pings: members read" on public.availability_pings for select to authenticated
  using (public.is_group_member(group_id));
create policy "pings: members create own" on public.availability_pings for insert to authenticated
  with check (public.is_group_member(group_id) and user_id = (select auth.uid()));
create policy "pings: delete own" on public.availability_pings for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "ping_joins: members read" on public.ping_joins for select to authenticated
  using (exists (select 1 from public.availability_pings p where p.id = ping_id and public.is_group_member(p.group_id)));

-- "Én is": csatlakozás; az első csatlakozónál program készül a gazdával együtt.
create function public.join_ping(pid uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  p public.availability_pings;
  prog uuid;
begin
  select * into p from public.availability_pings where id = pid;
  if p.id is null or not public.is_group_member(p.group_id) then raise exception 'not found'; end if;
  if p.user_id = auth.uid() then raise exception 'own ping'; end if;
  if p.until < now() then raise exception 'expired'; end if;

  insert into public.ping_joins (ping_id, user_id) values (pid, auth.uid()) on conflict do nothing;

  prog := p.program_id;
  if prog is null then
    -- a gazdát a programs trigger veszi fel résztvevőnek
    insert into public.programs (group_id, title, created_by)
    values (p.group_id, upper(left(p.tag, 1)) || substr(p.tag, 2), p.user_id)
    returning id into prog;
    update public.availability_pings set program_id = prog where id = pid;
  end if;

  insert into public.program_attendees (program_id, user_id, status) values (prog, auth.uid(), 'going')
  on conflict (program_id, user_id) do update set status = 'going';
  return prog;
end $$;
revoke execute on function public.join_ping from public, anon;
