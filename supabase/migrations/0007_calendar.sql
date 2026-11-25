-- Modul: Ki ér rá?
create table public.free_days (
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  day date not null,
  state text not null check (state in ('free', 'maybe', 'busy')),
  primary key (group_id, user_id, day)
);

alter table public.free_days enable row level security;

create policy "free_days: members read" on public.free_days for select to authenticated
  using (public.is_group_member(group_id));
create policy "free_days: own insert" on public.free_days for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_group_member(group_id));
create policy "free_days: own update" on public.free_days for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "free_days: own delete" on public.free_days for delete to authenticated
  using (user_id = (select auth.uid()));
