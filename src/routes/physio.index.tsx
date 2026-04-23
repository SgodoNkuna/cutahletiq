import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { SectionHeader, SportTag, StatusPill } from "@/components/primitives";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Injury = Database["public"]["Tables"]["injury_records"]["Row"];

export const Route = createFileRoute("/physio/")({
  head: () => ({
    meta: [
      { title: "Physio Cases — CUT Athletiq" },
      { name: "description", content: "Track injuries, rehab and return-to-play timelines." },
    ],
  }),
  component: PhysioHome,
});

function statusFromRtp(s: Injury["rtp_status"]): string {
  if (s === "cleared") return "cleared-soon";
  if (s === "modified") return "monitor";
  return "rehab";
}

function PhysioHome() {
  const { profile } = useAuth();
  const [injuries, setInjuries] = React.useState<
    Array<Injury & { athlete_name: string; sport: string | null }>
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from("injury_records")
        .select("*, profiles!injury_records_athlete_id_fkey(first_name, last_name, sport)")
        .order("updated_at", { ascending: false });
      if (cancelled) return;
      const rows = (data ?? []).map((r) => {
        const p = r.profiles as {
          first_name?: string;
          last_name?: string;
          sport?: string | null;
        } | null;
        const name = `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() || "Athlete";
        return { ...r, athlete_name: name, sport: p?.sport ?? null } as Injury & {
          athlete_name: string;
          sport: string | null;
        };
      });
      setInjuries(rows);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  if (!profile) return null;

  const greetingName = profile.first_name?.trim() ? `Physio ${profile.first_name}` : "Physio";
  const active = injuries.filter((i) => i.actual_rtp_date == null).length;
  const high = injuries.filter((i) => (i.severity ?? 0) >= 6 && i.actual_rtp_date == null).length;

  return (
    <MobileFrame title={greetingName}>
      <div className="px-5">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Active" value={active} />
          <Stat label="High severity" value={high} />
          <Stat label="Total" value={injuries.length} />
        </div>

        <SectionHeader title="Open cases" />

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          </div>
        ) : injuries.length === 0 ? (
          <div className="bg-card rounded-xl border p-5 text-center text-sm text-muted-foreground">
            No injury records yet. Use <span className="font-bold">Log</span> in the navbar to open
            a new case.
          </div>
        ) : (
          <div className="space-y-3">
            {injuries.map((inj) => (
              <div key={inj.id} className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-3 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold">{inj.athlete_name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {inj.sport && <SportTag sport={inj.sport} />}
                      <span className="text-[11px] text-muted-foreground">{inj.body_region}</span>
                    </div>
                  </div>
                  <StatusPill status={statusFromRtp(inj.rtp_status)} />
                </div>
                <div className="px-3 pb-3 grid grid-cols-3 gap-2 text-center">
                  <Cell label="Severity" value={`${inj.severity}/10`} />
                  <Cell label="Type" value={inj.injury_type} />
                  <Cell
                    label="Logged"
                    value={new Date(inj.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })}
                  />
                </div>
                {inj.expected_rtp_date && (
                  <div className="px-3 pb-3 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Calendar className="h-3 w-3" /> Expected RTP:{" "}
                    {new Date(inj.expected_rtp_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
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
      <div className="font-display text-2xl mt-0.5">{value}</div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/60 rounded-lg py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-sm leading-none mt-0.5 truncate px-1">{value}</div>
    </div>
  );
}
