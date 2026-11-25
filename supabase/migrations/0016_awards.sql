-- Modul: Liga & díjak. A ranglista a 0013_xp league_standings view-ból jön;
-- itt a havi szavazós díjak (saját kategóriák) vannak. Eredmény: award_results view.

create table public.award_categories (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  title text not null check (char_length(title) between 1 and 40),
  created_by uuid not null references public.profiles on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.award_votes (
  category_id uuid not null references public.award_categories on delete cascade,
  group_id uuid not null references public.groups on delete cascade,
  month date not null,
  voter_id uuid not null references public.profiles on delete cascade default auth.uid(),
  nominee_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (category_id, month, voter_id),
  check (voter_id <> nominee_id),
  check (month = date_trunc('month', month))
);

create function public.award_category_group(cid uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select group_id from public.award_categories where id = cid
$$;
revoke execute on function public.award_category_group from public, anon;

alter table public.award_categories enable row level security;
alter table public.award_votes enable row level security;

create policy "award_categories: members read" on public.award_categories for select to authenticated
  using (public.is_group_member(group_id));
create policy "award_categories: members create" on public.award_categories for insert to authenticated
  with check (public.is_group_member(group_id) and created_by = (select auth.uid()));
create policy "award_categories: creator deletes" on public.award_categories for delete to authenticated
  using (created_by = (select auth.uid()));

-- csak a folyó hónapra, csak banda-tagra
create policy "award_votes: members read" on public.award_votes for select to authenticated
  using (public.is_group_member(group_id));
create policy "award_votes: own current month" on public.award_votes for insert to authenticated
  with check (voter_id = (select auth.uid()) and month = date_trunc('month', now())::date
    and group_id = public.award_category_group(category_id) and public.is_group_member(group_id)
    and exists (select 1 from public.group_members where group_id = award_votes.group_id and user_id = nominee_id));
create policy "award_votes: change current month" on public.award_votes for update to authenticated
  using (voter_id = (select auth.uid()) and month = date_trunc('month', now())::date)
  with check (voter_id = (select auth.uid()) and month = date_trunc('month', now())::date
    and exists (select 1 from public.group_members where group_id = award_votes.group_id and user_id = nominee_id));

-- havonta kategóriánként: jelölt, szavazat, helyezés (holtversenyben több első)
create view public.award_results with (security_invoker = true) as
select v.category_id, v.group_id, v.month, v.nominee_id, count(*)::integer as votes,
  rank() over (partition by v.category_id, v.month order by count(*) desc)::integer as place
from public.award_votes v
group by v.category_id, v.group_id, v.month, v.nominee_id;
