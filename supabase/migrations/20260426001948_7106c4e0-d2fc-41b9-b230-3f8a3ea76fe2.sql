
-- ============================================================
-- Physio: cross-team access for injury management
-- ============================================================

-- Drop existing team-scoped physio policies on injury_records
DROP POLICY IF EXISTS "injuries: physio insert team" ON public.injury_records;
DROP POLICY IF EXISTS "injuries: physio read team" ON public.injury_records;
DROP POLICY IF EXISTS "injuries: physio update team" ON public.injury_records;

-- Recreate without team scope (physios manage all athletes' injuries)
CREATE POLICY "injuries: physio read all"
ON public.injury_records FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'physio'::app_role));

CREATE POLICY "injuries: physio insert any"
ON public.injury_records FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'physio'::app_role)
  AND auth.uid() = physio_id
);

CREATE POLICY "injuries: physio update all"
ON public.injury_records FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'physio'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'physio'::app_role));

-- Drop existing team-scoped physio policy on injury_checkins
DROP POLICY IF EXISTS "checkins: physio read team" ON public.injury_checkins;

CREATE POLICY "checkins: physio read all"
ON public.injury_checkins FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'physio'::app_role));

-- Allow physios to read all profiles (so they can pick athletes from any team)
CREATE POLICY "profiles: physio read all"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'physio'::app_role));

-- ============================================================
-- Physio: can create team_events (rehab, individual, meetings)
-- ============================================================
DROP POLICY IF EXISTS "events: coach admin insert" ON public.team_events;

CREATE POLICY "events: coach admin physio insert"
ON public.team_events FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'physio'::app_role)
    OR (
      public.has_role(auth.uid(), 'coach'::app_role)
      AND (team_id = public.my_team_id() OR team_id IS NULL)
    )
  )
);

-- Allow physios to read all events (so they can manage rehab calendar)
DROP POLICY IF EXISTS "events: team read" ON public.team_events;

CREATE POLICY "events: team read"
ON public.team_events FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'physio'::app_role)
  OR team_id IS NULL
  OR team_id = public.my_team_id()
  OR created_by = auth.uid()
);
