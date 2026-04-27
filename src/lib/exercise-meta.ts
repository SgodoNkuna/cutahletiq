// Lightweight per-exercise metadata stored in the `exercises.notes` column
// so we don't need a schema migration. Format:
//   "@@META {json}
// <free text notes>"
// Older rows without the prefix are treated as plain notes (kind = "strength").

export type ExerciseKind = "strength" | "running" | "time";

export type ExerciseMeta = {
  kind: ExerciseKind;
  /** Duration per set in seconds (running/time only). */
  duration_sec?: number;
  /** If > 0, decrease reps by this amount each successive set (e.g. 10, 8, 6...). */
  rep_step?: number;
};

const PREFIX = "@@META ";

export function parseExerciseNotes(raw: string | null | undefined): {
  meta: ExerciseMeta;
  text: string;
} {
  const fallback: ExerciseMeta = { kind: "strength" };
  if (!raw) return { meta: fallback, text: "" };
  if (!raw.startsWith(PREFIX)) return { meta: fallback, text: raw };
  const newlineIdx = raw.indexOf("\n");
  const jsonPart = newlineIdx === -1 ? raw.slice(PREFIX.length) : raw.slice(PREFIX.length, newlineIdx);
  const text = newlineIdx === -1 ? "" : raw.slice(newlineIdx + 1);
  try {
    const parsed = JSON.parse(jsonPart) as Partial<ExerciseMeta>;
    const kind: ExerciseKind =
      parsed.kind === "running" || parsed.kind === "time" ? parsed.kind : "strength";
    return {
      meta: {
        kind,
        duration_sec:
          typeof parsed.duration_sec === "number" && parsed.duration_sec > 0
            ? Math.min(3600, Math.floor(parsed.duration_sec))
            : undefined,
        rep_step:
          typeof parsed.rep_step === "number" && parsed.rep_step > 0
            ? Math.min(50, Math.floor(parsed.rep_step))
            : undefined,
      },
      text,
    };
  } catch {
    return { meta: fallback, text: raw };
  }
}

export function serializeExerciseNotes(meta: ExerciseMeta, text: string): string {
  const clean: ExerciseMeta = { kind: meta.kind };
  if (meta.duration_sec && meta.duration_sec > 0)
    clean.duration_sec = Math.min(3600, Math.floor(meta.duration_sec));
  if (meta.rep_step && meta.rep_step > 0)
    clean.rep_step = Math.min(50, Math.floor(meta.rep_step));
  // Skip prefix for default plain strength with no extras → keep notes clean.
  if (clean.kind === "strength" && !clean.duration_sec && !clean.rep_step) {
    return text ?? "";
  }
  return `${PREFIX}${JSON.stringify(clean)}${text ? `\n${text}` : ""}`;
}

/** Reps for the Nth set (0-indexed), applying rep step-down if configured. */
export function repsForSet(baseReps: number, setIndex: number, meta: ExerciseMeta): number {
  if (!meta.rep_step || meta.rep_step <= 0) return baseReps;
  return Math.max(1, baseReps - meta.rep_step * setIndex);
}

export function formatDuration(sec?: number): string {
  if (!sec || sec <= 0) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}
