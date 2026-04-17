import * as React from "react";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";
import { Sparkles, X } from "lucide-react";

export type TourStep = {
  title: string;
  body: string;
  /** vertical anchor inside the mobile frame (top|center|bottom) */
  position?: "top" | "center" | "bottom";
};

export function TourOverlay({
  tourKey,
  steps,
}: {
  tourKey: string;
  steps: TourStep[];
}) {
  const { isTourSeen, markTourSeen, presentMode } = useRole();
  const [open, setOpen] = React.useState(false);
  const [i, setI] = React.useState(0);

  React.useEffect(() => {
    if (presentMode) return;
    if (!isTourSeen(tourKey)) {
      const t = setTimeout(() => setOpen(true), 350);
      return () => clearTimeout(t);
    }
  }, [tourKey, isTourSeen, presentMode]);

  if (!open || presentMode) return null;
  const step = steps[i];
  const last = i === steps.length - 1;

  const finish = () => {
    markTourSeen(tourKey);
    setOpen(false);
  };

  const positionClass =
    step.position === "top" ? "items-start pt-20"
    : step.position === "bottom" ? "items-end pb-24"
    : "items-center";

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 bg-navy-deep/60 backdrop-blur-[2px] flex justify-center px-5 animate-fade-up",
        positionClass,
      )}
      onClick={finish}
    >
      <div
        className="relative w-full max-w-[330px] bg-card rounded-2xl shadow-2xl border-2 border-gold p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={finish}
          aria-label="Skip tour"
          className="absolute top-2 right-2 h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-gold">
          <Sparkles className="h-3 w-3" /> Quick tour · {i + 1}/{steps.length}
        </div>
        <div className="font-display text-xl mt-1 leading-tight">{step.title}</div>
        <p className="text-sm text-muted-foreground mt-1">{step.body}</p>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={finish}
            className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground hover:text-foreground"
          >
            Skip
          </button>
          <div className="flex items-center gap-1">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  idx === i ? "w-5 bg-gold" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>
          <button
            onClick={() => (last ? finish() : setI(i + 1))}
            className="bg-navy text-primary-foreground rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-navy-deep"
          >
            {last ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
