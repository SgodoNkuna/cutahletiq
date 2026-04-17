import * as React from "react";
import type { Role } from "@/data/mock";

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
};

const RoleContext = React.createContext<RoleContextType | null>(null);

const STORAGE_KEY = "cut_athletiq_role";
const TOUR_KEY = "cut_athletiq_tours_seen";

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<Role>("athlete");
  const [presentMode, setPresentModeState] = React.useState(false);
  const [seen, setSeen] = React.useState<Record<string, boolean>>({});
  const [tourNonce, setTourNonce] = React.useState(0);

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

  return (
    <RoleContext.Provider
      value={{ role, setRole, presentMode, setPresentMode, isTourSeen, markTourSeen, resetTours, resetTour, tourNonce }}
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
