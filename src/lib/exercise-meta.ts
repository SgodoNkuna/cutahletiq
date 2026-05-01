// Per-exercise drill metadata.
//
// Historically packed into `exercises.notes` as a JSON prefix. We now have
// real columns (`instructions`, `manual_finish`, `duration_seconds`) on the
// `exercises` table — so this module exposes both the new schema mapping
// and the legacy notes parser for backward compatibility with old rows.

import type { Database } from "@/integrations/supabase/types";

type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];

export type ExerciseKind = "strength" | "running" | "time";

export type ExerciseMeta = {
  kind: ExerciseKind;
  /** Duration per set in seconds (running/time only). */
  duration_sec?: number;
  /** If > 0, decrease reps by this amount each successive set (e.g. 10, 8, 6...). */
  rep_step?: number;
  /** Coach instructions shown to the athlete during the set. */
  instructions?: string;
  /** When true, athlete must tap "drill finished" — no auto-complete on timer. */
  manual_finish?: boolean;
};

const PREFIX = "@@META ";
const MAX_INSTRUCTIONS = 1000;

/**
 * Resolve drill metadata from a row. New columns win; legacy notes-JSON is
 * used as fallback so older rows still render with their old kind/step config.
 */
export function metaFromRow(row: Partial<ExerciseRow> | null | undefined): ExerciseMeta {
  if (!row) return { kind: "strength" };
  const legacy = parseExerciseNotes(row.notes ?? null).meta;
  const duration =
    typeof row.duration_seconds === "number" && row.duration_seconds > 0
      ? row.duration_seconds
      : legacy.duration_sec;
  const kind: ExerciseKind = duration ? (legacy.kind === "time" ? "time" : "running") : legacy.kind;
  return {
    kind,
    duration_sec: duration,
    rep_step: legacy.rep_step,
    instructions: row.instructions?.trim() || legacy.instructions,
    manual_finish: !!row.manual_finish,
  };
}

/** Body that text part of `notes` carries in the new world (just rep_step + kind hint). */
export function notesFromMeta(meta: ExerciseMeta, freeText: string): string {
  const clean: ExerciseMeta = { kind: meta.kind };
  if (meta.rep_step && meta.rep_step > 0) clean.rep_step = Math.min(50, Math.floor(meta.rep_step));
  if (
    clean.kind === "strength" &&
    !clean.rep_step
  ) {
    return freeText ?? "";
  }
  return `${PREFIX}${JSON.stringify(clean)}${freeText ? `\n${freeText}` : ""}`;
}

// ---------- Legacy parser (kept for old rows that still have JSON in notes) ----------

export function parseExerciseNotes(raw: string | null | undefined): {
  meta: ExerciseMeta;
  text: string;
} {
  const fallback: ExerciseMeta = { kind: "strength" };
  if (!raw) return { meta: fallback, text: "" };
  if (!raw.startsWith(PREFIX)) return { meta: fallback, text: raw };
  const newlineIdx = raw.indexOf("\n");
  const jsonPart =
    newlineIdx === -1 ? raw.slice(PREFIX.length) : raw.slice(PREFIX.length, newlineIdx);
  const text = newlineIdx === -1 ? "" : raw.slice(newlineIdx + 1);
  try {
    const parsed = JSON.parse(jsonPart) as Partial<ExerciseMeta>;
    const kind: ExerciseKind =
      parsed.kind === "running" || parsed.kind === "time" ? parsed.kind : "strength";
    const instructions =
      typeof parsed.instructions === "string" && parsed.instructions.trim()
        ? parsed.instructions.trim().slice(0, MAX_INSTRUCTIONS)
        : undefined;
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
        instructions,
        manual_finish: !!parsed.manual_finish,
      },
      text,
    };
  } catch {
    return { meta: fallback, text: raw };
  }
}

/** @deprecated Use notesFromMeta + dedicated columns. Kept for back-compat. */
export function serializeExerciseNotes(meta: ExerciseMeta, text: string): string {
  return notesFromMeta(meta, text);
}

/** Reps for the Nth set (0-indexed), applying rep step-down if configured. */
export function repsForSet(baseReps: number, setIndex: number, meta: ExerciseMeta): number {
  if (!meta.rep_step || meta.rep_step <= 0) return baseReps;
  return Math.max(1, baseReps - meta.rep_step * setIndex);
}

export function formatDuration(sec?: number | null): string {
  if (!sec || sec <= 0) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

/**
 * Validate an exercise + meta combination. Returns an array of
 * human-friendly error strings (empty = valid).
 *
 * Mirrors the DB CHECK constraints `exercises_valid_volume` and
 * `exercises_duration_nonneg`, plus client-only UX rules.
 */
export function validateExercise(input: {
  name?: string;
  sets: number;
  reps: number;
  meta: ExerciseMeta;
}): string[] {
  const errors: string[] = [];
  if (!input.name || !input.name.trim()) errors.push("Drill name is required");
  if (input.sets < 1) errors.push("Sets must be at least 1");
  if (input.meta.kind !== "strength") {
    if (!input.meta.duration_sec || input.meta.duration_sec <= 0) {
      errors.push("Duration is required for running/timed drills");
    }
    if (input.meta.duration_sec && input.meta.duration_sec < 0) {
      errors.push("Duration cannot be negative");
    }
  } else if (input.reps < 1) {
    errors.push("Reps must be at least 1");
  }
  if (input.meta.rep_step && input.meta.rep_step >= input.reps) {
    errors.push("Step-down must be smaller than starting reps");
  }
  if (input.meta.instructions && input.meta.instructions.length > MAX_INSTRUCTIONS) {
    errors.push(`Instructions must be ${MAX_INSTRUCTIONS} characters or fewer`);
  }
  return errors;
}

/** Reps preview across all sets (e.g. [10, 8, 6, 4]). */
export function previewReps(sets: number, reps: number, meta: ExerciseMeta): number[] {
  const safeSets = Math.max(1, Math.min(20, Math.floor(sets || 1)));
  return Array.from({ length: safeSets }, (_, i) => repsForSet(reps, i, meta));
}

/**
 * Validate a complete programme before publishing (Section 9).
 * Returns { ok, errors }.
 */
export function validateProgrammeForPublish(programme: {
  sessions: Array<{
    name: string;
    exercises: Array<Pick<ExerciseRow, "name" | "sets" | "reps" | "duration_seconds" | "instructions" | "manual_finish" | "notes">>;
  }>;
}): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!programme.sessions.length) {
    errors.push("Add at least one workout to publish.");
    return { ok: false, errors };
  }
  programme.sessions.forEach((s, si) => {
    if (!s.exercises.length) {
      errors.push(`Session ${si + 1} (${s.name || "untitled"}) has no drills.`);
      return;
    }
    s.exercises.forEach((ex) => {
      const meta = metaFromRow(ex as Partial<ExerciseRow>);
      const errs = validateExercise({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        meta,
      });
      if (errs.length) errors.push(`${ex.name || "Drill"}: ${errs.join(", ")}`);
    });
  });
  return { ok: errors.length === 0, errors };
}
