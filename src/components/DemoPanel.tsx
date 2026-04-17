import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { useRole } from "@/lib/role-context";
import { ROLES, type Role } from "@/data/mock";
import { cn } from "@/lib/utils";
import { ClipboardList } from "lucide-react";

const SCREENS: { to: string; label: string; group: string }[] = [
  { to: "/", label: "Splash", group: "Entry" },
  { to: "/login", label: "Login", group: "Entry" },
  { to: "/athlete", label: "Athlete · Dashboard", group: "Athlete" },
  { to: "/athlete/workout", label: "Athlete · Workout", group: "Athlete" },
  { to: "/athlete/progress", label: "Athlete · Progress", group: "Athlete" },
  { to: "/athlete/injury", label: "Athlete · Injury check-in", group: "Athlete" },
  { to: "/coach", label: "Coach · Dashboard", group: "Coach" },
  { to: "/coach/program", label: "Coach · Program builder", group: "Coach" },
  { to: "/physio", label: "Physio · Dashboard", group: "Physio" },
  { to: "/physio/log", label: "Physio · Injury log", group: "Physio" },
  { to: "/leaderboard", label: "Leaderboard", group: "Shared" },
  { to: "/feed", label: "Team Feed", group: "Shared" },
];

export function DemoPanel() {
  const { role, setRole, presentMode, resetTours } = useRole();
  const [open, setOpen] = React.useState(false);
  const groups = Array.from(new Set(SCREENS.map((s) => s.group)));

  if (presentMode) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open demo panel"
          className="absolute top-12 right-3 z-30 bg-gold text-navy-deep rounded-full px-3 py-1.5 text-xs font-bold shadow-lg flex items-center gap-1.5 hover:scale-105 transition-transform"
        >
          <ClipboardList className="h-3.5 w-3.5" /> Demo
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[340px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Demo controls</SheetTitle>
          <SheetDescription>Jump to any screen · Switch the active role</SheetDescription>
        </SheetHeader>

        <Link
          to="/present"
          onClick={() => setOpen(false)}
          className="mt-4 flex items-center justify-center gap-2 rounded-full bg-gold text-navy-deep font-bold uppercase tracking-wider py-2.5 text-xs hover:scale-[1.02] transition-transform"
        >
          <Play className="h-3.5 w-3.5" /> Launch Present mode
        </Link>

        <button
          onClick={() => { resetTours(); setOpen(false); }}
          className="mt-2 w-full flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-muted-foreground hover:text-foreground py-1.5"
        >
          <RotateCcw className="h-3 w-3" /> Reset guided tours
        </button>

        <div className="mt-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Role</div>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id as Role)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium text-left transition-colors",
                  role === r.id
                    ? "bg-navy text-primary-foreground border-navy"
                    : "hover:bg-secondary",
                )}
              >
                <span className="mr-1">{r.emoji}</span> {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {groups.map((g) => (
            <div key={g}>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                {g}
              </div>
              <ul className="space-y-1">
                {SCREENS.filter((s) => s.group === g).map((s) => (
                  <li key={s.to}>
                    <Link
                      to={s.to}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
