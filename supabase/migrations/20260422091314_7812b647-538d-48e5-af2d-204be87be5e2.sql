
-- 1) personal_records: allow athletes to delete their own
create policy "prs: athlete delete own"
  on public.personal_records
  for delete
  to authenticated
  using (auth.uid() = athlete_id);

-- 2) teams: replace open select with restricted reads
drop policy if exists "teams: any authed read" on public.teams;

-- members of the team can read full row
create policy "teams: members read own"
  on public.teams
  for select
  to authenticated
  using (id = public.my_team_id() or auth.uid() = coach_id);

-- a security-definer function for join-code lookup (used by /join-team page)
create or replace function public.find_team_by_code(_code text)
returns table(id uuid, name text, sport text, coach_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select id, name, sport, coach_id
  from public.teams
  where join_code = upper(trim(_code))
  limit 1;
$$;

revoke all on function public.find_team_by_code(text) from public;
grant execute on function public.find_team_by_code(text) to authenticated;

-- 3) data_access_log: tighten subject_id check
drop policy if exists "access_log: actor write own" on public.data_access_log;

create policy "access_log: actor write own"
  on public.data_access_log
  for insert
  to authenticated
  with check (
    auth.uid() = actor_id
    and (
      subject_id = auth.uid()
      or public.user_team_id(subject_id) = public.my_team_id()
    )
  );
