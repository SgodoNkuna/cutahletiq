create table if not exists public.session_completions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null,
  session_id uuid not null,
  rpe integer null,
  completed_at timestamptz not null default now(),
  unique (athlete_id, session_id)
);

alter table public.session_completions enable row level security;

create index if not exists idx_session_completions_athlete_session
on public.session_completions(athlete_id, session_id);

drop policy if exists "completions: athlete manage own" on public.session_completions;
create policy "completions: athlete manage own"
on public.session_completions
for all
to authenticated
using (athlete_id = auth.uid())
with check (athlete_id = auth.uid());

drop policy if exists "completions: coach read team" on public.session_completions;
create policy "completions: coach read team"
on public.session_completions
for select
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or (
    public.has_role(auth.uid(), 'coach')
    and public.user_team_id(athlete_id) = public.my_team_id()
  )
);

create or replace function public.notify_session_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  athlete_first text;
  athlete_last text;
  athlete_team uuid;
  session_name text;
begin
  select first_name, last_name, team_id
    into athlete_first, athlete_last, athlete_team
  from public.profiles
  where id = new.athlete_id;

  select name into session_name
  from public.sessions
  where id = new.session_id;

  if athlete_team is null then
    return new;
  end if;

  insert into public.nudges (recipient_id, sender_id, type, message, link_path)
  select p.id,
         new.athlete_id,
         'checkin_reminder',
         trim(coalesce(athlete_first, '') || ' ' || coalesce(athlete_last, '')) ||
           ' completed ' || coalesce(session_name, 'a workout') || '.',
         '/coach/athlete/' || new.athlete_id::text
  from public.profiles p
  where p.team_id = athlete_team and p.role = 'coach';

  return new;
end;
$$;

drop trigger if exists session_completions_notify_coach on public.session_completions;
create trigger session_completions_notify_coach
after insert on public.session_completions
for each row execute function public.notify_session_completed();

drop policy if exists "nudges: coach read team training" on public.nudges;
create policy "nudges: coach read team training"
on public.nudges
for select
to authenticated
using (
  public.has_role(auth.uid(), 'coach')
  and public.user_team_id(recipient_id) = public.my_team_id()
  and type in ('new_programme', 'pr_achieved', 'missed_session', 'checkin_reminder')
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'session_completions'
  ) then
    alter publication supabase_realtime add table public.session_completions;
  end if;
end $$;