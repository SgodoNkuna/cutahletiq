
-- ============================================================
-- 1. Announcements table (admin posts shown in the feed)
-- ============================================================
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  media_url text,
  media_type text check (media_type in ('image','video')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_announcements_created_at on public.announcements (created_at desc);

alter table public.announcements enable row level security;

drop policy if exists "announcements: read all signed in" on public.announcements;
create policy "announcements: read all signed in"
  on public.announcements for select
  to authenticated
  using (true);

drop policy if exists "announcements: admin insert" on public.announcements;
create policy "announcements: admin insert"
  on public.announcements for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin') and author_id = auth.uid());

drop policy if exists "announcements: admin update own" on public.announcements;
create policy "announcements: admin update own"
  on public.announcements for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin') and author_id = auth.uid());

drop policy if exists "announcements: admin delete" on public.announcements;
create policy "announcements: admin delete"
  on public.announcements for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. Storage bucket for announcement media (public read)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('announcements', 'announcements', true)
on conflict (id) do nothing;

drop policy if exists "announcements media: public read" on storage.objects;
create policy "announcements media: public read"
  on storage.objects for select
  using (bucket_id = 'announcements');

drop policy if exists "announcements media: admin upload" on storage.objects;
create policy "announcements media: admin upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'announcements' and public.has_role(auth.uid(),'admin'));

drop policy if exists "announcements media: admin delete" on storage.objects;
create policy "announcements media: admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'announcements' and public.has_role(auth.uid(),'admin'));

-- ============================================================
-- 3. Admin read-everything policies (so admin dashboard counts work)
-- ============================================================
drop policy if exists "teams: admin read all" on public.teams;
create policy "teams: admin read all"
  on public.teams for select
  to authenticated
  using (public.has_role(auth.uid(),'admin'));

drop policy if exists "programmes: admin read all" on public.programmes;
create policy "programmes: admin read all"
  on public.programmes for select
  to authenticated
  using (public.has_role(auth.uid(),'admin'));

drop policy if exists "sessions: admin read all" on public.sessions;
create policy "sessions: admin read all"
  on public.sessions for select
  to authenticated
  using (public.has_role(auth.uid(),'admin'));

drop policy if exists "exercises: admin read all" on public.exercises;
create policy "exercises: admin read all"
  on public.exercises for select
  to authenticated
  using (public.has_role(auth.uid(),'admin'));

drop policy if exists "logs: admin read all" on public.workout_logs;
create policy "logs: admin read all"
  on public.workout_logs for select
  to authenticated
  using (public.has_role(auth.uid(),'admin'));

drop policy if exists "prs: admin read all" on public.personal_records;
create policy "prs: admin read all"
  on public.personal_records for select
  to authenticated
  using (public.has_role(auth.uid(),'admin'));

drop policy if exists "checkins: admin read all" on public.injury_checkins;
create policy "checkins: admin read all"
  on public.injury_checkins for select
  to authenticated
  using (public.has_role(auth.uid(),'admin'));
