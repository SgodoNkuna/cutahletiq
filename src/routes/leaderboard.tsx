import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2, Trophy } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — CUT Athletiq" },
      { name: "description", content: "Team rankings based on training volume and PRs." },
    ],
  }),
  component: LeaderboardPage,
});

type Row = { athlete_id: string; name: string; sport: string | null; volume: number; pr_count: number; points: number };

function LeaderboardPage() {
  const { profile } = useAuth();
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    if (!profile) return;
    (async () => {
      // Aggregate by team. Profile-only view of teammates.
      const { data: members } = await supabase
        .from("team_members_safe")
        .select("id, first_name, last_name, sport, role");
      const athletes = (members ?? []).filter((m) => m.role === "athlete" && m.id);
      if (athletes.length === 0) { setLoading(false); return; }
      const ids = athletes.map((a) => a.id as string);
      const since = new Date();
      since.setDate(since.getDate() - 28);
      const [logsRes, prsRes] = await Promise.all([
        supabase
          .from("workout_logs")
          .select("athlete_id, actual_weight_kg, actual_reps")
          .in("athlete_id", ids)
          .gte("logged_at", since.toISOString()),
        supabase
          .from("personal_records")
          .select("athlete_id")
          .in("athlete_id", ids),
      ]);
      if (cancelled) return;
      const volumeByAthlete = new Map<string, number>();
      for (const r of logsRes.data ?? []) {
        volumeByAthlete.set(
          r.athlete_id as string,
          (volumeByAthlete.get(r.athlete_id as string) ?? 0) + Number(r.actual_weight_kg) * Number(r.actual_reps),
        );
      }
      const prsByAthlete = new Map<string, number>();
      for (const r of prsRes.data ?? []) {
        prsByAthlete.set(r.athlete_id as string, (prsByAthlete.get(r.athlete_id as string) ?? 0) + 1);
      }
      const computed: Row[] = athletes.map((a) => {
        const vol = volumeByAthlete.get(a.id as string) ?? 0;
        const prs = prsByAthlete.get(a.id as string) ?? 0;
        const points = Math.round(vol / 10) + prs * 50;
        const name = `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() || "Athlete";
        return { athlete_id: a.id as string, name, sport: a.sport, volume: Math.round(vol), pr_count: prs, points };
      }).sort((a, b) => b.points - a.points);
      setRows(computed);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [profile]);

  if (!profile) return null;

  const top = rows[0];

  return (
    <MobileFrame title="Leaderboard">
      <div className="px-5">
        <div className="bg-gradient-to-br from-navy to-navy-deep text-white rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gold/20 blur-2xl" />
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/70 relative">
            <Trophy className="h-3.5 w-3.5 text-gold" /> Top performer
          </div>
          {loading ? (
            <div className="py-4"><Loader2 className="h-5 w-5 animate-spin text-gold" /></div>
          ) : top ? (
            <div className="relative mt-1">
              <div className="font-display text-3xl">{top.name}</div>
              <div className="text-[11px] text-white/70">{top.sport ?? "—"}</div>
              <div className="font-display text-5xl text-gold mt-2 leading-none tabular-nums">
                {top.points.toLocaleString()}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-white/60">Performance points</div>
            </div>
          ) : (
            <div className="text-sm text-white/80 mt-2">No data yet — log workouts to climb the board.</div>
          )}
        </div>

        {!loading && rows.length > 0 && (
          <div className="bg-card rounded-xl border divide-y mt-4">
            {rows.map((l, i) => (
              <div key={l.athlete_id} className="flex items-center gap-3 p-3">
                <div className="font-display text-lg w-6 text-center text-navy">{i + 1}</div>
                <div className={cn(
                  "h-9 w-9 rounded-full text-xs font-bold flex items-center justify-center",
                  i === 0 ? "bg-gold text-navy-deep" : "bg-gradient-to-br from-navy to-navy-deep text-white",
                )}>
                  {l.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{l.name}</div>
                  <div className="text-[10px] text-muted-foreground">{l.sport ?? "—"} · {l.pr_count} PR{l.pr_count === 1 ? "" : "s"}</div>
                </div>
                <div className="font-bold text-sm tabular-nums">{l.points}</div>
              </div>
            ))}
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="bg-card rounded-xl border p-5 text-center text-sm text-muted-foreground mt-4">
            No teammates yet. Once your team has athletes logging workouts, they'll appear here.
          </div>
        )}
      </div>
    </MobileFrame>
  );
}
