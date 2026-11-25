-- Modul: Ki mit hoz
create table public.bring_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  program_id uuid not null references public.programs on delete cascade,
  kind text not null check (kind in ('consumable', 'gear')),
  name text not null check (char_length(name) between 1 and 60),
  qty text check (char_length(qty) <= 20),
  claimed_by uuid references public.profiles on delete set null,
  done boolean not null default false,
  created_by uuid not null references public.profiles on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.bring_items (program_id, created_at);

alter table public.bring_items enable row level security;

-- Baráti kör: bármelyik tag vállalhat, kipipálhat, törölhet
create policy "bring_items: members read" on public.bring_items for select to authenticated
  using (public.is_group_member(group_id));
create policy "bring_items: members insert" on public.bring_items for insert to authenticated
  with check (public.is_group_member(group_id) and created_by = (select auth.uid())
    and group_id = public.program_group(program_id));
create policy "bring_items: members update" on public.bring_items for update to authenticated
  using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));
create policy "bring_items: members delete" on public.bring_items for delete to authenticated
  using (public.is_group_member(group_id));

alter publication supabase_realtime add table public.bring_items;
