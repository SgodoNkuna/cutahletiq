import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { MobileFrame } from "@/components/MobileFrame";
import { PRBadge } from "@/components/primitives";
import { TourOverlay } from "@/components/TourOverlay";
import { RPEModal } from "@/components/RPEModal";
import { todaysWorkout } from "@/data/mock";
import { cn } from "@/lib/utils";
import { Check, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

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
  const [state, setState] = React.useState(() =>
    todaysWorkout.exercises.map((ex) => ex.sets.map<SetState>((s) => ({ ...s, done: false }))),
  );
  const [askRPE, setAskRPE] = React.useState(false);

  const totalSets = state.flat().length;
  const doneSets = state.flat().filter((s) => s.done).length;
  const newPRs = state
    .map((sets, i) => {
      const ex = todaysWorkout.exercises[i];
      const max = Math.max(...sets.filter((s) => s.done).map((s) => s.weight), 0);
      return ex.pr && max > ex.pr ? { name: ex.name, weight: max } : null;
    })
    .filter(Boolean) as { name: string; weight: number }[];

  const updateSet = (ei: number, si: number, patch: Partial<SetState>) => {
    setState((prev) =>
      prev.map((sets, i) =>
        i === ei ? sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) : sets,
      ),
    );
  };

  const finish = () => setAskRPE(true);

  const submitRPE = (rpe: number) => {
    setAskRPE(false);
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.4 },
      colors: ["#F5A800", "#003478", "#ffffff"],
    });
    toast.success(`Session saved · ${doneSets}/${totalSets} sets · RPE ${rpe}/10 · +${newPRs.length} PR${newPRs.length === 1 ? "" : "s"}`);
    setTimeout(() => navigate({ to: "/athlete/progress" }), 900);
  };

  return (
    <MobileFrame title={todaysWorkout.title}>
      <div className="px-5">
        {/* Progress bar */}
        <div className="bg-card rounded-xl border p-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold uppercase tracking-wider">Session progress</span>
            <span className="text-muted-foreground">{doneSets}/{totalSets} sets</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold to-success transition-all"
              style={{ width: `${(doneSets / totalSets) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-4 mt-4">
          {todaysWorkout.exercises.map((ex, ei) => {
            const max = Math.max(...state[ei].filter((s) => s.done).map((s) => s.weight), 0);
            const isPR = ex.pr && max > ex.pr;
            return (
              <div key={ex.id} className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b bg-secondary/40">
                  <div>
                    <div className="font-display text-lg leading-none">{ex.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      Current PR: <span className="font-bold">{ex.pr} {ex.unit}</span>
                    </div>
                  </div>
                  {isPR && <PRBadge />}
                </div>

                <div className="p-3 space-y-2">
                  {state[ei].map((s, si) => (
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
          className="mt-5 mb-3 w-full bg-gold text-navy-deep font-bold uppercase tracking-wider rounded-full py-3.5 hover:scale-[1.01] transition-transform shadow-lg"
        >
          🏁 Finish session
        </button>
      </div>
      <TourOverlay
        tourKey="athlete.workout"
        steps={[
          { title: "Tap ✓ on each set", body: "Sets turn green when done. Beat your PR and a 🔥 NEW PR badge auto-fires.", position: "center" },
          { title: "Finish for confetti 🎉", body: "Hit Finish, rate the session (RPE 1-10), and your progress chart updates.", position: "bottom" },
        ]}
      />
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
