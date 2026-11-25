-- Modul: Döntéssegítő. Hiteles sorsolás: az eredményt a szerver húzza (kriptografikus
-- véletlen), a draws táblába csak a draw() RPC írhat, és ugyanabban a tranzakcióban
-- feed-esemény is készül. A feed az eredményt a draws táblából olvassa.

create table public.draws (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  kind text not null check (kind in ('wheel', 'coin', 'dice', 'number', 'shuffle', 'teams', 'pay')),
  options jsonb not null default '{}',
  result jsonb not null,
  created_by uuid not null references public.profiles on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.draws (group_id, created_at desc);

alter table public.draws enable row level security;
create policy "draws: members read" on public.draws for select to authenticated
  using (public.is_group_member(group_id));

-- 0 .. n-1, kriptografikus forrásból
create function public.rand_int(n integer) returns integer
language sql volatile set search_path = '' as $$
  select (('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint % n)::integer
$$;

-- Fisher–Yates keverés
create function public.shuffle_jsonb(items jsonb) returns jsonb
language plpgsql volatile set search_path = '' as $$
declare
  arr jsonb[] := array(select jsonb_array_elements(items));
  i integer; j integer; tmp jsonb;
begin
  for i in reverse coalesce(array_length(arr, 1), 0)..2 loop
    j := public.rand_int(i) + 1;
    tmp := arr[i]; arr[i] := arr[j]; arr[j] := tmp;
  end loop;
  return to_jsonb(arr);
end $$;

create function public.draw(gid uuid, kind text, options jsonb default '{}') returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  items jsonb := coalesce(options->'items', '[]');
  n integer := jsonb_array_length(coalesce(options->'items', '[]'));
  res jsonb;
  did uuid;
  lo integer; hi integer; cnt integer; t integer; shuffled jsonb; pick uuid;
  payload jsonb := '{}';
begin
  if not public.is_group_member(gid) then raise exception 'not a member'; end if;
  if n > 30 then raise exception 'too many items'; end if;

  case kind
    when 'wheel' then
      if n < 2 then raise exception 'need 2+ items'; end if;
      t := public.rand_int(n);
      res := jsonb_build_object('index', t, 'value', items->t);
    when 'coin' then
      res := jsonb_build_object('side', case public.rand_int(2) when 0 then 'fej' else 'írás' end);
    when 'dice' then
      cnt := least(greatest(coalesce((options->>'count')::integer, 1), 1), 5);
      res := jsonb_build_object('rolls', (select jsonb_agg(public.rand_int(6) + 1) from generate_series(1, cnt)));
    when 'number' then
      lo := (options->>'min')::integer; hi := (options->>'max')::integer;
      if lo is null or hi is null or hi < lo or hi - lo > 1000000000 then raise exception 'bad range'; end if;
      res := jsonb_build_object('value', lo + public.rand_int(hi - lo + 1));
    when 'shuffle' then
      if n < 2 then raise exception 'need 2+ items'; end if;
      res := jsonb_build_object('order', public.shuffle_jsonb(items));
    when 'teams' then
      cnt := least(greatest(coalesce((options->>'teams')::integer, 2), 2), 6);
      if n < cnt then raise exception 'not enough people'; end if;
      shuffled := public.shuffle_jsonb(items);
      res := jsonb_build_object('teams', (
        select jsonb_agg(team order by k) from (
          select k, jsonb_agg(shuffled->i order by i) as team
          from generate_series(0, n - 1) i, lateral (select i % cnt as k) x group by k
        ) g));
    when 'pay' then
      -- jelöltek: megadott tagok, vagy az egész banda
      select count(*)::integer into cnt from public.group_members m where m.group_id = gid
        and (jsonb_array_length(coalesce(options->'user_ids', '[]')) = 0 or options->'user_ids' ? m.user_id::text);
      if cnt = 0 then raise exception 'no candidates'; end if;
      select m.user_id into pick from public.group_members m where m.group_id = gid
        and (jsonb_array_length(coalesce(options->'user_ids', '[]')) = 0 or options->'user_ids' ? m.user_id::text)
        order by m.user_id offset public.rand_int(cnt) limit 1;
      res := jsonb_build_object('user_id', pick, 'name', (select display_name from public.profiles where id = pick));
      payload := jsonb_build_object('notify_text', 'sorsolt: ' || (res->>'name') || ' fizeti a kört!', 'notify_url', '/m/decide');
    else
      raise exception 'unknown kind';
  end case;

  insert into public.draws (group_id, kind, options, result) values (gid, kind, options, res) returning id into did;
  insert into public.activity (group_id, actor_id, module_id, type, ref_id, payload)
  values (gid, auth.uid(), 'decide', 'draw', did, payload);
  return did;
end $$;

revoke execute on function public.draw from public, anon;
revoke execute on function public.rand_int, public.shuffle_jsonb from public, anon, authenticated;
