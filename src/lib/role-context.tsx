import * as React from "react";
import type { Role } from "@/data/mock";

type RoleContextType = {
  role: Role;
  setRole: (role: Role) => void;
};

const RoleContext = React.createContext<RoleContextType | null>(null);

const STORAGE_KEY = "cut_athletiq_role";

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<Role>("athlete");

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Role | null;
      if (saved) setRoleState(saved);
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

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = React.useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}
