import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onSubmit: (rpe: number) => void;
};

const SCALE: { v: number; label: string; cls: string }[] = [
  { v: 1, label: "Very easy", cls: "text-success" },
  { v: 3, label: "Easy", cls: "text-success" },
  { v: 5, label: "Moderate", cls: "text-gold" },
  { v: 7, label: "Hard", cls: "text-warn" },
  { v: 9, label: "Very hard", cls: "text-destructive" },
  { v: 10, label: "Maximal", cls: "text-destructive" },
];

export function RPEModal({ open, onSubmit }: Props) {
  const [rpe, setRpe] = React.useState(7);
  if (!open) return null;
  const desc = [...SCALE].reverse().find((s) => rpe >= s.v) ?? SCALE[0];

  return (
    <div className="absolute inset-0 z-50 bg-black/55 flex items-center justify-center px-5 animate-fade-up">
      <div className="w-full max-w-[340px] bg-card rounded-2xl shadow-2xl border-2 border-gold p-5">
        <div className="text-[11px] uppercase tracking-wider text-gold font-bold">Rate the session</div>
        <h3 className="font-display text-2xl leading-tight mt-1">How hard was it?</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Borg RPE 1–10 · helps coach manage your training load.
        </p>

        <div className="mt-5 text-center">
          <div className={cn("font-display text-7xl leading-none tabular-nums", desc.cls)}>{rpe}</div>
          <div className={cn("text-sm font-bold uppercase tracking-wider mt-1", desc.cls)}>{desc.label}</div>
        </div>

        <div className="mt-4">
          <Slider value={[rpe]} onValueChange={(v) => setRpe(v[0])} min={1} max={10} step={1} />
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
            <span>1 · rest</span>
            <span>5 · steady</span>
            <span>10 · max</span>
          </div>
        </div>

        <button
          onClick={() => onSubmit(rpe)}
          className="mt-5 w-full bg-navy text-primary-foreground font-bold uppercase tracking-wider rounded-full py-3 hover:bg-navy-deep"
        >
          Save & finish
        </button>
      </div>
    </div>
  );
}
