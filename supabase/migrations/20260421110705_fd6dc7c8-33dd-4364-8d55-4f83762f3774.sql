-- ============================================================
-- 0. ENUMS + HELPERS
-- ============================================================
create type public.app_role as enum ('athlete','coach','physio','admin');
create type public.rtp_status as enum ('unavailable','modified','cleared');
create type public.nudge_type as enum (
  'new_programme','pr_achieved','missed_session',
  'rtp_status_change','injury_flagged','checkin_reminder'
);

-- generic updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null,
  role public.app_role not null default 'athlete',
  sport text,
  position text,
  team_id uuid,
  avatar_url text,
  onboarding_complete boolean not null default false,
  consent_coach_training boolean not null default false,
  consent_physio_health boolean not null default false,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- security-definer role check (prevents recursion in RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = _user_id and role = _role
  );
$$;

-- helper: my team_id (security definer to avoid recursion on profiles policies)
create or replace function public.my_team_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select team_id from public.profiles where id = auth.uid();
$$;

create or replace function public.user_team_id(_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select team_id from public.profiles where id = _user_id;
$$;

-- profiles policies
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: read same team" on public.profiles
  for select using (
    team_id is not null and team_id = public.my_team_id()
  );

create policy "profiles: admins read all" on public.profiles
  for select using (public.has_role(auth.uid(), 'admin'));

create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles: admins update any" on public.profiles
  for update using (public.has_role(auth.uid(), 'admin'));

create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  desired_role public.app_role;
  invite_code text;
begin
  -- pick role from metadata (default athlete). Admin requires server-validated invite code,
  -- which we re-check here as defence in depth — if the metadata claims admin without
  -- the secret matching, demote to athlete.
  desired_role := coalesce(nullif(meta->>'role',''), 'athlete')::public.app_role;
  invite_code := meta->>'admin_invite_code';

  if desired_role = 'admin' then
    if invite_code is null
       or invite_code = ''
       or invite_code <> coalesce(current_setting('app.admin_invite_code', true), '__nope__')
    then
      desired_role := 'athlete';
    end if;
  end if;

  insert into public.profiles (
    id, email, first_name, last_name, role, sport, position,
    consent_coach_training, consent_physio_health, consent_at
  ) values (
    new.id,
    new.email,
    coalesce(meta->>'first_name',''),
    coalesce(meta->>'last_name',''),
    desired_role,
    nullif(meta->>'sport',''),
    nullif(meta->>'position',''),
    coalesce((meta->>'consent_coach_training')::boolean, false),
    coalesce((meta->>'consent_physio_health')::boolean, false),
    case when (meta->>'consent_coach_training' = 'true' or meta->>'consent_physio_health' = 'true')
         then now() else null end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. TEAMS
-- ============================================================
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport text not null,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  join_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.teams enable row level security;

create trigger teams_updated_at before update on public.teams
  for each row execute function public.set_updated_at();

-- generate a 6-char alphanumeric (ambiguous chars stripped) join code
create or replace function public.generate_join_code()
returns text language plpgsql as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
  attempt int := 0;
begin
  loop
    result := '';
    for i in 1..6 loop
      result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    if not exists (select 1 from public.teams where join_code = result) then
      return result;
    end if;
    attempt := attempt + 1;
    if attempt > 20 then
      raise exception 'Could not generate unique join code';
    end if;
  end loop;
end;
$$;

create or replace function public.set_team_join_code()
returns trigger language plpgsql as $$
begin
  if new.join_code is null or new.join_code = '' then
    new.join_code := public.generate_join_code();
  end if;
  return new;
end;
$$;

create trigger teams_set_join_code
  before insert on public.teams
  for each row execute function public.set_team_join_code();

-- teams policies: any authenticated user can SELECT (needed for join-code lookup),
-- only owning coach can INSERT/UPDATE/DELETE.
create policy "teams: any authed read" on public.teams
  for select to authenticated using (true);

create policy "teams: coach insert" on public.teams
  for insert to authenticated with check (
    auth.uid() = coach_id and public.has_role(auth.uid(), 'coach')
  );

create policy "teams: coach update own" on public.teams
  for update to authenticated using (auth.uid() = coach_id);

create policy "teams: coach delete own" on public.teams
  for delete to authenticated using (auth.uid() = coach_id);

-- now profiles.team_id can FK to teams (deferred to avoid cycle)
alter table public.profiles
  add constraint profiles_team_fk foreign key (team_id) references public.teams(id) on delete set null;

-- ============================================================
-- 3. PROGRAMMES / SESSIONS / EXERCISES
-- ============================================================
create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport text,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.programmes enable row level security;
create trigger programmes_updated_at before update on public.programmes
  for each row execute function public.set_updated_at();

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  name text not null,
  session_date date not null,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.sessions enable row level security;

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  name text not null,
  sets integer not null default 3,
  reps integer not null default 8,
  weight_pct integer,
  weight_kg numeric,
  notes text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.exercises enable row level security;

-- programmes policies
create policy "programmes: coach manage own" on public.programmes
  for all to authenticated
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

create policy "programmes: athletes read team" on public.programmes
  for select to authenticated using (
    team_id is not null and team_id = public.my_team_id()
  );

-- sessions policies
create policy "sessions: coach manage" on public.sessions
  for all to authenticated using (
    exists (select 1 from public.programmes p
            where p.id = sessions.programme_id and p.coach_id = auth.uid())
  ) with check (
    exists (select 1 from public.programmes p
            where p.id = sessions.programme_id and p.coach_id = auth.uid())
  );

create policy "sessions: athletes read team" on public.sessions
  for select to authenticated using (
    exists (select 1 from public.programmes p
            where p.id = sessions.programme_id
              and p.team_id is not null
              and p.team_id = public.my_team_id())
  );

-- exercises policies
create policy "exercises: coach manage" on public.exercises
  for all to authenticated using (
    exists (select 1 from public.sessions s
            join public.programmes p on p.id = s.programme_id
            where s.id = exercises.session_id and p.coach_id = auth.uid())
  ) with check (
    exists (select 1 from public.sessions s
            join public.programmes p on p.id = s.programme_id
            where s.id = exercises.session_id and p.coach_id = auth.uid())
  );

create policy "exercises: athletes read team" on public.exercises
  for select to authenticated using (
    exists (select 1 from public.sessions s
            join public.programmes p on p.id = s.programme_id
            where s.id = exercises.session_id
              and p.team_id is not null
              and p.team_id = public.my_team_id())
  );

-- ============================================================
-- 4. WORKOUT_LOGS + PERSONAL_RECORDS
-- ============================================================
create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  set_number integer not null,
  actual_reps integer not null,
  actual_weight_kg numeric not null,
  is_pr boolean not null default false,
  logged_at timestamptz not null default now()
);
alter table public.workout_logs enable row level security;

create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  exercise_name text not null,
  weight_kg numeric not null,
  reps integer not null,
  achieved_at timestamptz not null default now(),
  unique (athlete_id, exercise_name)
);
alter table public.personal_records enable row level security;

create policy "logs: athlete manage own" on public.workout_logs
  for all to authenticated
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

create policy "logs: coach read team" on public.workout_logs
  for select to authenticated using (
    public.has_role(auth.uid(), 'coach')
    and public.user_team_id(athlete_id) is not null
    and public.user_team_id(athlete_id) = public.my_team_id()
  );

create policy "prs: athlete read own" on public.personal_records
  for select to authenticated using (auth.uid() = athlete_id);

create policy "prs: athlete write own" on public.personal_records
  for insert to authenticated with check (auth.uid() = athlete_id);

create policy "prs: athlete update own" on public.personal_records
  for update to authenticated using (auth.uid() = athlete_id);

create policy "prs: coach read team" on public.personal_records
  for select to authenticated using (
    public.has_role(auth.uid(), 'coach')
    and public.user_team_id(athlete_id) = public.my_team_id()
  );

-- ============================================================
-- 5. INJURY_CHECKINS  (coaching-layer body map — coach BLOCKED)
-- ============================================================
create table public.injury_checkins (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  body_regions text[] not null default '{}',
  pain_level integer not null check (pain_level between 1 and 10),
  notes text,
  submitted_at timestamptz not null default now()
);
alter table public.injury_checkins enable row level security;

create policy "checkins: athlete manage own" on public.injury_checkins
  for all to authenticated
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

create policy "checkins: physio read team" on public.injury_checkins
  for select to authenticated using (
    public.has_role(auth.uid(), 'physio')
    and public.user_team_id(athlete_id) is not null
    and public.user_team_id(athlete_id) = public.my_team_id()
  );
-- NOTE: NO coach policy. Coaches cannot read injury_checkins.

-- ============================================================
-- 6. INJURY_RECORDS  (clinical — coach BLOCKED)
-- ============================================================
create table public.injury_records (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  physio_id uuid not null references public.profiles(id) on delete cascade,
  body_region text not null,
  injury_type text not null,
  severity integer not null check (severity between 1 and 5),
  date_of_injury date not null,
  expected_rtp_date date,
  actual_rtp_date date,
  treatment_notes text,
  rtp_status public.rtp_status not null default 'unavailable',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.injury_records enable row level security;
create trigger injury_records_updated_at before update on public.injury_records
  for each row execute function public.set_updated_at();

create policy "injuries: athlete read own" on public.injury_records
  for select to authenticated using (auth.uid() = athlete_id);

create policy "injuries: physio read team" on public.injury_records
  for select to authenticated using (
    public.has_role(auth.uid(), 'physio')
    and public.user_team_id(athlete_id) = public.my_team_id()
  );

create policy "injuries: physio insert team" on public.injury_records
  for insert to authenticated with check (
    public.has_role(auth.uid(), 'physio')
    and auth.uid() = physio_id
    and public.user_team_id(athlete_id) = public.my_team_id()
  );

create policy "injuries: physio update team" on public.injury_records
  for update to authenticated using (
    public.has_role(auth.uid(), 'physio')
    and public.user_team_id(athlete_id) = public.my_team_id()
  );

create policy "injuries: admin read all" on public.injury_records
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
-- NOTE: NO coach policy. Coaches cannot read injury_records.

-- ============================================================
-- 7. RTP_STATUS_VIEW  (only bridge between clinical and coaching)
-- ============================================================
create or replace view public.rtp_status_view
with (security_invoker = true) as
select distinct on (athlete_id)
  athlete_id,
  rtp_status,
  expected_rtp_date,
  updated_at
from public.injury_records
where actual_rtp_date is null or actual_rtp_date >= current_date
order by athlete_id, updated_at desc;

-- The view inherits RLS from injury_records via security_invoker=true,
-- but coaches need to read it. We give coaches a narrow policy on a wrapper
-- function instead. Simpler: expose as a function that bypasses RLS for the
-- minimal columns.
create or replace function public.team_rtp_pulse()
returns table (athlete_id uuid, rtp_status public.rtp_status, expected_rtp_date date)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (ir.athlete_id)
    ir.athlete_id, ir.rtp_status, ir.expected_rtp_date
  from public.injury_records ir
  join public.profiles p on p.id = ir.athlete_id
  where (ir.actual_rtp_date is null or ir.actual_rtp_date >= current_date)
    and p.team_id is not null
    and p.team_id = public.my_team_id()
    and (public.has_role(auth.uid(),'coach') or public.has_role(auth.uid(),'physio'))
  order by ir.athlete_id, ir.updated_at desc;
$$;

-- ============================================================
-- 8. NUDGES
-- ============================================================
create table public.nudges (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  type public.nudge_type not null,
  message text not null,
  is_read boolean not null default false,
  link_path text,
  created_at timestamptz not null default now()
);
alter table public.nudges enable row level security;

create policy "nudges: recipient read own" on public.nudges
  for select to authenticated using (auth.uid() = recipient_id);

create policy "nudges: recipient update own" on public.nudges
  for update to authenticated using (auth.uid() = recipient_id);

create policy "nudges: sender insert" on public.nudges
  for insert to authenticated with check (
    sender_id is null or sender_id = auth.uid()
  );

create index nudges_recipient_unread_idx on public.nudges(recipient_id, is_read, created_at desc);

-- ============================================================
-- 9. CONSENT_LOG  (POPIA audit trail)
-- ============================================================
create table public.consent_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_coach_training boolean not null,
  consent_physio_health boolean not null,
  changed_at timestamptz not null default now(),
  source text not null default 'profile_update'
);
alter table public.consent_log enable row level security;

create policy "consent_log: user read own" on public.consent_log
  for select to authenticated using (auth.uid() = user_id);

create policy "consent_log: admin read all" on public.consent_log
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- trigger: write to consent_log on any consent change
create or replace function public.log_consent_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') or
     (old.consent_coach_training is distinct from new.consent_coach_training) or
     (old.consent_physio_health  is distinct from new.consent_physio_health)
  then
    insert into public.consent_log (user_id, consent_coach_training, consent_physio_health, source)
    values (new.id, new.consent_coach_training, new.consent_physio_health,
            case when tg_op = 'INSERT' then 'signup' else 'profile_update' end);
  end if;
  return new;
end;
$$;

create trigger profiles_consent_log
  after insert or update on public.profiles
  for each row execute function public.log_consent_change();

-- ============================================================
-- 10. DATA_ACCESS_LOG  (POPIA — who read injury data)
-- ============================================================
create table public.data_access_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.profiles(id) on delete cascade,
  resource text not null,
  action text not null default 'read',
  context text,
  accessed_at timestamptz not null default now()
);
alter table public.data_access_log enable row level security;

create policy "access_log: admin read all" on public.data_access_log
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "access_log: actor read own" on public.data_access_log
  for select to authenticated using (auth.uid() = actor_id);

create policy "access_log: actor write own" on public.data_access_log
  for insert to authenticated with check (auth.uid() = actor_id);

-- ============================================================
-- 11. NUDGE TRIGGERS
-- ============================================================

-- 11a. New programme → nudge every athlete on the team
create or replace function public.notify_new_programme()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  coach_first text;
begin
  if new.team_id is null then return new; end if;
  select first_name into coach_first from public.profiles where id = new.coach_id;
  insert into public.nudges (recipient_id, sender_id, type, message, link_path)
  select p.id, new.coach_id, 'new_programme',
         'Coach ' || coalesce(coach_first,'') || ' assigned a new programme: ' || new.name,
         '/athlete'
  from public.profiles p
  where p.team_id = new.team_id and p.role = 'athlete';
  return new;
end;
$$;

create trigger programmes_notify
  after insert on public.programmes
  for each row execute function public.notify_new_programme();

-- 11b. PR achieved → nudge the athlete
create or replace function public.notify_pr()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ex_name text;
begin
  if new.is_pr is not true then return new; end if;
  select name into ex_name from public.exercises where id = new.exercise_id;
  insert into public.nudges (recipient_id, type, message, link_path)
  values (new.athlete_id, 'pr_achieved',
          'New PR! ' || new.actual_weight_kg || 'kg on ' || coalesce(ex_name,'lift') || '. Keep going.',
          '/athlete/progress');
  return new;
end;
$$;

create trigger workout_logs_notify_pr
  after insert on public.workout_logs
  for each row execute function public.notify_pr();

-- 11c. RTP status change → nudge the athlete (never the coach)
create or replace function public.notify_rtp_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  status_label text;
begin
  if tg_op = 'UPDATE' and new.rtp_status is not distinct from old.rtp_status then
    return new;
  end if;
  status_label := case new.rtp_status
                    when 'cleared' then 'Cleared'
                    when 'modified' then 'Modified Training'
                    else 'Unavailable' end;
  insert into public.nudges (recipient_id, sender_id, type, message, link_path)
  values (new.athlete_id, new.physio_id, 'rtp_status_change',
          'Your return-to-play status was updated to ' || status_label || '.',
          '/athlete');
  return new;
end;
$$;

create trigger injury_records_notify_rtp
  after insert or update of rtp_status on public.injury_records
  for each row execute function public.notify_rtp_change();

-- 11d. High-pain check-in (>=7) → nudge the team's physio(s)
create or replace function public.notify_high_pain()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  athlete_first text;
  athlete_team uuid;
begin
  if new.pain_level < 7 then return new; end if;
  select first_name, team_id into athlete_first, athlete_team
    from public.profiles where id = new.athlete_id;
  if athlete_team is null then return new; end if;

  insert into public.nudges (recipient_id, sender_id, type, message, link_path)
  select p.id, new.athlete_id, 'injury_flagged',
         coalesce(athlete_first,'An athlete') || ' flagged high pain (level ' ||
         new.pain_level || ') in their check-in today.',
         '/physio'
  from public.profiles p
  where p.team_id = athlete_team and p.role = 'physio';
  return new;
end;
$$;

create trigger injury_checkins_notify_high_pain
  after insert on public.injury_checkins
  for each row execute function public.notify_high_pain();

-- ============================================================
-- 12. GRANTS for the team_rtp_pulse function
-- ============================================================
grant execute on function public.team_rtp_pulse() to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.my_team_id() to authenticated;
grant execute on function public.user_team_id(uuid) to authenticated;