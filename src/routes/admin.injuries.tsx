import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Loader2, HeartPulse } from "lucide-react";

export const Route = createFileRoute("/admin/injuries")({
  head: () => ({
    meta: [
      { title: "Injury cases — Admin" },
      { name: "description", content: "All injury records." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminInjuries,
});

type Row = {
  id: string;
  body_region: string;
  injury_type: string;
  severity: number;
  rtp_status: "unavailable" | "modified" | "cleared";
  date_of_injury: string;
  expected_rtp_date: string | null;
  athlete: { first_name: string | null; last_name: string | null } | null;
};

const STATUS_STYLE: Record<string, string> = {
  unavailable: "bg-rose-100 text-rose-700",
  modified: "bg-amber-100 text-amber-700",
  cleared: "bg-emerald-100 text-emerald-700",
};

function AdminInjuries() {
  const { profile } = useAuth();
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"all" | "active">("active");

  React.useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("injury_records")
        .select(
          "id, body_region, injury_type, severity, rtp_status, date_of_injury, expected_rtp_date, athlete:profiles!injury_records_athlete_id_fkey(first_name, last_name)",
        )
        .order("date_of_injury", { ascending: false });
      if (cancelled) return;
      setRows((data ?? []) as unknown as Row[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.rtp_status !== "cleared");

  if (!profile) return null;

  return (
    <MobileFrame title="Injury cases">
      <div className="px-5 space-y-3">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-navy uppercase tracking-wider"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to dept
        </Link>

        <div className="flex gap-2">
          {(["active", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${
                filter === f
                  ? "bg-navy text-white"
                  : "bg-card border text-muted-foreground hover:border-gold"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-xl border p-6 text-center text-sm text-muted-foreground">
            No injury records found.
          </div>
        ) : (
          <div className="bg-card rounded-xl border divide-y">
            {filtered.map((r) => {
              const athlete =
                `${r.athlete?.first_name ?? ""} ${r.athlete?.last_name ?? ""}`.trim() || "Athlete";
              return (
                <div key={r.id} className="p-3 flex items-start gap-3">
                  <div className="bg-rose-100 text-rose-700 rounded-lg p-2">
                    <HeartPulse className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{athlete}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.injury_type} · {r.body_region} · sev {r.severity}/10
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Injured {new Date(r.date_of_injury).toLocaleDateString()}
                      {r.expected_rtp_date &&
                        ` · RTP ${new Date(r.expected_rtp_date).toLocaleDateString()}`}
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLE[r.rtp_status]}`}
                  >
                    {r.rtp_status}
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
