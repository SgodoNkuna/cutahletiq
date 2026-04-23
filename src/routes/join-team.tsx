import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_HOME } from "@/lib/auth-context";
import { MobileFrame } from "@/components/MobileFrame";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";

export const Route = createFileRoute("/join-team")({
  head: () => ({
    meta: [
      { title: "Join a team — CUT Athletiq" },
      { name: "description", content: "Enter your team's join code to connect." },
    ],
  }),
  component: JoinTeamPage,
});

function JoinTeamPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = React.useState("");
  const [team, setTeam] = React.useState<{ id: string; name: string; sport: string } | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [looking, setLooking] = React.useState(false);

  const lookup = async () => {
    const c = code.trim().toUpperCase();
    if (c.length !== 6) {
      toast.error("Codes are 6 characters, like BK7RX2");
      return;
    }
    setLooking(true);
    const { data, error } = await supabase.rpc("find_team_by_code", { _code: c });
    setLooking(false);
    const found = Array.isArray(data) ? data[0] : null;
    if (error || !found) {
      toast.error("No team matches that code.");
      return;
    }
    setTeam({ id: found.id, name: found.name, sport: found.sport });
  };

  const join = async () => {
    if (!profile || !team) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("profiles")
      .update({ team_id: team.id })
      .eq("id", profile.id);
    setSubmitting(false);
    if (error) {
      toast.error("Could not join. Try again.");
      return;
    }
    await refreshProfile();
    toast.success(`Joined ${team.name}`);
    navigate({ to: ROLE_HOME[profile.role] });
  };

  return (
    <MobileFrame title="Join a team" hideNav>
      <div className="px-5 space-y-4">
        <div className="bg-gradient-to-br from-navy to-navy-deep text-white rounded-2xl p-5">
          <Users className="h-6 w-6 text-gold" />
          <div className="font-display text-2xl mt-2 leading-tight">Enter team join code</div>
          <p className="text-[11px] text-white/70 mt-1">
            Like a Zoom meeting code — your coach will share a 6-character code (e.g. BK7RX2).
          </p>
        </div>

        <div className="bg-card rounded-2xl border p-5 space-y-3">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="BK7RX2"
            maxLength={6}
            className="text-center font-display text-2xl tracking-[0.5em] uppercase"
          />
          <button
            onClick={lookup}
            disabled={looking || code.length !== 6}
            className="w-full bg-navy text-primary-foreground font-bold uppercase tracking-wider rounded-full py-2.5 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {looking && <Loader2 className="h-4 w-4 animate-spin" />}
            Look up team
          </button>

          {team && (
            <div className="rounded-xl border bg-success/10 p-3">
              <div className="text-[11px] uppercase tracking-wider font-bold text-success">
                Team found
              </div>
              <div className="font-display text-xl mt-1">{team.name}</div>
              <div className="text-xs text-muted-foreground">{team.sport}</div>
              <button
                onClick={join}
                disabled={submitting}
                className="mt-3 w-full bg-gold text-navy-deep font-bold uppercase tracking-wider rounded-full py-2.5 text-sm flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Join {team.name}
              </button>
            </div>
          )}
        </div>

        <Link
          to={profile ? ROLE_HOME[profile.role] : "/"}
          className="block text-center text-[11px] underline text-muted-foreground"
        >
          Skip for now
        </Link>
      </div>
    </MobileFrame>
  );
}
