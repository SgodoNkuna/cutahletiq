
-- 1) PRIVILEGE ESCALATION fix: block self-promotion
-- Replace the open update policy with one that pins role/team/consent fields
drop policy if exists "profiles: update own" on public.profiles;

create or replace function public.profile_self_update_safe(_old public.profiles, _new public.profiles)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    _old.id = _new.id
    and _old.role = _new.role
    and _old.email = _new.email
    and (_old.team_id is not distinct from _new.team_id
         or _old.team_id is null)  -- can join a team once if currently null
    -- consent_at, consent_*  are always settable by user (POPIA right)
$$;

create policy "profiles: update own (safe fields)"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
    and email = (select email from public.profiles where id = auth.uid())
    and (
      team_id is null
      or team_id = (select team_id from public.profiles where id = auth.uid())
      or (select team_id from public.profiles where id = auth.uid()) is null
    )
  );

-- 2) Limit teammate profile visibility — drop the broad team-read,
-- expose only safe fields through a view
drop policy if exists "profiles: read same team" on public.profiles;

create or replace view public.team_members_safe
with (security_invoker = true) as
  select
    p.id,
    p.first_name,
    p.last_name,
    p.role,
    p.sport,
    p.position,
    p.avatar_url,
    p.team_id
  from public.profiles p
  where p.team_id is not null and p.team_id = public.my_team_id();

grant select on public.team_members_safe to authenticated;

-- 3) Nudges: allow recipient to delete their own
create policy "nudges: recipient delete own"
  on public.nudges
  for delete
  to authenticated
  using (auth.uid() = recipient_id);

-- 4) Consent log: allow user to insert own
create policy "consent_log: user insert own"
  on public.consent_log
  for insert
  to authenticated
  with check (auth.uid() = user_id);
