-- Auth user → profile (runs after signup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profile changes → consent log
DROP TRIGGER IF EXISTS profiles_consent_log ON public.profiles;
CREATE TRIGGER profiles_consent_log
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_consent_change();

-- Profile updated_at
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Teams → auto join_code + updated_at
DROP TRIGGER IF EXISTS teams_set_join_code ON public.teams;
CREATE TRIGGER teams_set_join_code
  BEFORE INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.set_team_join_code();

DROP TRIGGER IF EXISTS teams_set_updated_at ON public.teams;
CREATE TRIGGER teams_set_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Programme → notify athletes
DROP TRIGGER IF EXISTS programmes_notify_new ON public.programmes;
CREATE TRIGGER programmes_notify_new
  AFTER INSERT ON public.programmes
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_programme();

DROP TRIGGER IF EXISTS programmes_set_updated_at ON public.programmes;
CREATE TRIGGER programmes_set_updated_at
  BEFORE UPDATE ON public.programmes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Workout log → PR nudge
DROP TRIGGER IF EXISTS workout_logs_notify_pr ON public.workout_logs;
CREATE TRIGGER workout_logs_notify_pr
  AFTER INSERT ON public.workout_logs
  FOR EACH ROW EXECUTE FUNCTION public.notify_pr();

-- Injury checkin → high-pain physio nudge
DROP TRIGGER IF EXISTS injury_checkins_notify_high_pain ON public.injury_checkins;
CREATE TRIGGER injury_checkins_notify_high_pain
  AFTER INSERT ON public.injury_checkins
  FOR EACH ROW EXECUTE FUNCTION public.notify_high_pain();

-- Injury record → RTP change nudge
DROP TRIGGER IF EXISTS injury_records_notify_rtp ON public.injury_records;
CREATE TRIGGER injury_records_notify_rtp
  AFTER INSERT OR UPDATE ON public.injury_records
  FOR EACH ROW EXECUTE FUNCTION public.notify_rtp_change();

DROP TRIGGER IF EXISTS injury_records_set_updated_at ON public.injury_records;
CREATE TRIGGER injury_records_set_updated_at
  BEFORE UPDATE ON public.injury_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();