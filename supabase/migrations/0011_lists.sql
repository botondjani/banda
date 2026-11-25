-- Modul: Listák / Ajánló
create table public.lists (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  title text not null check (char_length(title) between 1 and 40),
  kind text not null default 'custom' check (kind in ('preset', 'custom')),
  preset_key text check (preset_key in ('film', 'series', 'book', 'restaurant')),
  created_by uuid references public.profiles on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (group_id, preset_key)
);

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists on delete cascade,
  group_id uuid not null references public.groups on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  url text check (url ~ '^https?://' and char_length(url) <= 500),
  note text check (char_length(note) <= 280),
  added_by uuid not null references public.profiles on delete cascade default auth.uid(),
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on public.list_items (list_id, created_at desc);

-- Sor = láttam / kipróbáltam; rating opcionális 1–5
create table public.list_marks (
  item_id uuid not null references public.list_items on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  group_id uuid not null references public.groups on delete cascade,
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (item_id, user_id)
);

create function public.list_group(lid uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select group_id from public.lists where id = lid
$$;
create function public.list_item_group(iid uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select group_id from public.list_items where id = iid
$$;
revoke execute on function public.list_group, public.list_item_group from public, anon;

alter table public.lists enable row level security;
alter table public.list_items enable row level security;
alter table public.list_marks enable row level security;

create policy "lists: members read" on public.lists for select to authenticated
  using (public.is_group_member(group_id));
create policy "lists: members create custom" on public.lists for insert to authenticated
  with check (public.is_group_member(group_id) and kind = 'custom' and preset_key is null and created_by = (select auth.uid()));
create policy "lists: creator deletes custom" on public.lists for delete to authenticated
  using (kind = 'custom' and created_by = (select auth.uid()));

create policy "list_items: members read" on public.list_items for select to authenticated
  using (public.is_group_member(group_id));
create policy "list_items: members add" on public.list_items for insert to authenticated
  with check (public.is_group_member(group_id) and group_id = public.list_group(list_id) and added_by = (select auth.uid()));
create policy "list_items: adder deletes" on public.list_items for delete to authenticated
  using (added_by = (select auth.uid()));

create policy "list_marks: members read" on public.list_marks for select to authenticated
  using (public.is_group_member(group_id));
create policy "list_marks: own insert" on public.list_marks for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_group_member(group_id) and group_id = public.list_item_group(item_id));
create policy "list_marks: own update" on public.list_marks for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and group_id = public.list_item_group(item_id));
create policy "list_marks: own delete" on public.list_marks for delete to authenticated
  using (user_id = (select auth.uid()));

-- Kész listák minden bandának (újaknál triggerrel, meglévőknél most)
create function public.create_preset_lists(gid uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.lists (group_id, title, kind, preset_key, created_by)
  values (gid, 'Filmek', 'preset', 'film', null), (gid, 'Sorozatok', 'preset', 'series', null),
         (gid, 'Könyvek', 'preset', 'book', null), (gid, 'Éttermek', 'preset', 'restaurant', null)
  on conflict (group_id, preset_key) do nothing
$$;

create function public.handle_new_group_lists() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.create_preset_lists(new.id);
  return new;
end $$;

create trigger on_group_created_lists after insert on public.groups
  for each row execute function public.handle_new_group_lists();

select public.create_preset_lists(id) from public.groups;

revoke execute on function public.create_preset_lists, public.handle_new_group_lists from public, anon, authenticated;
