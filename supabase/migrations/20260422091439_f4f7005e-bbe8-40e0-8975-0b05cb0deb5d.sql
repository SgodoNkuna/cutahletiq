
create policy "profiles: read same team"
  on public.profiles
  for select
  to authenticated
  using (team_id is not null and team_id = public.my_team_id());
