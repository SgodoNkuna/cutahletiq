import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_HOME } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import logoUrl from "@/assets/cut-logo.png";
import { TestModeStamp } from "@/components/TestModeStamp";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome — CUT Athletiq" },
      { name: "description", content: "Finish setting up your CUT Athletiq profile." },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [sport, setSport] = React.useState("");
  const [position, setPosition] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (loading) return;
    if (!profile) {
      navigate({ to: "/login" });
      return;
    }
    if (profile.onboarding_complete) {
      navigate({ to: ROLE_HOME[profile.role] });
      return;
    }
    setSport(profile.sport ?? "");
    setPosition(profile.position ?? "");
  }, [profile, loading, navigate]);

  if (!profile) return null;

  const finish = async () => {
    setSubmitting(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        sport: sport.trim() || null,
        position: position.trim() || null,
        onboarding_complete: true,
      })
      .eq("id", profile.id);
    if (error) {
      toast.error("Could not save. Please try again.");
      setSubmitting(false);
      return;
    }
    await refreshProfile();
    toast.success("All set!");
    if (profile.role === "coach") navigate({ to: "/create-team" });
    else if (profile.role === "athlete") navigate({ to: "/join-team" });
    else navigate({ to: ROLE_HOME[profile.role] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/40 flex items-center justify-center py-4 px-2">
      <div className="relative w-full max-w-[430px] min-h-[calc(100vh-2rem)] sm:min-h-[860px] bg-background rounded-[2.25rem] sm:border-[10px] border-navy-deep shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-navy text-white px-6 pt-10 pb-10">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-1.5">
              <img src={logoUrl} alt="CUT" className="h-8 w-auto" />
            </div>
            <div>
              <div className="font-display text-2xl tracking-wide leading-none">
                WELCOME, {profile.first_name?.toUpperCase()}
              </div>
              <div className="text-[11px] text-white/60">
                A couple of quick details to get you set up
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 py-6 space-y-4 overflow-y-auto">
          <div className="bg-card rounded-2xl shadow-md p-5 border space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Sport
              </label>
              <Input
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                placeholder="e.g. Rugby"
              />
            </div>
            {profile.role === "athlete" && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Position (optional)
                </label>
                <Input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Flanker"
                />
              </div>
            )}

            <div className="rounded-lg bg-secondary/40 p-3 text-[11px] text-muted-foreground">
              {profile.role === "coach" &&
                "Next, you'll create a team and get a 6-character join code to share with your athletes."}
              {profile.role === "athlete" &&
                "Next, ask your coach for the team join code (like a Zoom code) to connect to your squad."}
              {profile.role === "physio" &&
                "You'll see athletes from teams you support. Coaches will share team codes with you."}
              {profile.role === "admin" &&
                "You can manage all users, teams and POPIA tools from the admin dashboard."}
            </div>

            <button
              onClick={finish}
              disabled={submitting}
              className="w-full bg-gold text-navy-deep font-bold uppercase tracking-wider rounded-full py-3 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Continue
            </button>
          </div>
        </div>

        <TestModeStamp />
      </div>
    </div>
  );
}
