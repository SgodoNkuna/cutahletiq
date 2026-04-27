import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { MobileFrame } from "@/components/MobileFrame";
import { PRBadge } from "@/components/primitives";
import { RPEModal } from "@/components/RPEModal";
import { cn } from "@/lib/utils";
import { Check, Plus, Minus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { rpeSchema } from "@/lib/sanitize";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchTodaysSessionForAthlete,
  type DBSession,
  type DBExercise,
} from "@/lib/hooks/use-coach-programme";
import { parseExerciseNotes, repsForSet, formatDuration } from "@/lib/exercise-meta";

export const Route = createFileRoute("/athlete/workout")({
  head: () => ({
    meta: [
      { title: "Workout — CUT Athletiq" },
      { name: "description", content: "Log your sets, reps and PRs in real time." },
    ],
  }),
  component: WorkoutPage,
});

type SetState = { reps: number; weight: number; done: boolean };

function WorkoutPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [session, setSession] = React.useState<DBSession | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [state, setState] = React.useState<SetState[][]>([]);
  const [prs, setPRs] = React.useState<Record<string, number>>({}); // exercise_name -> max kg
  const [askRPE, setAskRPE] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Load today's session + athlete's existing PRs
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await fetchTodaysSessionForAthlete();
      if (cancelled) return;
      setSession(s);
      if (s) {
        setState(
          s.exercises.map((ex) =>
            Array.from({ length: ex.sets }, () => ({
              reps: ex.reps,
              weight: ex.weight_kg ?? 0,
              done: false,
            })),
          ),
        );
      }
      if (profile?.id) {
        const { data: prRows } = await supabase
          .from("personal_records")
          .select("exercise_name, weight_kg")
          .eq("athlete_id", profile.id);
        if (!cancelled && prRows) {
          const map: Record<string, number> = {};
          for (const r of prRows) {
            const w = Number(r.weight_kg);
            if (!map[r.exercise_name] || w > map[r.exercise_name]) map[r.exercise_name] = w;
          }
          setPRs(map);
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  if (loading) {
    return (
      <MobileFrame title="Workout">
        <div className="px-5 py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      </MobileFrame>
    );
  }

  if (!session) {
    return (
      <MobileFrame title="Workout">
        <div className="px-5 py-10 text-center">
          <div className="text-5xl mb-3">🏖</div>
          <div className="font-display text-2xl">No session scheduled</div>
          <p className="text-sm text-muted-foreground mt-2">
            Your coach hasn't published a session for today. Check back later or browse your
            calendar.
          </p>
          <button
            onClick={() => navigate({ to: "/athlete" })}
            className="mt-6 bg-gold text-navy-deep font-bold uppercase tracking-wider rounded-full py-3 px-6"
          >
            Back home
          </button>
        </div>
      </MobileFrame>
    );
  }

  const totalSets = state.flat().length;
  const doneSets = state.flat().filter((s) => s.done).length;

  const newPRs = state
    .map((sets, i) => {
      const ex = session.exercises[i];
      const max = Math.max(...sets.filter((s) => s.done).map((s) => s.weight), 0);
      const currentPR = prs[ex.name] ?? 0;
      return max > currentPR && max > 0 ? { name: ex.name, weight: max } : null;
    })
    .filter(Boolean) as { name: string; weight: number }[];

  const updateSet = (ei: number, si: number, patch: Partial<SetState>) => {
    setState((prev) =>
      prev.map((sets, i) =>
        i === ei ? sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) : sets,
      ),
    );
  };

  const finish = () => {
    if (doneSets === 0) {
      toast.error("Tick at least one set first");
      return;
    }
    setAskRPE(true);
  };

  const submitRPE = async (rpe: number) => {
    const parsed = rpeSchema.safeParse(rpe);
    if (!parsed.success) {
      toast.error("Invalid RPE value");
      return;
    }
    if (!profile?.id || !session) return;
    setAskRPE(false);
    setSaving(true);

    // Persist all done sets as workout_logs
    const rows: Array<{
      athlete_id: string;
      exercise_id: string;
      session_id: string;
      set_number: number;
      actual_reps: number;
      actual_weight_kg: number;
      is_pr: boolean;
    }> = [];
    state.forEach((sets, ei) => {
      const ex = session.exercises[ei];
      sets.forEach((s, si) => {
        if (!s.done) return;
        const isPR = newPRs.some((p) => p.name === ex.name && s.weight === p.weight);
        rows.push({
          athlete_id: profile.id,
          exercise_id: ex.id,
          session_id: session.id,
          set_number: si + 1,
          actual_reps: s.reps,
          actual_weight_kg: s.weight,
          is_pr: isPR,
        });
      });
    });

    const { error: logErr } = await supabase.from("workout_logs").insert(rows);
    if (logErr) {
      setSaving(false);
      toast.error("Could not save workout");
      return;
    }

    // Persist PRs
    if (newPRs.length > 0) {
      const prRows = newPRs.map((p) => {
        const exIndex = session.exercises.findIndex((e: DBExercise) => e.name === p.name);
        const setEntry = state[exIndex]?.find((s) => s.done && s.weight === p.weight);
        return {
          athlete_id: profile.id,
          exercise_name: p.name,
          weight_kg: p.weight,
          reps: setEntry?.reps ?? 1,
        };
      });
      await supabase.from("personal_records").insert(prRows);
    }

    await (supabase as any).from("session_completions").upsert(
      {
        athlete_id: profile.id,
        session_id: session.id,
        rpe: parsed.data,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "athlete_id,session_id" },
    );

    setSaving(false);
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.4 },
      colors: ["#F5A800", "#003478", "#ffffff"],
    });
    toast.success(
      `Saved · ${doneSets}/${totalSets} sets · RPE ${parsed.data}/10 · +${newPRs.length} PR${newPRs.length === 1 ? "" : "s"}`,
    );
    setTimeout(() => navigate({ to: "/athlete" }), 900);
  };

  return (
    <MobileFrame title={session.name}>
      <div className="px-5">
        {/* Progress bar */}
        <div className="bg-card rounded-xl border p-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold uppercase tracking-wider">Session progress</span>
            <span className="text-muted-foreground">
              {doneSets}/{totalSets} sets
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold to-success transition-all"
              style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="space-y-4 mt-4">
          {session.exercises.map((ex, ei) => {
            const max = Math.max(
              ...(state[ei] ?? []).filter((s) => s.done).map((s) => s.weight),
              0,
            );
            const currentPR = prs[ex.name] ?? 0;
            const isPR = max > currentPR && max > 0;
            return (
              <div key={ex.id} className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b bg-secondary/40">
                  <div>
                    <div className="font-display text-lg leading-none">{ex.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      Current PR: <span className="font-bold">{currentPR || "—"} kg</span>
                    </div>
                  </div>
                  {isPR && <PRBadge />}
                </div>

                <div className="p-3 space-y-2">
                  {(state[ei] ?? []).map((s, si) => (
                    <div
                      key={si}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-2 transition-colors",
                        s.done ? "bg-success/10 border-success/40" : "bg-background",
                      )}
                    >
                      <div className="w-8 h-8 rounded-md bg-navy/10 text-navy text-xs font-bold flex items-center justify-center">
                        {si + 1}
                      </div>
                      <NumStepper
                        label="reps"
                        value={s.reps}
                        onChange={(v) => updateSet(ei, si, { reps: v })}
                        disabled={s.done}
                      />
                      <NumStepper
                        label="kg"
                        value={s.weight}
                        step={2.5}
                        onChange={(v) => updateSet(ei, si, { weight: v })}
                        disabled={s.done}
                      />
                      <button
                        onClick={() => updateSet(ei, si, { done: !s.done })}
                        className={cn(
                          "ml-auto h-9 w-9 rounded-full flex items-center justify-center font-bold transition-colors",
                          s.done
                            ? "bg-success text-white"
                            : "bg-secondary text-muted-foreground hover:bg-gold hover:text-navy-deep",
                        )}
                        aria-label={s.done ? "Mark incomplete" : "Mark complete"}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={finish}
          disabled={saving}
          className="mt-5 mb-3 w-full bg-gold text-navy-deep font-bold uppercase tracking-wider rounded-full py-3.5 hover:scale-[1.01] transition-transform shadow-lg disabled:opacity-50"
        >
          {saving ? "Saving…" : "🏁 Finish session"}
        </button>
      </div>
      <RPEModal open={askRPE} onSubmit={submitRPE} />
    </MobileFrame>
  );
}

function NumStepper({
  label,
  value,
  onChange,
  step = 1,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1">
        <button
          disabled={disabled}
          onClick={() => onChange(Math.max(0, value - step))}
          className="h-6 w-6 rounded-md bg-secondary disabled:opacity-40 hover:bg-border flex items-center justify-center"
        >
          <Minus className="h-3 w-3" />
        </button>
        <div className="font-bold text-sm w-10 text-center tabular-nums">{value}</div>
        <button
          disabled={disabled}
          onClick={() => onChange(value + step)}
          className="h-6 w-6 rounded-md bg-secondary disabled:opacity-40 hover:bg-border flex items-center justify-center"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
