import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { SectionHeader, StatCard, StatusPill, SportTag } from "@/components/primitives";
import { TourOverlay } from "@/components/TourOverlay";
import { injuries } from "@/data/mock";
import { Calendar, Plus } from "lucide-react";

export const Route = createFileRoute("/physio/")({
  head: () => ({
    meta: [
      { title: "Physio Cases — CUT Athletiq" },
      { name: "description", content: "Track injuries, rehab and return-to-play timelines." },
    ],
  }),
  component: PhysioHome,
});

function PhysioHome() {
  const active = injuries.length;
  const avgRTP = Math.round(injuries.reduce((s, i) => s + i.rtpDays, 0) / injuries.length);
  const high = injuries.filter((i) => i.pain >= 6).length;

  return (
    <MobileFrame title="Physio Naidoo">
      <div className="px-5">
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Active" value={active} accent="danger" hint="cases" />
          <StatCard label="Avg RTP" value={`${avgRTP}d`} accent="gold" hint="return to play" />
          <StatCard label="High pain" value={high} accent="navy" hint=">= 6/10" />
        </div>

        <SectionHeader
          title="Open cases"
          action={
            <Link to="/physio/log" className="text-[11px] font-bold text-navy uppercase tracking-wider flex items-center gap-1">
              <Plus className="h-3 w-3" /> New
            </Link>
          }
        />

        <div className="space-y-3">
          {injuries.map((inj) => (
            <div key={inj.id} className="bg-card rounded-2xl border shadow-sm overflow-hidden">
              <div className="p-3 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold">{inj.athlete}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <SportTag sport={inj.sport} />
                    <span className="text-[11px] text-muted-foreground">{inj.region}</span>
                  </div>
                </div>
                <StatusPill status={inj.status} />
              </div>

              <div className="px-3 pb-3 grid grid-cols-3 gap-2 text-center">
                <div className="bg-secondary/60 rounded-lg py-1.5">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Pain</div>
                  <div className="font-display text-lg leading-none">{inj.pain}/10</div>
                </div>
                <div className="bg-secondary/60 rounded-lg py-1.5">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Severity</div>
                  <div className="font-display text-lg leading-none">{inj.severity}</div>
                </div>
                <div className="bg-secondary/60 rounded-lg py-1.5">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">RTP</div>
                  <div className="font-display text-lg leading-none text-navy">{inj.rtpDays}d</div>
                </div>
              </div>

              {/* RTP bar */}
              <div className="px-3 pb-3">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Logged {inj.logged}
                  </span>
                  <span className="font-bold">{Math.round((1 - inj.rtpDays / 21) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-warn to-success"
                    style={{ width: `${Math.round((1 - inj.rtpDays / 21) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <TourOverlay
        tourKey="physio.home"
        steps={[
          { title: "Live injury cases", body: "Pain, severity and Return-to-Play % update as athletes log check-ins.", position: "center" },
        ]}
      />
    </MobileFrame>
  );
}
