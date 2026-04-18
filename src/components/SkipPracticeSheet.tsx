import * as React from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { X, AlertCircle } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { skipPracticeSchema } from "@/lib/sanitize";
import { currentAthlete } from "@/data/mock";

type Props = {
  open: boolean;
  onClose: () => void;
};

const REASONS = [
  { id: "injury", label: "Injury / pain", emoji: "🤕" },
  { id: "sick", label: "Sick", emoji: "🤒" },
  { id: "academic", label: "Academic", emoji: "📚" },
  { id: "personal", label: "Personal", emoji: "🏠" },
  { id: "transport", label: "Transport", emoji: "🚌" },
  { id: "other", label: "Other", emoji: "❓" },
] as const;

const NOTE_MAX = 500;

export function SkipPracticeSheet({ open, onClose }: Props) {
  const [reason, setReason] = React.useState<(typeof REASONS)[number]["id"]>("injury");
  const [notes, setNotes] = React.useState("");
  const [session, setSession] = React.useState("Today · 16:00 Tactical");
  const { addSkip } = useRole();

  if (!open) return null;

  const submit = () => {
    const parsed = skipPracticeSchema.safeParse({ session, reason, notes });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your inputs");
      return;
    }
    addSkip({
      athlete: currentAthlete.name,
      session: parsed.data.session,
      reason: parsed.data.reason,
      notes: parsed.data.notes,
    });
    toast.success("Coach Mensah notified", {
      description: `Reason: ${REASONS.find((r) => r.id === reason)?.label} · marked excused`,
    });
    setNotes("");
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/50 flex items-end animate-fade-up" onClick={onClose}>
      <div
        className="w-full bg-card rounded-t-3xl p-5 max-h-[85%] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-border mb-3" />
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-destructive font-bold flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Can't make it
            </div>
            <h3 className="font-display text-2xl leading-none mt-1">Tell coach</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Heads up beats a no-show. Coach gets a push notification immediately.
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Which session?</label>
          <select
            value={session}
            onChange={(e) => setSession(e.target.value)}
            className="mt-1 w-full rounded-lg border bg-background p-2.5 text-sm"
          >
            <option>Today · 16:00 Tactical</option>
            <option>Tomorrow · 06:00 Lower body strength</option>
            <option>Tomorrow · 17:00 Recovery + mobility</option>
            <option>Wed · 06:30 Speed + plyo</option>
          </select>
        </div>

        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Reason</div>
          <div className="grid grid-cols-3 gap-1.5">
            {REASONS.map((r) => (
              <button
                key={r.id}
                onClick={() => setReason(r.id)}
                className={cn(
                  "rounded-xl border-2 py-2 text-center transition-all",
                  reason === r.id ? "border-gold bg-gold/10" : "border-border hover:border-navy/30",
                )}
              >
                <div className="text-lg leading-none">{r.emoji}</div>
                <div className="text-[10px] mt-0.5 font-bold">{r.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold flex items-center justify-between">
            <span>Notes (optional)</span>
            <span className="text-muted-foreground/70 normal-case tracking-normal">{notes.length}/{NOTE_MAX}</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, NOTE_MAX))}
            rows={3}
            maxLength={NOTE_MAX}
            placeholder="Anything coach should know…"
            className="mt-1 w-full rounded-lg border bg-background p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>

        <button
          onClick={submit}
          className="mt-5 w-full bg-destructive text-destructive-foreground font-bold uppercase tracking-wider rounded-full py-3 hover:opacity-90"
        >
          Send to coach
        </button>
        <button
          onClick={onClose}
          className="mt-2 w-full text-[11px] uppercase tracking-wider font-bold text-muted-foreground hover:text-foreground py-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
