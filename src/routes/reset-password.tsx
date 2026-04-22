import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import logoUrl from "@/assets/cut-logo.png";
import { TestModeStamp } from "@/components/TestModeStamp";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set new password — CUT Athletiq" },
      { name: "description", content: "Set a new password for your account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    // Supabase parses the recovery hash automatically and emits a PASSWORD_RECOVERY event.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast.error("Could not update password. Try requesting a new link.");
      return;
    }
    toast.success("Password updated. You're signed in.");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/40 flex items-center justify-center py-4 px-2">
      <div className="relative w-full max-w-[430px] min-h-[calc(100vh-2rem)] sm:min-h-[860px] bg-background rounded-[2.25rem] sm:border-[10px] border-navy-deep shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-navy text-white px-6 pt-10 pb-12">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-1.5">
              <img src={logoUrl} alt="CUT" className="h-8 w-auto" />
            </div>
            <div>
              <div className="font-display text-2xl tracking-wide leading-none">RESET PASSWORD</div>
              <div className="text-[11px] text-white/60">Choose a new password</div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 -mt-6 pb-8">
          <form onSubmit={submit} className="bg-card rounded-2xl shadow-lg p-5 border space-y-3">
            {!ready && (
              <p className="text-xs text-muted-foreground">
                Open this page from the link in your reset email.
              </p>
            )}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                New password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                disabled={!ready}
                autoComplete="new-password"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Confirm password
              </label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
                disabled={!ready}
                autoComplete="new-password"
                className="mt-1"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !ready}
              className="w-full bg-gold text-navy-deep font-bold uppercase tracking-wider rounded-full py-3 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </button>
          </form>
        </div>
        <TestModeStamp />
      </div>
    </div>
  );
}
