import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import logoUrl from "@/assets/cut-logo.png";
import { ROLES, type Role } from "@/data/mock";
import { useRole } from "@/lib/role-context";
import { DemoPanel } from "@/components/DemoPanel";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — CUT Athletiq" },
      { name: "description", content: "Sign in as an athlete, coach, physio or admin." },
    ],
  }),
  component: LoginPage,
});

const ROLE_DEST: Record<Role, string> = {
  athlete: "/athlete",
  coach: "/coach",
  physio: "/physio",
  admin: "/leaderboard",
};

function LoginPage() {
  const { role, setRole } = useRole();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("thabo.m@cut.ac.za");
  const [password, setPassword] = React.useState("••••••••");

  const handleLogin = (r: Role) => {
    setRole(r);
    toast.success(`Signed in as ${ROLES.find((x) => x.id === r)!.label}`);
    navigate({ to: ROLE_DEST[r] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/40 flex items-center justify-center py-4 px-2">
      <div className="relative w-full max-w-[430px] min-h-[calc(100vh-2rem)] sm:min-h-[860px] bg-background rounded-[2.25rem] sm:border-[10px] border-navy-deep shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-navy text-white px-6 pt-10 pb-12 relative">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-1.5">
              <img src={logoUrl} alt="CUT" className="h-8 w-auto" />
            </div>
            <div>
              <div className="font-display text-2xl tracking-wide leading-none">CUT ATHLETIQ</div>
              <div className="text-[11px] text-white/60">Sign in to your locker</div>
            </div>
          </div>
        </div>

        <div className="px-6 -mt-6 flex-1 overflow-y-auto pb-8">
          <div className="bg-card rounded-2xl shadow-lg p-5 border">
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Password</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div className="mt-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">I am a…</div>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id as Role)}
                    className={cn(
                      "rounded-xl border-2 px-3 py-3 text-left transition-all",
                      role === r.id
                        ? "border-gold bg-gold/10"
                        : "border-border hover:border-navy/40",
                    )}
                  >
                    <div className="text-2xl">{r.emoji}</div>
                    <div className="text-sm font-bold mt-0.5">{r.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleLogin(role)}
              className="mt-5 w-full bg-navy text-primary-foreground font-bold uppercase tracking-wider rounded-full py-3 hover:bg-navy-deep transition-colors"
            >
              Sign in as {ROLES.find((r) => r.id === role)!.label}
            </button>

            <div className="mt-3 text-center text-[11px] text-muted-foreground">
              Forgot password? · Sign in with CUT SSO
            </div>
          </div>

          <div className="mt-5 text-center text-[10px] text-muted-foreground">
            Demo tip — pick any role above; no real auth.
          </div>
        </div>

        <DemoPanel />
      </div>
    </div>
  );
}
