
CREATE TABLE IF NOT EXISTS public.invite_codes (
  role public.app_role PRIMARY KEY,
  code text NOT NULL,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invite_codes: admin manage"
  ON public.invite_codes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.validate_invite_code(_role public.app_role, _code text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.invite_codes
    WHERE role = _role AND code = upper(trim(_code))
  );
$$;

INSERT INTO public.invite_codes (role, code) VALUES
  ('coach', upper(substring(md5(random()::text) from 1 for 8))),
  ('physio', upper(substring(md5(random()::text) from 1 for 8)))
ON CONFLICT (role) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.wellness_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL,
  checkin_date date NOT NULL DEFAULT current_date,
  sleep_hours numeric(4,2) NOT NULL CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  sleep_quality int NOT NULL CHECK (sleep_quality BETWEEN 1 AND 5),
  readiness int NOT NULL CHECK (readiness BETWEEN 1 AND 5),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, checkin_date)
);
ALTER TABLE public.wellness_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wellness: athlete manage own"
  ON public.wellness_checkins FOR ALL TO authenticated
  USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "wellness: coach read team"
  ON public.wellness_checkins FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'coach') AND public.user_team_id(athlete_id) = public.my_team_id());
CREATE POLICY "wellness: physio read all"
  ON public.wellness_checkins FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'physio'));
CREATE POLICY "wellness: admin read all"
  ON public.wellness_checkins FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  opponent text NOT NULL,
  game_date date NOT NULL,
  game_time time,
  location text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER games_set_updated_at BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "games: team read"
  ON public.games FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'physio')
    OR team_id = public.my_team_id()
  );
CREATE POLICY "games: coach manage own team"
  ON public.games FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id AND team_id = public.my_team_id());

CREATE TABLE IF NOT EXISTS public.game_minutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL,
  minutes_played int NOT NULL CHECK (minutes_played >= 0 AND minutes_played <= 240),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, athlete_id)
);
ALTER TABLE public.game_minutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "minutes: athlete read own"
  ON public.game_minutes FOR SELECT TO authenticated
  USING (athlete_id = auth.uid());
CREATE POLICY "minutes: team read"
  ON public.game_minutes FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'physio')
    OR public.user_team_id(athlete_id) = public.my_team_id()
  );
CREATE POLICY "minutes: coach manage"
  ON public.game_minutes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'coach') AND public.user_team_id(athlete_id) = public.my_team_id())
  WITH CHECK (public.has_role(auth.uid(),'coach') AND public.user_team_id(athlete_id) = public.my_team_id());

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.event_rsvps;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
