import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { SectionHeader } from "@/components/primitives";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Loader2, Users, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — CUT Athletiq" },
      { name: "description", content: "Department-wide overview." },
    ],
  }),
  component: AdminHome,
});

type Counts = { profiles: number; teams: number; sessions: number; injuries: number };
type TeamRow = { id: string; name: string; sport: string; join_code: string; coach?: { first_name: string | null; last_name: string | null } | null };

function AdminHome() {
  const { profile } = useAuth();
  const [counts, setCounts] = React.useState<Counts | null>(null);
  const [teams, setTeams] = React.useState<TeamRow[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    if (!profile) return;
    (async () => {
      const [p, t, s, i, teamRows] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("teams").select("id", { count: "exact", head: true }),
        supabase.from("sessions").select("id", { count: "exact", head: true }),
        supabase.from("injury_records").select("id", { count: "exact", head: true }),
        supabase
          .from("teams")
          .select("id, name, sport, join_code, coach:profiles!teams_coach_id_fkey(first_name, last_name)")
          .order("created_at", { ascending: false })
          .limit(12),
      ]);
      if (cancelled) return;
      setCounts({
        profiles: p.count ?? 0,
        teams: t.count ?? 0,
        sessions: s.count ?? 0,
        injuries: i.count ?? 0,
      });
      setTeams((teamRows.data ?? []) as unknown as TeamRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  if (!profile) return null;

  const greetingName = profile.first_name?.trim() ? `Admin ${profile.first_name}` : "Admin";

  return (
    <MobileFrame title={greetingName}>
      <div className="px-5">
        <div className="bg-gradient-to-br from-navy to-navy-deep text-white rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gold/20 blur-2xl" />
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/70 relative">
            <ShieldCheck className="h-3.5 w-3.5 text-gold" /> CUT Sports Department
          </div>
          <div className="font-display text-3xl mt-1 relative">Live snapshot</div>
          <div className="text-[11px] text-white/70 relative">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>

        <SectionHeader title="System totals" />
        {!counts ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Users" value={counts.profiles} />
            <Stat label="Teams" value={counts.teams} />
            <Stat label="Sessions" value={counts.sessions} />
            <Stat label="Injury cases" value={counts.injuries} />
          </div>
        )}

        <SectionHeader title="Quick links" />
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/coach"
            className="bg-card rounded-xl border p-3 flex items-center gap-2 hover:border-gold transition-colors"
          >
            <Users className="h-4 w-4" />
            <div className="text-sm font-bold flex-1">Squads</div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            to="/physio"
            className="bg-card rounded-xl border p-3 flex items-center gap-2 hover:border-gold transition-colors"
          >
            <div className="text-sm font-bold flex-1">Health</div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            to="/feed"
            className="bg-card rounded-xl border p-3 flex items-center gap-2 hover:border-gold transition-colors"
          >
            <div className="text-sm font-bold flex-1">Notifications</div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            to="/leaderboard"
            className="bg-card rounded-xl border p-3 flex items-center gap-2 hover:border-gold transition-colors"
          >
            <div className="text-sm font-bold flex-1">Leaderboard</div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>

        <SectionHeader title="Coach teams" />
        {teams.length === 0 ? (
          <div className="bg-card rounded-xl border p-5 text-center text-sm text-muted-foreground">
            No teams are visible yet.
          </div>
        ) : (
          <div className="bg-card rounded-xl border divide-y">
            {teams.map((team) => {
              const coach = `${team.coach?.first_name ?? ""} ${team.coach?.last_name ?? ""}`.trim() || "Coach";
              return (
                <div key={team.id} className="p-3 flex items-center gap-3">
                  <Users className="h-4 w-4 text-gold" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{team.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {coach} · {team.sport}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-navy uppercase tracking-wider">
                    {team.join_code}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MobileFrame>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card rounded-2xl border p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
        {label}
      </div>
      <div className="font-display text-3xl mt-0.5">{value}</div>
    </div>
  );
}
