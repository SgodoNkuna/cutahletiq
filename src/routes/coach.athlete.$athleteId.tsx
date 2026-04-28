import * as React from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { SectionHeader, SportTag } from "@/components/primitives";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Loader2, Trophy, Dumbbell, HeartPulse } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/coach/athlete/$athleteId")({
  head: () => ({
    meta: [
      { title: "Athlete profile — CUT Athletiq" },
      { name: "description", content: "Detailed athlete view for coaches." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CoachAthleteDetail,
});

type Member = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  sport: string | null;
  position: string | null;
};
type PR = {
  id: string;
  exercise_name: string;
  weight_kg: number;
  reps: number;
  achieved_at: string;
};
type LogRow = {
  id: string;
  set_number: number;
  actual_reps: number;
  actual_weight_kg: number;
  is_pr: boolean;
  logged_at: string;
  exercises: { name: string } | null;
};
type Nudge = Database["public"]["Tables"]["nudges"]["Row"];
type InjurySummary = {
  id: string;
  body_region: string;
  injury_type: string;
  severity: number;
  rtp_status: string;
  expected_rtp_date: string | null;
  date_of_injury: string;
};

function CoachAthleteDetail() {
  const { profile } = useAuth();
  const { athleteId } = useParams({ from: "/coach/athlete/$athleteId" });
  const [athlete, setAthlete] = React.useState<Member | null>(null);
  const [prs, setPrs] = React.useState<PR[]>([]);
  const [logs, setLogs] = React.useState<LogRow[]>([]);
  const [nudges, setNudges] = React.useState<Nudge[]>([]);
  const [injuries, setInjuries] = React.useState<InjurySummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      const db = supabase as any;
      const [aRes, prRes, logRes, nudgeRes, injRes] = await Promise.all([
        supabase
          .from("team_members_safe")
          .select("id, first_name, last_name, sport, position")
          .eq("id", athleteId)
          .maybeSingle(),
        supabase
          .from("personal_records")
          .select("id, exercise_name, weight_kg, reps, achieved_at")
          .eq("athlete_id", athleteId)
          .order("achieved_at", { ascending: false })
          .limit(10),
        supabase
          .from("workout_logs")
          .select(
            "id, set_number, actual_reps, actual_weight_kg, is_pr, logged_at, exercises(name)",
          )
          .eq("athlete_id", athleteId)
          .order("logged_at", { ascending: false })
          .limit(20),
        supabase
          .from("nudges")
          .select("*")
          .eq("recipient_id", athleteId)
          .in("type", ["new_programme", "pr_achieved", "missed_session", "checkin_reminder"])
          .order("created_at", { ascending: false })
          .limit(10),
        db
          .from("injury_summary_for_coach")
          .select("id, body_region, injury_type, severity, rtp_status, expected_rtp_date, date_of_injury")
          .eq("athlete_id", athleteId)
          .order("updated_at", { ascending: false })
          .limit(5),
      ]);
      if (cancelled) return;
      setAthlete(aRes.data ? ({ ...aRes.data, id: aRes.data.id as string } as Member) : null);
      setPrs(prRes.data ?? []);
      setLogs((logRes.data ?? []) as unknown as LogRow[]);
      setNudges(nudgeRes.data ?? []);
      setInjuries((injRes.data ?? []) as InjurySummary[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, athleteId]);

  if (!profile) return null;

  const fullName = `${athlete?.first_name ?? ""} ${athlete?.last_name ?? ""}`.trim() || "Athlete";

  return (
    <MobileFrame title={fullName}>
      <div className="px-5 space-y-4">
        <Link
          to="/coach"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-navy uppercase tracking-wider"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to squad
        </Link>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          </div>
        ) : !athlete ? (
          <div className="bg-card rounded-xl border p-5 text-center text-sm text-muted-foreground">
            Athlete not found in your squad.
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-navy to-navy-deep text-white rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center text-xl">
                  {fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-2xl leading-tight truncate">{fullName}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {athlete.sport && <SportTag sport={athlete.sport} />}
                    {athlete.position && (
                      <span className="text-[11px] text-white/70">{athlete.position}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Stat label="PRs" value={prs.length} />
              <Stat label="Sets logged" value={logs.length} />
            </div>

            <SectionHeader title="Recent notifications" />
            {nudges.length === 0 ? (
              <div className="bg-card rounded-xl border p-4 text-center text-xs text-muted-foreground">
                No recent training notifications.
              </div>
            ) : (
              <div className="bg-card rounded-xl border divide-y">
                {nudges.map((n) => (
                  <div key={n.id} className="p-3">
                    <div className="text-sm leading-snug">{n.message}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                      {new Date(n.created_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <SectionHeader title="Recent personal records" />
            {prs.length === 0 ? (
              <div className="bg-card rounded-xl border p-4 text-center text-xs text-muted-foreground">
                No PRs logged yet.
              </div>
            ) : (
              <div className="bg-card rounded-xl border divide-y">
                {prs.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3">
                    <div className="bg-gold/15 text-gold rounded-lg p-2">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{p.exercise_name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(p.achieved_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="font-display text-lg">
                      {p.weight_kg}kg × {p.reps}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <SectionHeader title="Recent sets" />
            {logs.length === 0 ? (
              <div className="bg-card rounded-xl border p-4 text-center text-xs text-muted-foreground">
                No sets logged yet.
              </div>
            ) : (
              <div className="bg-card rounded-xl border divide-y">
                {logs.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 p-3">
                    <div className="bg-navy/10 text-navy rounded-lg p-2">
                      <Dumbbell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">
                        {l.exercises?.name ?? "Exercise"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Set {l.set_number} ·{" "}
                        {new Date(l.logged_at).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-base">
                        {l.actual_weight_kg}kg × {l.actual_reps}
                      </div>
                      {l.is_pr && (
                        <div className="text-[9px] font-bold text-gold uppercase tracking-wider">
                          PR
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </MobileFrame>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card rounded-2xl border p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
        {label}
      </div>
      <div className="font-display text-2xl mt-0.5">{value}</div>
    </div>
  );
}
