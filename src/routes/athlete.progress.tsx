import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { SectionHeader } from "@/components/primitives";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trophy } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/athlete/progress")({
  head: () => ({
    meta: [
      { title: "Progress — CUT Athletiq" },
      { name: "description", content: "Personal records and recent training history." },
    ],
  }),
  component: ProgressPage,
});

type PR = { id: string; exercise_name: string; weight_kg: number; reps: number; achieved_at: string };

function ProgressPage() {
  const { profile } = useAuth();
  const [prs, setPRs] = React.useState<PR[]>([]);
  const [history, setHistory] = React.useState<{ date: string; total: number }[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    if (!profile) return;
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 56);
      const sinceISO = since.toISOString();
      const [prRes, logRes] = await Promise.all([
        supabase
          .from("personal_records")
          .select("id, exercise_name, weight_kg, reps, achieved_at")
          .eq("athlete_id", profile.id)
          .order("achieved_at", { ascending: false })
          .limit(20),
        supabase
          .from("workout_logs")
          .select("logged_at, actual_weight_kg, actual_reps")
          .eq("athlete_id", profile.id)
          .gte("logged_at", sinceISO),
      ]);
      if (cancelled) return;
      setPRs(((prRes.data ?? []) as unknown as PR[]));
      // Aggregate volume per day
      const buckets = new Map<string, number>();
      for (const r of logRes.data ?? []) {
        const day = (r.logged_at as string).slice(0, 10);
        buckets.set(day, (buckets.get(day) ?? 0) + Number(r.actual_weight_kg) * Number(r.actual_reps));
      }
      const hist = Array.from(buckets.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, total]) => ({ date: date.slice(5), total: Math.round(total) }));
      setHistory(hist);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [profile]);

  if (!profile) return null;

  return (
    <MobileFrame title="My Progress">
      <div className="px-5">
        <SectionHeader title="Volume · last 8 weeks" />
        <div className="bg-card rounded-2xl border p-3">
          {loading ? (
            <div className="h-44 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gold" /></div>
          ) : history.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
              Log your first workout to see your weekly volume here.
            </div>
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 250)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="oklch(0.5 0.02 260)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="oklch(0.5 0.02 260)" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid oklch(0.9 0.01 250)" }}
                    formatter={(v) => [`${v} kg total`, "Volume"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="oklch(0.32 0.13 258)"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "oklch(0.79 0.16 78)", stroke: "oklch(0.32 0.13 258)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <SectionHeader title="Personal records" />
        {loading ? (
          <div className="py-8 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gold" /></div>
        ) : prs.length === 0 ? (
          <div className="bg-card rounded-xl border p-5 text-center text-sm text-muted-foreground">
            No PRs yet — finish a session and beat your weight to log one.
          </div>
        ) : (
          <div className="space-y-2">
            {prs.map((pr) => (
              <div key={pr.id} className="bg-card rounded-xl border p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-gold" /> {pr.exercise_name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(pr.achieved_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} · {pr.reps} reps
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl text-navy leading-none">
                    {Number(pr.weight_kg)}<span className="text-sm text-muted-foreground ml-1">kg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileFrame>
  );
}
