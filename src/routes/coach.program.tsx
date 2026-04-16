import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { SectionHeader } from "@/components/primitives";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Exercise = { id: string; name: string; sets: number; reps: string };
type Session = { id: string; day: string; title: string; exercises: Exercise[] };

const SEED: Session[] = [
  {
    id: "s1",
    day: "Mon",
    title: "Lower · Strength",
    exercises: [
      { id: "x1", name: "Back Squat", sets: 4, reps: "5" },
      { id: "x2", name: "Romanian Deadlift", sets: 3, reps: "8" },
      { id: "x3", name: "Walking Lunge", sets: 3, reps: "12" },
    ],
  },
  {
    id: "s2",
    day: "Wed",
    title: "Upper · Power",
    exercises: [
      { id: "x4", name: "Bench Press", sets: 5, reps: "3" },
      { id: "x5", name: "Pull-up", sets: 4, reps: "AMRAP" },
    ],
  },
  {
    id: "s3",
    day: "Fri",
    title: "Speed + Agility",
    exercises: [
      { id: "x6", name: "Sprints 40m", sets: 6, reps: "1" },
      { id: "x7", name: "Med-ball throws", sets: 4, reps: "8" },
    ],
  },
];

export const Route = createFileRoute("/coach/program")({
  head: () => ({
    meta: [
      { title: "Program Builder — CUT Athletiq" },
      { name: "description", content: "Plan team or individual training cycles." },
    ],
  }),
  component: ProgramPage,
});

function ProgramPage() {
  const [scope, setScope] = React.useState<"team" | "individual">("team");
  const [sessions, setSessions] = React.useState<Session[]>(SEED);

  const addExercise = (sid: string) => {
    setSessions((arr) =>
      arr.map((s) =>
        s.id === sid
          ? {
              ...s,
              exercises: [
                ...s.exercises,
                { id: crypto.randomUUID(), name: "New exercise", sets: 3, reps: "8" },
              ],
            }
          : s,
      ),
    );
  };
  const removeExercise = (sid: string, xid: string) => {
    setSessions((arr) =>
      arr.map((s) => (s.id === sid ? { ...s, exercises: s.exercises.filter((x) => x.id !== xid) } : s)),
    );
  };
  const addSession = () => {
    setSessions((arr) => [
      ...arr,
      { id: crypto.randomUUID(), day: "Sat", title: "New session", exercises: [] },
    ]);
  };
  const removeSession = (sid: string) => setSessions((arr) => arr.filter((s) => s.id !== sid));

  const publish = () => {
    toast.success(`Program published to ${scope === "team" ? "Rugby squad (16 athletes)" : "Thabo Mokoena"}`);
  };

  return (
    <MobileFrame title="Program Builder">
      <div className="px-5">
        <div className="bg-card rounded-xl border p-1 flex">
          {(["team", "individual"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-colors",
                scope === s ? "bg-navy text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s === "team" ? "Team plan" : "Individual"}
            </button>
          ))}
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          {scope === "team"
            ? "Applies to all 16 Rugby squad members. Individuals can override."
            : "Custom plan for Thabo Mokoena · 1 athlete."}
        </div>

        <SectionHeader
          title="Week 1"
          action={
            <button onClick={addSession} className="text-[11px] font-bold text-navy uppercase tracking-wider flex items-center gap-1">
              <Plus className="h-3 w-3" /> Session
            </button>
          }
        />

        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="bg-card rounded-2xl border shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 p-3 bg-secondary/40 border-b">
                <div className="bg-gold text-navy-deep rounded-md px-2 py-0.5 text-[11px] font-bold">{s.day}</div>
                <input
                  value={s.title}
                  onChange={(e) =>
                    setSessions((arr) => arr.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)))
                  }
                  className="flex-1 bg-transparent text-sm font-bold focus:outline-none"
                />
                <button onClick={() => removeSession(s.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="p-2 space-y-1.5">
                {s.exercises.map((x) => (
                  <div key={x.id} className="flex items-center gap-2 rounded-lg border p-2 bg-background">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <input
                      value={x.name}
                      onChange={(e) =>
                        setSessions((arr) =>
                          arr.map((sn) =>
                            sn.id === s.id
                              ? { ...sn, exercises: sn.exercises.map((ex) => (ex.id === x.id ? { ...ex, name: e.target.value } : ex)) }
                              : sn,
                          ),
                        )
                      }
                      className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none"
                    />
                    <input
                      type="number"
                      value={x.sets}
                      onChange={(e) =>
                        setSessions((arr) =>
                          arr.map((sn) =>
                            sn.id === s.id
                              ? { ...sn, exercises: sn.exercises.map((ex) => (ex.id === x.id ? { ...ex, sets: +e.target.value } : ex)) }
                              : sn,
                          ),
                        )
                      }
                      className="w-10 text-center text-sm font-bold bg-secondary rounded-md py-1"
                    />
                    <span className="text-[10px] text-muted-foreground">×</span>
                    <input
                      value={x.reps}
                      onChange={(e) =>
                        setSessions((arr) =>
                          arr.map((sn) =>
                            sn.id === s.id
                              ? { ...sn, exercises: sn.exercises.map((ex) => (ex.id === x.id ? { ...ex, reps: e.target.value } : ex)) }
                              : sn,
                          ),
                        )
                      }
                      className="w-12 text-center text-sm font-bold bg-secondary rounded-md py-1"
                    />
                    <button onClick={() => removeExercise(s.id, x.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
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
          Publish program
        </button>
      </div>
    </MobileFrame>
  );
}
