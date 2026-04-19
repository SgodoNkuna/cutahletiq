import * as React from "react";
import type { Role } from "@/data/mock";

export type CheckIn = {
  athlete: string;
  sleep: number;
  soreness: number;
  readiness: number;
  mood: string;
  at: number;
};

export type RPELog = {
  athlete: string;
  rpe: number;
  session: string;
  at: number;
};

export type SkipNotice = {
  id: string;
  athlete: string;
  session: string;
  reason: string;
  notes?: string;
  at: number;
};

export type DailyCheckInState = {
  sleep: number;
  soreness: number;
  readiness: number;
  mood: string;
  at: number;
};

type RoleContextType = {
  role: Role;
  setRole: (role: Role) => void;
  presentMode: boolean;
  setPresentMode: (v: boolean) => void;
  isTourSeen: (key: string) => boolean;
  markTourSeen: (key: string) => void;
  resetTours: () => void;
  resetTour: (key: string) => void;
  tourNonce: number;

  // Demo "live feed" of athlete activity surfaced to coach
  checkIns: CheckIn[];
  addCheckIn: (c: Omit<CheckIn, "at">) => void;
  rpeLogs: RPELog[];
  addRPE: (r: Omit<RPELog, "at">) => void;
  skipNotices: SkipNotice[];
  addSkip: (s: Omit<SkipNotice, "id" | "at">) => void;

  // Calendar overrides for drag-to-reschedule
  eventOverrides: Record<string, { date: string; time: string }>;
  rescheduleEvent: (id: string, date: string, time: string) => void;

  // Persisted daily check-in for the current athlete (survives navigation)
  dailyCheckIn: DailyCheckInState | null;
  setDailyCheckIn: (s: DailyCheckInState | null) => void;
};

const RoleContext = React.createContext<RoleContextType | null>(null);

const STORAGE_KEY = "cut_athletiq_role";
const TOUR_KEY = "cut_athletiq_tours_seen";

// Seed coach feed with one entry so the demo never looks empty
const SEED_SKIPS: SkipNotice[] = [
  {
    id: "seed-skip-1",
    athlete: "Karabo Pieterse",
    session: "Tomorrow · 06:00 Lower body strength",
    reason: "academic",
    notes: "Maths test 08:00",
    at: Date.now() - 1000 * 60 * 35,
  },
];
const SEED_RPE: RPELog[] = [
  { athlete: "Lerato Dlamini", rpe: 8, session: "Speed + plyo", at: Date.now() - 1000 * 60 * 90 },
  { athlete: "Tumelo van Wyk", rpe: 6, session: "Upper push", at: Date.now() - 1000 * 60 * 120 },
  { athlete: "Zinhle Nkosi", rpe: 9, session: "Track intervals", at: Date.now() - 1000 * 60 * 150 },
];
const SEED_CHECKINS: CheckIn[] = [
  { athlete: "Lerato Dlamini", sleep: 8.0, soreness: 2, readiness: 88, mood: "fired", at: Date.now() - 1000 * 60 * 200 },
  { athlete: "Sipho Khumalo", sleep: 6.2, soreness: 6, readiness: 55, mood: "tired", at: Date.now() - 1000 * 60 * 180 },
  { athlete: "Tumelo van Wyk", sleep: 7.4, soreness: 3, readiness: 80, mood: "good", at: Date.now() - 1000 * 60 * 150 },
];

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<Role>("athlete");
  const [presentMode, setPresentModeState] = React.useState(false);
  const [seen, setSeen] = React.useState<Record<string, boolean>>({});
  const [tourNonce, setTourNonce] = React.useState(0);

  const [checkIns, setCheckIns] = React.useState<CheckIn[]>(SEED_CHECKINS);
  const [rpeLogs, setRpeLogs] = React.useState<RPELog[]>(SEED_RPE);
  const [skipNotices, setSkipNotices] = React.useState<SkipNotice[]>(SEED_SKIPS);
  const [eventOverrides, setEventOverrides] = React.useState<Record<string, { date: string; time: string }>>({});
  const [dailyCheckIn, setDailyCheckInState] = React.useState<DailyCheckInState | null>(null);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Role | null;
      if (saved) setRoleState(saved);
      const tours = localStorage.getItem(TOUR_KEY);
      if (tours) setSeen(JSON.parse(tours));
    } catch {
      /* noop */
    }
  }, []);

  const setRole = React.useCallback((r: Role) => {
    setRoleState(r);
    try {
      localStorage.setItem(STORAGE_KEY, r);
    } catch {
      /* noop */
    }
  }, []);

  const setPresentMode = React.useCallback((v: boolean) => setPresentModeState(v), []);

  const isTourSeen = React.useCallback((key: string) => !!seen[key], [seen]);
  const markTourSeen = React.useCallback((key: string) => {
    setSeen((prev) => {
      const next = { ...prev, [key]: true };
      try {
        localStorage.setItem(TOUR_KEY, JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);
  const resetTours = React.useCallback(() => {
    setSeen({});
    setTourNonce((n) => n + 1);
    try {
      localStorage.removeItem(TOUR_KEY);
    } catch {
      /* noop */
    }
  }, []);
  const resetTour = React.useCallback((key: string) => {
    setSeen((prev) => {
      const next = { ...prev };
      delete next[key];
      try {
        localStorage.setItem(TOUR_KEY, JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });
    setTourNonce((n) => n + 1);
  }, []);

  const addCheckIn = React.useCallback((c: Omit<CheckIn, "at">) => {
    setCheckIns((prev) => [{ ...c, at: Date.now() }, ...prev].slice(0, 30));
  }, []);
  const addRPE = React.useCallback((r: Omit<RPELog, "at">) => {
    setRpeLogs((prev) => [{ ...r, at: Date.now() }, ...prev].slice(0, 30));
  }, []);
  const addSkip = React.useCallback((s: Omit<SkipNotice, "id" | "at">) => {
    setSkipNotices((prev) =>
      [{ ...s, id: `skip-${Date.now()}`, at: Date.now() }, ...prev].slice(0, 20),
    );
  }, []);
  const rescheduleEvent = React.useCallback((id: string, date: string, time: string) => {
    setEventOverrides((prev) => ({ ...prev, [id]: { date, time } }));
  }, []);
  const setDailyCheckIn = React.useCallback((s: DailyCheckInState | null) => {
    setDailyCheckInState(s);
  }, []);

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        presentMode,
        setPresentMode,
        isTourSeen,
        markTourSeen,
        resetTours,
        resetTour,
        tourNonce,
        checkIns,
        addCheckIn,
        rpeLogs,
        addRPE,
        skipNotices,
        addSkip,
        eventOverrides,
        rescheduleEvent,
        dailyCheckIn,
        setDailyCheckIn,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = React.useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}
