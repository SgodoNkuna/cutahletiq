import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useRole } from "@/lib/role-context";
import { ROLES, type Role } from "@/data/mock";
import { Home, Dumbbell, LineChart, HeartPulse, Users, Trophy, Newspaper, ClipboardList, ShieldCheck, Calendar, HelpCircle } from "lucide-react";
import { DemoPanel } from "./DemoPanel";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  athlete: [
    { to: "/athlete", label: "Home", icon: Home },
    { to: "/athlete/workout", label: "Workout", icon: Dumbbell },
    { to: "/calendar", label: "Calendar", icon: Calendar },
    { to: "/athlete/progress", label: "Stats", icon: LineChart },
    { to: "/athlete/injury", label: "Body", icon: HeartPulse },
  ],
  coach: [
    { to: "/coach", label: "Squad", icon: Users },
    { to: "/coach/program", label: "Program", icon: ClipboardList },
    { to: "/calendar", label: "Calendar", icon: Calendar },
    { to: "/leaderboard", label: "Ranks", icon: Trophy },
    { to: "/feed", label: "Feed", icon: Newspaper },
  ],
  physio: [
    { to: "/physio", label: "Cases", icon: HeartPulse },
    { to: "/physio/log", label: "Log", icon: ClipboardList },
    { to: "/calendar", label: "Calendar", icon: Calendar },
    { to: "/feed", label: "Feed", icon: Newspaper },
  ],
  admin: [
    { to: "/admin", label: "Dept", icon: ShieldCheck },
    { to: "/calendar", label: "Calendar", icon: Calendar },
    { to: "/leaderboard", label: "Ranks", icon: Trophy },
    { to: "/coach", label: "Squad", icon: Users },
    { to: "/feed", label: "Feed", icon: Newspaper },
  ],
};

// Map a route path to the tour key registered on that route
const TOUR_KEY_BY_PATH: Record<string, string> = {
  "/athlete": "athlete.home",
  "/athlete/workout": "athlete.workout",
  "/athlete/injury": "athlete.injury",
  "/coach": "coach.home",
  "/physio": "physio.home",
  "/admin": "admin.home",
  "/calendar": "calendar.home",
};

export function MobileFrame({
  children,
  hideNav = false,
  title,
}: {
  children: React.ReactNode;
  hideNav?: boolean;
  title?: string;
}) {
  const { role, resetTour } = useRole();
  const location = useLocation();
  const items = NAV_BY_ROLE[role];
  const roleMeta = ROLES.find((r) => r.id === role)!;
  const tourKey = TOUR_KEY_BY_PATH[location.pathname];

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/40 flex items-center justify-center py-4 px-2">
      <div className="relative w-full max-w-[430px] min-h-[calc(100vh-2rem)] sm:min-h-[860px] bg-background rounded-[2.25rem] sm:border-[10px] border-navy-deep shadow-2xl overflow-hidden flex flex-col">
        {/* Status bar / role tag */}
        <div className="flex items-center justify-between px-4 py-2 bg-navy text-primary-foreground text-[11px] font-medium tracking-wide">
          <span className="opacity-80">CUT ATHLETIQ</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            Viewing as: <span className="font-bold uppercase">{roleMeta.emoji} {roleMeta.label}</span>
          </span>
        </div>

        {title && (
          <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-2">
            <h1 className="text-2xl text-foreground">{title}</h1>
            {tourKey && (
              <button
                onClick={() => resetTour(tourKey)}
                className="shrink-0 inline-flex items-center gap-1 rounded-full border border-gold/50 bg-gold/10 text-navy-deep hover:bg-gold/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                aria-label="Replay tour"
                title="Replay quick tour"
              >
                <HelpCircle className="h-3 w-3" /> Tour
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="animate-fade-up">{children}</div>
          <div className="text-center text-[10px] text-muted-foreground py-3">
            Concept demo · Built for CUT Sports Dept.
          </div>
        </div>

        {!hideNav && (
          <nav className="border-t bg-card/95 backdrop-blur px-1 py-1.5 flex items-center justify-around">
            {items.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[52px]",
                    active ? "text-navy" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "text-gold")} />
                  <span className={cn("text-[10px] font-medium", active && "font-bold")}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        <DemoPanel />
      </div>
    </div>
  );
}
