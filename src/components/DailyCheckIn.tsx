import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Moon, Activity, Zap, X } from "lucide-react";
import { checkInSchema, type CheckInData } from "@/lib/sanitize";
import { useRole } from "@/lib/role-context";
import { currentAthlete } from "@/data/mock";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CheckInData) => void;
};

const MOODS = [
  { id: "fired", label: "Fired up", emoji: "🔥" },
  { id: "good", label: "Good", emoji: "😊" },
  { id: "ok", label: "Okay", emoji: "😐" },
  { id: "tired", label: "Tired", emoji: "🥱" },
  { id: "off", label: "Off", emoji: "😣" },
const MOODS: { id: CheckInData["mood"]; label: string; emoji: string }[] = [
  { id: "fired", label: "Fired up", emoji: "🔥" },
  { id: "good", label: "Good", emoji: "😊" },
  { id: "ok", label: "Okay", emoji: "😐" },
  { id: "tired", label: "Tired", emoji: "🥱" },
  { id: "off", label: "Off", emoji: "😣" },
];

// (placeholder removed below)
const _UNUSED = null;

export function DailyCheckIn({ open, onClose, onSubmit }: Props) {
  const [sleep, setSleep] = React.useState(7.5);
  const [soreness, setSoreness] = React.useState(2);
  const [readiness, setReadiness] = React.useState(80);
  const [mood, setMood] = React.useState<CheckInData["mood"]>("good");
  const { addCheckIn } = useRole();

  if (!open) return null;

  const submit = () => {
    const parsed = checkInSchema.safeParse({ sleep, soreness, readiness, mood });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    addCheckIn({ athlete: currentAthlete.name, ...parsed.data });
    onSubmit(parsed.data);
    toast.success("Daily check-in saved · readiness updated");
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
            <div className="text-[11px] uppercase tracking-wider text-gold font-bold">Daily check-in</div>
            <h3 className="font-display text-2xl leading-none mt-1">How's the body today?</h3>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sleep */}
        <div className="mt-5 bg-secondary/40 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Moon className="h-4 w-4 text-navy" /> Sleep last night
            </div>
            <div className="font-display text-2xl text-navy leading-none">{sleep.toFixed(1)}<span className="text-xs text-muted-foreground ml-1">h</span></div>
          </div>
          <Slider className="mt-2" value={[sleep]} onValueChange={(v) => setSleep(v[0])} min={3} max={11} step={0.5} />
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
            <span>3h</span><span>7h</span><span>11h</span>
          </div>
        </div>

        {/* Soreness */}
        <div className="mt-3 bg-secondary/40 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Activity className="h-4 w-4 text-warn" /> Overall soreness
            </div>
            <div className="font-display text-2xl text-foreground leading-none">{soreness}<span className="text-xs text-muted-foreground ml-0.5">/10</span></div>
          </div>
          <Slider className="mt-2" value={[soreness]} onValueChange={(v) => setSoreness(v[0])} min={0} max={10} step={1} />
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
            <span>None</span><span>Worst</span>
          </div>
        </div>

        {/* Readiness */}
        <div className="mt-3 bg-secondary/40 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Zap className="h-4 w-4 text-gold" /> Ready for gym?
            </div>
            <div className="font-display text-2xl text-gold leading-none">{readiness}<span className="text-xs text-muted-foreground ml-0.5">%</span></div>
          </div>
          <Slider className="mt-2" value={[readiness]} onValueChange={(v) => setReadiness(v[0])} min={0} max={100} step={5} />
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
            <span>Cooked</span><span>Lethal</span>
          </div>
        </div>

        {/* Mood */}
        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Mood</div>
          <div className="flex gap-1.5">
            {MOODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMood(m.id)}
                className={cn(
                  "flex-1 rounded-xl border-2 py-2 text-center transition-all",
                  mood === m.id ? "border-gold bg-gold/10" : "border-border hover:border-navy/30",
                )}
              >
                <div className="text-xl leading-none">{m.emoji}</div>
                <div className="text-[9px] mt-0.5 font-bold">{m.label}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          className="mt-5 w-full bg-navy text-primary-foreground font-bold uppercase tracking-wider rounded-full py-3 hover:bg-navy-deep transition-colors"
        >
          Submit check-in
        </button>
      </div>
    </div>
  );
}
