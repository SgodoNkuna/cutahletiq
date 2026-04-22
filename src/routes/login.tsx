import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import logoUrl from "@/assets/cut-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_HOME } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { TestModeStamp } from "@/components/TestModeStamp";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — CUT Athletiq" },
      { name: "description", content: "Sign in to your CUT Athletiq locker." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [showReset, setShowReset] = React.useState(false);

  React.useEffect(() => {
    if (authLoading || !profile) return;
    if (!profile.onboarding_complete) navigate({ to: "/onboarding" });
    else navigate({ to: ROLE_HOME[profile.role] });
  }, [profile, authLoading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Enter your email and password");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid")) toast.error("Wrong email or password.");
      else if (msg.includes("not confirmed")) toast.error("Please verify your email first.");
      else toast.error("Could not sign in. Please try again.");
      return;
    }
    toast.success("Signed in");
  };

  const sendReset = async () => {
    if (!resetEmail.trim()) {
      toast.error("Enter the email on your account");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error("Could not send reset email. Try again.");
      return;
    }
    toast.success("Check your inbox for a reset link.");
    setShowReset(false);
    setResetEmail("");
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
          <form onSubmit={submit} className="bg-card rounded-2xl shadow-lg p-5 border space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email</label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@cut.ac.za"
                className="mt-1"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Password</label>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-navy text-primary-foreground font-bold uppercase tracking-wider rounded-full py-3 hover:bg-navy-deep transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
            <div className="text-center text-[11px] text-muted-foreground">
              <button
                type="button"
                onClick={() => setShowReset((v) => !v)}
                className="hover:text-foreground underline"
              >
                Forgot password?
              </button>
              <span className="mx-2">·</span>
              <Link to="/signup" className="hover:text-foreground underline font-bold">
                Create account
              </Link>
            </div>
            {showReset && (
              <div className="rounded-lg border bg-secondary/40 p-3 mt-2 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Reset password
                </div>
                <Input
                  type="email"
                  placeholder="email on account"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                <button
                  type="button"
                  onClick={sendReset}
                  className="w-full bg-gold text-navy-deep font-bold uppercase tracking-wider rounded-full py-2 text-xs hover:scale-[1.01] transition-transform"
                >
                  Send reset link
                </button>
              </div>
            )}
          </form>

          <p className="mt-4 text-center text-[10px] text-muted-foreground">
            Phase 1 Test Build — Authorised Users Only ·{" "}
            <Link to="/privacy" className="underline hover:text-foreground">
              Privacy
            </Link>
          </p>
        </div>

        <TestModeStamp />
      </div>
    </div>
  );
}
