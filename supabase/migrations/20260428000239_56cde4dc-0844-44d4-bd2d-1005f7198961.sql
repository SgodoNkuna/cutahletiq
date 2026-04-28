-- Game RSVPs
CREATE TABLE IF NOT EXISTS public.game_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'no_response' CHECK (status IN ('going','not_going','no_response')),
  responded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, user_id)
);

ALTER TABLE public.game_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rsvps: athlete manage own"
  ON public.game_rsvps FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = game_rsvps.game_id
        AND (g.team_id = public.my_team_id() OR public.has_role(auth.uid(),'admin'))
    )
  );

CREATE POLICY "rsvps: team read"
  ON public.game_rsvps FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'physio')
    OR EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = game_rsvps.game_id
        AND (g.coach_id = auth.uid() OR g.team_id = public.my_team_id())
    )
  );

CREATE INDEX IF NOT EXISTS idx_game_rsvps_game ON public.game_rsvps(game_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rsvps;
ALTER TABLE public.game_rsvps REPLICA IDENTITY FULL;

-- POPIA-scoped physio case view for coaches: NO notes / treatment_plan / session_notes
CREATE OR REPLACE VIEW public.injury_summary_for_coach
WITH (security_invoker = true) AS
SELECT
  ir.id,
  ir.athlete_id,
  ir.body_region,
  ir.injury_type,
  ir.severity,
  ir.rtp_status,
  ir.expected_rtp_date,
  ir.actual_rtp_date,
  ir.date_of_injury,
  ir.updated_at
FROM public.injury_records ir
WHERE
  public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'physio')
  OR (
    public.has_role(auth.uid(),'coach')
    AND public.user_team_id(ir.athlete_id) = public.my_team_id()
    AND (ir.actual_rtp_date IS NULL OR ir.actual_rtp_date >= current_date - interval '14 days')
  )
  OR ir.athlete_id = auth.uid();

GRANT SELECT ON public.injury_summary_for_coach TO authenticated;