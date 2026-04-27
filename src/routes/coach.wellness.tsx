import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { SectionHeader } from "@/components/primitives";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Loader2 } from "lucide-react";

export const Route = createFileRoute("/coach/wellness")({
  head: () => ({
    meta: [
      { title: "Squad Wellness — Coach · CUT Athletiq" },
      { name: "description", content: "Daily readiness across your squad." },
    ],
  }),
  component: CoachWellness,
});

type AthleteRow = { id: string; first_name: string; last_name: string };
type WellnessRow = {
  athlete_id: string;
  sleep_hours: number;
  sleep_quality: number;
  readiness: number;
  checkin_date: string;
};

function CoachWellness() {
  const { profile } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [athletes, setAthletes] = React.useState<AthleteRow[]>([]);
  const [latest, setLatest] = React.useState<Record<string, WellnessRow>>({});

  React.useEffect(() => {
    if (!profile?.team_id) return;
    const teamId = profile.team_id;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: ath }, { data: w }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .eq("team_id", teamId)
          .eq("role", "athlete"),
        supabase
          .from("wellness_checkins")
          .select("athlete_id, sleep_hours, sleep_quality, readiness, checkin_date")
          .gte(
            "checkin_date",
            new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
          )
          .order("checkin_date", { ascending: false }),
      ]);
      if (cancelled) return;
      const map: Record<string, WellnessRow> = {};
      for (const row of (w ?? []) as WellnessRow[]) {
        if (!map[row.athlete_id]) map[row.athlete_id] = row;
      }
      setAthletes((ath ?? []) as AthleteRow[]);
      setLatest(map);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const sorted = [...athletes].sort((a, b) => {
    const ra = latest[a.id]?.readiness ?? 99;
    const rb = latest[b.id]?.readiness ?? 99;
    return ra - rb;
  });

  return (
    <MobileFrame title="Squad readiness">
      <div className="px-5">
        <div className="bg-gradient-to-br from-navy to-navy-deep text-white rounded-2xl p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/70">
            <Activity className="h-3.5 w-3.5 text-gold" /> Last 7 days
          </div>
          <div className="font-display text-2xl mt-1">Morning readiness</div>
          <div className="text-[11px] text-white/60 mt-1">
            Lowest readiness first so you can catch fatigue early.
          </div>
        </div>

        <SectionHeader title="Squad" />
        {loading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-card rounded-xl border p-5 text-center text-sm text-muted-foreground">
            No athletes on your team yet.
          </div>
        ) : (
          <div className="bg-card rounded-xl border divide-y">
            {sorted.map((a) => {
              const w = latest[a.id];
              const ready = w?.readiness;
              const tone =
                ready === undefined
                  ? "bg-secondary text-muted-foreground"
                  : ready <= 2
                    ? "bg-destructive/15 text-destructive"
                    : ready === 3
                      ? "bg-gold/20 text-navy-deep"
                      : "bg-success/15 text-success";
              return (
                <Link
                  key={a.id}
                  to="/coach/athlete/$athleteId"
                  params={{ athleteId: a.id }}
                  className="flex items-center gap-3 p-3 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">
                      {a.first_name} {a.last_name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {w
                        ? `${w.sleep_hours}h sleep · quality ${w.sleep_quality}/5 · ${new Date(w.checkin_date).toLocaleDateString()}`
                        : "No check-in yet"}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 ${tone}`}
                  >
                    {ready === undefined ? "—" : `Ready ${ready}/5`}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MobileFrame>
  );
}
