ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS instructions TEXT,
  ADD COLUMN IF NOT EXISTS manual_finish BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

ALTER TABLE public.exercises
  DROP CONSTRAINT IF EXISTS exercises_instructions_len;
ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_instructions_len
  CHECK (instructions IS NULL OR length(instructions) <= 1000);

ALTER TABLE public.exercises
  DROP CONSTRAINT IF EXISTS exercises_valid_volume;
ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_valid_volume
  CHECK (
    sets > 0
    AND (
      reps > 0
      OR (duration_seconds IS NOT NULL AND duration_seconds > 0)
    )
  );

ALTER TABLE public.exercises
  DROP CONSTRAINT IF EXISTS exercises_duration_nonneg;
ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_duration_nonneg
  CHECK (duration_seconds IS NULL OR duration_seconds > 0);

CREATE OR REPLACE FUNCTION public.save_game_minutes_bulk(
  _game_id UUID,
  _rows JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _coach_team UUID;
  _row JSONB;
  _athlete UUID;
  _minutes INTEGER;
  _notes TEXT;
  _count INTEGER := 0;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = _game_id AND g.coach_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT g.team_id INTO _coach_team FROM public.games g WHERE g.id = _game_id;
  IF _coach_team IS NULL THEN
    RAISE EXCEPTION 'game has no team';
  END IF;

  FOR _row IN SELECT * FROM jsonb_array_elements(_rows) LOOP
    _athlete := (_row->>'athlete_id')::UUID;
    _minutes := COALESCE((_row->>'minutes_played')::INTEGER, -1);
    IF _minutes < 0 OR _minutes > 240 THEN
      RAISE EXCEPTION 'invalid minutes_played for %: %', _athlete, _minutes;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = _athlete AND p.team_id = _coach_team AND p.role = 'athlete'
    ) THEN
      RAISE EXCEPTION 'athlete % not on team', _athlete;
    END IF;
  END LOOP;

  DELETE FROM public.game_minutes WHERE game_id = _game_id;

  FOR _row IN SELECT * FROM jsonb_array_elements(_rows) LOOP
    _athlete := (_row->>'athlete_id')::UUID;
    _minutes := (_row->>'minutes_played')::INTEGER;
    _notes   := NULLIF(_row->>'notes', '');
    INSERT INTO public.game_minutes (game_id, athlete_id, minutes_played, notes)
    VALUES (_game_id, _athlete, _minutes, _notes);
    _count := _count + 1;
  END LOOP;

  RETURN _count;
END;
$$;

REVOKE ALL ON FUNCTION public.save_game_minutes_bulk(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_game_minutes_bulk(UUID, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.team_completion_stats(
  _from DATE,
  _to DATE
)
RETURNS TABLE (
  athlete_id UUID,
  first_name TEXT,
  last_name TEXT,
  sport TEXT,
  athlete_position TEXT,
  scheduled_sessions INTEGER,
  completed_sessions INTEGER,
  last_logged_at TIMESTAMPTZ,
  last_exercise_name TEXT,
  total_game_minutes INTEGER,
  has_active_injury BOOLEAN
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH team_athletes AS (
    SELECT p.id, p.first_name, p.last_name, p.sport, p.position AS athlete_position, p.team_id
    FROM public.profiles p
    WHERE p.role = 'athlete'
      AND (
        public.has_role(auth.uid(), 'admin')
        OR p.team_id = public.my_team_id()
      )
  ),
  scheduled AS (
    SELECT
      ta.id AS athlete_id,
      COUNT(DISTINCT s.id)::INTEGER AS n
    FROM team_athletes ta
    LEFT JOIN public.programmes pr ON pr.team_id = ta.team_id
    LEFT JOIN public.sessions s
      ON s.programme_id = pr.id
     AND s.session_date BETWEEN _from AND _to
    GROUP BY ta.id
  ),
  completed AS (
    SELECT sc.athlete_id, COUNT(*)::INTEGER AS n
    FROM public.session_completions sc
    WHERE sc.completed_at::date BETWEEN _from AND _to
    GROUP BY sc.athlete_id
  ),
  last_log AS (
    SELECT DISTINCT ON (wl.athlete_id)
      wl.athlete_id, wl.logged_at, e.name AS exercise_name
    FROM public.workout_logs wl
    LEFT JOIN public.exercises e ON e.id = wl.exercise_id
    WHERE wl.logged_at::date BETWEEN _from AND _to
    ORDER BY wl.athlete_id, wl.logged_at DESC
  ),
  minutes_total AS (
    SELECT gm.athlete_id, SUM(gm.minutes_played)::INTEGER AS total
    FROM public.game_minutes gm
    JOIN public.games g ON g.id = gm.game_id
    WHERE g.game_date BETWEEN _from AND _to
    GROUP BY gm.athlete_id
  ),
  active_inj AS (
    SELECT DISTINCT ir.athlete_id
    FROM public.injury_records ir
    WHERE ir.actual_rtp_date IS NULL OR ir.actual_rtp_date >= CURRENT_DATE
  )
  SELECT
    ta.id,
    ta.first_name,
    ta.last_name,
    ta.sport,
    ta.athlete_position,
    COALESCE(s.n, 0),
    COALESCE(c.n, 0),
    ll.logged_at,
    ll.exercise_name,
    COALESCE(m.total, 0),
    (ai.athlete_id IS NOT NULL)
  FROM team_athletes ta
  LEFT JOIN scheduled  s  ON s.athlete_id  = ta.id
  LEFT JOIN completed  c  ON c.athlete_id  = ta.id
  LEFT JOIN last_log   ll ON ll.athlete_id = ta.id
  LEFT JOIN minutes_total m ON m.athlete_id = ta.id
  LEFT JOIN active_inj ai ON ai.athlete_id = ta.id
  ORDER BY ta.first_name, ta.last_name;
$$;

REVOKE ALL ON FUNCTION public.team_completion_stats(DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.team_completion_stats(DATE, DATE) TO authenticated;