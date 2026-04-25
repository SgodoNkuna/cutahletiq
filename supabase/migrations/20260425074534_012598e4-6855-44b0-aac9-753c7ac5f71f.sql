do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'announcements_author_id_fkey'
  ) then
    alter table public.announcements
      add constraint announcements_author_id_fkey
      foreign key (author_id) references public.profiles(id) on delete cascade;
  end if;
end $$;

create table if not exists public.team_events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid null,
  created_by uuid not null,
  title text not null,
  description text not null default '',
  event_type text not null default 'team_event',
  event_date date not null,
  event_time time null,
  location text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_events enable row level security;

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.team_events(id) on delete cascade,
  user_id uuid not null,
  status text not null default 'going',
  responded_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table public.event_rsvps enable row level security;

create index if not exists idx_team_events_team_date on public.team_events(team_id, event_date);
create index if not exists idx_event_rsvps_event_user on public.event_rsvps(event_id, user_id);

drop policy if exists "events: team read" on public.team_events;
create policy "events: team read"
on public.team_events
for select
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or team_id = public.my_team_id()
  or created_by = auth.uid()
);

drop policy if exists "events: coach admin insert" on public.team_events;
create policy "events: coach admin insert"
on public.team_events
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    public.has_role(auth.uid(), 'admin')
    or (public.has_role(auth.uid(), 'coach') and team_id = public.my_team_id())
  )
);

drop policy if exists "events: owner admin update" on public.team_events;
create policy "events: owner admin update"
on public.team_events
for update
to authenticated
using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'))
with check (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "events: owner admin delete" on public.team_events;
create policy "events: owner admin delete"
on public.team_events
for delete
to authenticated
using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "rsvps: user read own" on public.event_rsvps;
create policy "rsvps: user read own"
on public.event_rsvps
for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
  or exists (
    select 1 from public.team_events e
    where e.id = event_rsvps.event_id
      and e.created_by = auth.uid()
  )
);

drop policy if exists "rsvps: user upsert own" on public.event_rsvps;
create policy "rsvps: user upsert own"
on public.event_rsvps
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.team_events e
    where e.id = event_rsvps.event_id
      and (e.team_id = public.my_team_id() or e.created_by = auth.uid() or public.has_role(auth.uid(), 'admin'))
  )
);

drop policy if exists "rsvps: user update own" on public.event_rsvps;
create policy "rsvps: user update own"
on public.event_rsvps
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop trigger if exists team_events_set_updated_at on public.team_events;
create trigger team_events_set_updated_at
before update on public.team_events
for each row execute function public.set_updated_at();

drop trigger if exists workout_logs_notify_pr on public.workout_logs;
create trigger workout_logs_notify_pr
after insert on public.workout_logs
for each row execute function public.notify_pr();

drop trigger if exists injury_records_notify_rtp on public.injury_records;
create trigger injury_records_notify_rtp
after insert or update on public.injury_records
for each row execute function public.notify_rtp_change();

drop trigger if exists injury_checkins_notify_high_pain on public.injury_checkins;
create trigger injury_checkins_notify_high_pain
after insert on public.injury_checkins
for each row execute function public.notify_high_pain();

drop trigger if exists programmes_notify_new on public.programmes;
create trigger programmes_notify_new
after insert on public.programmes
for each row execute function public.notify_new_programme();

do $$
declare
  tbl text;
begin
  foreach tbl in array array['announcements','nudges','workout_logs','injury_records','injury_checkins','sessions','team_events','event_rsvps'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;