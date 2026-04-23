import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_HOME } from "@/lib/auth-context";
import { MobileFrame } from "@/components/MobileFrame";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, Loader2, RefreshCw, Users } from "lucide-react";

export const Route = createFileRoute("/create-team")({
  head: () => ({
    meta: [
      { title: "Create your team — CUT Athletiq" },
      { name: "description", content: "Spin up a new team and share the join code with athletes." },
    ],
  }),
  component: CreateTeamPage,
});

function CreateTeamPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = React.useState("");
  const [sport, setSport] = React.useState("");
  const [team, setTeam] = React.useState<{
    id: string;
    name: string;
    sport: string;
    join_code: string;
  } | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!profile) return;
    setSport(profile.sport ?? "");
    // Did this coach already make a team?
    void supabase
      .from("teams")
      .select("id, name, sport, join_code")
      .eq("coach_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setTeam(data);
      });
  }, [profile]);

  const create = async () => {
    if (!profile) return;
    if (!name.trim() || !sport.trim()) {
      toast.error("Team name and sport are required.");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("teams")
      .insert({
        name: name.trim(),
        sport: sport.trim(),
        coach_id: profile.id,
        join_code: "", // trigger generates
      })
      .select("id, name, sport, join_code")
      .maybeSingle();
    if (error || !data) {
      toast.error("Could not create team. Try again.");
      setSubmitting(false);
      return;
    }
    // Attach the coach to their own team
    await supabase.from("profiles").update({ team_id: data.id }).eq("id", profile.id);
    await refreshProfile();
    setTeam(data);
    setSubmitting(false);
    toast.success("Team created!");
  };

  const regenerate = async () => {
    if (!team) return;
    const { data: rpc } = await supabase.rpc("generate_join_code");
    const newCode = (rpc as unknown as string) ?? "";
    if (!newCode) {
      toast.error("Could not generate a new code.");
      return;
    }
    const { data, error } = await supabase
      .from("teams")
      .update({ join_code: newCode })
      .eq("id", team.id)
      .select("id, name, sport, join_code")
      .maybeSingle();
    if (error || !data) {
      toast.error("Could not regenerate code.");
      return;
    }
    setTeam(data);
    toast.success("New code generated.");
  };

  const copy = async () => {
    if (!team) return;
    try {
      await navigator.clipboard.writeText(team.join_code);
      toast.success("Code copied");
    } catch {
      toast.error("Copy failed — write it down manually.");
    }
  };

  return (
    <MobileFrame title="Create a team" hideNav>
      <div className="px-5 space-y-4">
        <div className="bg-gradient-to-br from-navy to-navy-deep text-white rounded-2xl p-5">
          <Users className="h-6 w-6 text-gold" />
          <div className="font-display text-2xl mt-2 leading-tight">Spin up your squad</div>
          <p className="text-[11px] text-white/70 mt-1">
            You'll get a 6-character code (like a Zoom meeting code) — share it with your athletes
            so they can join.
          </p>
        </div>

        {!team ? (
          <div className="bg-card rounded-2xl border p-5 space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Team name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rugby 1st XV"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Sport
              </label>
              <Input value={sport} onChange={(e) => setSport(e.target.value)} placeholder="Rugby" />
            </div>
            <button
              onClick={create}
              disabled={submitting}
              className="w-full bg-gold text-navy-deep font-bold uppercase tracking-wider rounded-full py-3 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create team
            </button>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border p-5 space-y-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
              Your team
            </div>
            <div className="font-display text-2xl leading-tight">{team.name}</div>
            <div className="text-xs text-muted-foreground">{team.sport}</div>

            <div className="rounded-xl bg-gold/10 border border-gold/40 p-4 text-center">
              <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                Join code
              </div>
              <div className="font-display text-5xl tracking-[0.4em] text-navy-deep mt-2">
                {team.join_code}
              </div>
              <div className="mt-3 flex gap-2 justify-center">
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-1 rounded-full bg-navy text-primary-foreground px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
                <button
                  onClick={regenerate}
                  className="inline-flex items-center gap-1 rounded-full border-2 border-navy text-navy px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
                >
                  <RefreshCw className="h-3 w-3" /> New code
                </button>
              </div>
            </div>

            <Link
              to={ROLE_HOME[profile!.role]}
              className="block w-full text-center bg-navy text-primary-foreground font-bold uppercase tracking-wider rounded-full py-3"
            >
              Open dashboard
            </Link>
          </div>
        )}
      </div>
    </MobileFrame>
  );
}
