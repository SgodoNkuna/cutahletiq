import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { SectionHeader } from "@/components/primitives";
import { Plus, Trash2, GripVertical, Loader2, Dumbbell, Footprints, Timer } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useCoachProgramme } from "@/lib/hooks/use-coach-programme";
import {
  parseExerciseNotes,
  serializeExerciseNotes,
  type ExerciseKind,
} from "@/lib/exercise-meta";

export const Route = createFileRoute("/coach/program")({
  head: () => ({
    meta: [
      { title: "Program Builder — CUT Athletiq" },
      { name: "description", content: "Plan team or individual training cycles." },
    ],
  }),
  component: ProgramPage,
});

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function dayLabel(iso: string) {
  return DOW[new Date(iso + "T00:00:00").getDay()] ?? "—";
}

function ProgramPage() {
  const { profile } = useAuth();
  const coachId = profile?.id ?? null;
  const teamId = profile?.team_id ?? null;
  const {
    programme,
    loading,
    addSession,
    removeSession,
    updateSession,
    addExercise,
    updateExercise,
    removeExercise,
    renameProgramme,
  } = useCoachProgramme(coachId, teamId);

  const handleAddSession = () => {
    const next = new Date();
    next.setDate(next.getDate() + (programme?.sessions.length ?? 0));
    void addSession(next.toISOString().slice(0, 10), "New session");
  };

  const publish = () => {
    if (!teamId) {
      toast.error("Create or join a team first to publish");
      return;
    }
    toast.success("Programme is live for your team — athletes have been notified.");
  };

  if (loading || !programme) {
    return (
      <MobileFrame title="Program Builder">
        <div className="px-5 py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      </MobileFrame>
    );
  }

  return (
    <MobileFrame title="Program Builder">
      <div className="px-5">
        <div className="bg-card rounded-xl border p-3">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            Programme name
          </label>
          <input
            value={programme.name}
            onChange={(e) => renameProgramme(e.target.value)}
            maxLength={120}
            className="w-full bg-transparent text-base font-bold focus:outline-none mt-1"
          />
          <div className="text-[11px] text-muted-foreground mt-1">
            {teamId
              ? "Visible to your team. Athletes get a nudge on publish."
              : "⚠ No team yet — create one to share with athletes."}
          </div>
        </div>

        <SectionHeader
          title="Sessions"
          action={
            <button
              onClick={handleAddSession}
              className="text-[11px] font-bold text-navy uppercase tracking-wider flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Session
            </button>
          }
        />

        <div className="space-y-3">
          {programme.sessions.length === 0 && (
            <div className="bg-secondary/40 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No sessions yet. Tap <span className="font-bold">+ Session</span> above to add one.
            </div>
          )}
          {programme.sessions.map((s) => (
            <div key={s.id} className="bg-card rounded-2xl border shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 p-3 bg-secondary/40 border-b">
                <div className="bg-gold text-navy-deep rounded-md px-2 py-0.5 text-[11px] font-bold">
                  {dayLabel(s.session_date)}
                </div>
                <input
                  value={s.name}
                  onChange={(e) => updateSession(s.id, { name: e.target.value })}
                  maxLength={120}
                  className="flex-1 min-w-0 bg-transparent text-sm font-bold focus:outline-none"
                />
                <input
                  type="date"
                  value={s.session_date}
                  onChange={(e) => updateSession(s.id, { session_date: e.target.value })}
                  className="text-[11px] bg-secondary rounded px-1.5 py-1"
                />
                <button
                  onClick={() => removeSession(s.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove session"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="p-2 space-y-1.5">
                {s.exercises.map((x) => {
                  const { meta, text } = parseExerciseNotes(x.notes);
                  const setKind = (kind: ExerciseKind) =>
                    updateExercise(x.id, s.id, {
                      notes: serializeExerciseNotes({ ...meta, kind }, text),
                    });
                  const setDuration = (sec: number) =>
                    updateExercise(x.id, s.id, {
                      notes: serializeExerciseNotes(
                        { ...meta, duration_sec: Math.max(0, Math.min(3600, sec)) },
                        text,
                      ),
                    });
                  const setRepStep = (step: number) =>
                    updateExercise(x.id, s.id, {
                      notes: serializeExerciseNotes(
                        { ...meta, rep_step: Math.max(0, Math.min(50, step)) },
                        text,
                      ),
                    });
                  const isStrength = meta.kind === "strength";
                  return (
                    <div key={x.id} className="rounded-lg border bg-background p-2 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        <input
                          value={x.name}
                          onChange={(e) =>
                            updateExercise(x.id, s.id, { name: e.target.value })
                          }
                          maxLength={80}
                          className="flex-1 min-w-0 bg-transparent text-sm font-bold focus:outline-none"
                        />
                        <KindToggle kind={meta.kind} onChange={setKind} />
                        <button
                          onClick={() => removeExercise(x.id, s.id)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Remove exercise"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap pl-5">
                        <Field label="Sets">
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={x.sets}
                            onChange={(e) =>
                              updateExercise(x.id, s.id, {
                                sets: Math.max(1, Math.min(20, +e.target.value || 1)),
                              })
                            }
                            className="w-10 text-center text-sm font-bold bg-secondary rounded-md py-1"
                          />
                        </Field>
                        <Field label={isStrength ? "Reps" : "Reps/round"}>
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={x.reps}
                            onChange={(e) =>
                              updateExercise(x.id, s.id, {
                                reps: Math.max(1, Math.min(500, +e.target.value || 1)),
                              })
                            }
                            className="w-12 text-center text-sm font-bold bg-secondary rounded-md py-1"
                          />
                        </Field>
                        {isStrength ? (
                          <Field label="kg">
                            <input
                              type="number"
                              min={0}
                              max={500}
                              step={2.5}
                              value={x.weight_kg ?? 0}
                              onChange={(e) =>
                                updateExercise(x.id, s.id, {
                                  weight_kg: Math.max(
                                    0,
                                    Math.min(500, +e.target.value || 0),
                                  ),
                                })
                              }
                              className="w-14 text-center text-sm font-bold bg-secondary rounded-md py-1"
                            />
                          </Field>
                        ) : (
                          <Field label={meta.kind === "running" ? "Sec/run" : "Sec/set"}>
                            <input
                              type="number"
                              min={0}
                              max={3600}
                              step={5}
                              value={meta.duration_sec ?? 0}
                              onChange={(e) => setDuration(+e.target.value || 0)}
                              className="w-14 text-center text-sm font-bold bg-secondary rounded-md py-1"
                            />
                          </Field>
                        )}
                        <Field label="Step −">
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={meta.rep_step ?? 0}
                            onChange={(e) => setRepStep(+e.target.value || 0)}
                            className="w-12 text-center text-sm font-bold bg-secondary rounded-md py-1"
                            title="Decrease reps each set (e.g. 10 → 8 → 6)"
                          />
                        </Field>
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={() => addExercise(s.id)}
                  className="w-full rounded-lg border-2 border-dashed border-border py-2 text-xs font-bold text-muted-foreground hover:border-gold hover:text-gold flex items-center justify-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add exercise
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={publish}
          className="mt-5 w-full bg-gold text-navy-deep font-bold uppercase tracking-wider rounded-full py-3 hover:scale-[1.01] transition-transform shadow-lg"
        >
          {teamId ? "Notify athletes" : "Create a team to publish"}
        </button>
        <div className="mt-2 mb-3 text-[10px] text-center text-muted-foreground">
          Changes save automatically as you type.
        </div>
      </div>
    </MobileFrame>
  );
}
