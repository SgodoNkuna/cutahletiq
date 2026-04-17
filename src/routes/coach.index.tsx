import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { SectionHeader, StatCard, StatusPill, SportTag } from "@/components/primitives";
import { TourOverlay } from "@/components/TourOverlay";
import { roster, leaderboard, SPORTS } from "@/data/mock";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/coach/")({
  head: () => ({
    meta: [
      { title: "Coach Dashboard — CUT Athletiq" },
      { name: "description", content: "Squad readiness, training load and injury status at a glance." },
    ],
  }),
  component: CoachHome,
});

function CoachHome() {
  const [filter, setFilter] = React.useState<string>("All");
  const filtered = filter === "All" ? roster : roster.filter((r) => r.sport === filter);
  const ready = roster.filter((r) => r.status === "ready").length;
  const fatigued = roster.filter((r) => r.status === "fatigued").length;
  const injured = roster.filter((r) => r.status === "injured").length;

  return (
    <MobileFrame title="Coach Mensah">
      <div className="px-5">
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Ready" value={ready} accent="success" />
          <StatCard label="Fatigued" value={fatigued} accent="gold" />
          <StatCard label="Injured" value={injured} accent="danger" />
        </div>

        <SectionHeader
          title="Squad"
          action={
            <Link to="/coach/program" className="text-[11px] font-bold text-navy uppercase tracking-wider">
              Program →
            </Link>
          }
        />

        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
          {["All", ...SPORTS].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider border transition-colors",
                filter === s ? "bg-navy text-primary-foreground border-navy" : "bg-card border-border text-muted-foreground hover:border-navy/40",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="bg-card rounded-xl border p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-navy to-navy-deep text-white font-bold flex items-center justify-center text-sm">
                {r.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{r.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <SportTag sport={r.sport} />
                  <span className="text-[10px] text-muted-foreground">Load {r.load}</span>
                </div>
              </div>
              <StatusPill status={r.status} />
            </div>
          ))}
        </div>

        <SectionHeader title="Top performers" action={<Link to="/leaderboard" className="text-[11px] font-bold text-navy uppercase tracking-wider">All →</Link>} />
        <div className="bg-card rounded-xl border divide-y">
          {leaderboard.slice(0, 3).map((l) => (
            <div key={l.rank} className="flex items-center gap-3 p-3">
              <div className={cn(
                "h-8 w-8 rounded-full font-display text-lg flex items-center justify-center",
                l.rank === 1 && "bg-gold text-navy-deep",
                l.rank === 2 && "bg-secondary text-navy",
                l.rank === 3 && "bg-navy/10 text-navy",
              )}>{l.rank}</div>
              <div className="flex-1">
                <div className="text-sm font-bold">{l.name}</div>
                <div className="text-[10px] text-muted-foreground">{l.sport} · {l.points} pts</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
      <TourOverlay
        tourKey="coach.home"
        steps={[
          { title: "Whole squad at a glance", body: "Green = ready, amber = fatigued, red = injured. Filter by sport with the pills.", position: "center" },
        ]}
      />
    </MobileFrame>
  );
}
