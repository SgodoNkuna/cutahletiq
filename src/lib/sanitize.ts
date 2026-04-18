import { z } from "zod";

/**
 * Strip ASCII control chars (except \t \n \r) and trim.
 * Cheap defence against weird paste-bombs / log-injection in a demo,
 * and a sane base-line for any real backend that lands later.
 */
export function cleanText(input: unknown): string {
  if (typeof input !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

/** HTML-escape for any string we ever inject into href/text. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Zod schemas the demo (and any future API) can share. */
export const noteSchema = z
  .string()
  .max(500, "Notes capped at 500 characters")
  .transform(cleanText);

export const skipPracticeSchema = z.object({
  session: z.string().min(1).max(120).transform(cleanText),
  reason: z.enum(["injury", "sick", "academic", "personal", "transport", "other"]),
  notes: noteSchema.optional(),
});

export const checkInSchema = z.object({
  sleep: z.number().min(0).max(24),
  soreness: z.number().int().min(0).max(10),
  readiness: z.number().int().min(0).max(100),
  mood: z.enum(["fired", "good", "ok", "tired", "off"]),
});

export const rpeSchema = z.number().int().min(1).max(10);

export type SkipPractice = z.infer<typeof skipPracticeSchema>;
export type CheckInData = z.infer<typeof checkInSchema>;
