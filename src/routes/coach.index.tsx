import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { SectionHeader, StatCard, StatusPill, SportTag } from "@/components/primitives";
import { Sparkline, type SparkPoint } from "@/components/Sparkline";
import { TourOverlay } from "@/components/TourOverlay";
import { roster, leaderboard, SPORTS } from "@/data/mock";
import { cn } from "@/lib/utils";
import { ChevronRight, BellRing, Activity, Moon, AlertCircle, Bell, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/lib/role-context";

export const Route = createFileRoute("/coach/")({
  head: () => ({
    meta: [
      { title: "Coach Dashboard — CUT Athletiq" },
      { name: "description", content: "Squad readiness, training load and injury status at a glance." },
    ],
  }),
  component: CoachHome,
});

const REASON_LABEL: Record<string, string> = {
  injury: "Injury / pain",
  sick: "Sick",
  academic: "Academic",
  personal: "Personal",
  transport: "Transport",
  other: "Other",
};

function timeAgo(at: number) {
  const mins = Math.max(1, Math.round((Date.now() - at) / 60000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}

function CoachHome() {
  const [filter, setFilter] = React.useState<string>("All");
  const filtered = filter === "All" ? roster : roster.filter((r) => r.sport === filter);
  const ready = roster.filter((r) => r.status === "ready").length;
  const fatigued = roster.filter((r) => r.status === "fatigued").length;
  const injured = roster.filter((r) => r.status === "injured").length;

  const { checkIns, rpeLogs, skipNotices } = useRole();
  const checkInsToday = checkIns.length;
  const avgRPE =
    rpeLogs.length === 0
      ? 0
      : Math.round((rpeLogs.reduce((a, r) => a + r.rpe, 0) / rpeLogs.length) * 10) / 10;
  const avgSleep =
    checkIns.length === 0
      ? 0
      : Math.round((checkIns.reduce((a, c) => a + c.sleep, 0) / checkIns.length) * 10) / 10;
  const flagged = checkIns.filter((c) => c.soreness >= 5 || c.readiness < 60);

  // 7-day rolling average squad RPE — last 6 days are demo baseline,
  // today's value reflects whatever the live rpeLogs say.
  const sparkData = React.useMemo<SparkPoint[]>(() => {
    const baseline = [6.4, 7.1, 6.8, 7.5, 8.0, 7.3];
    const today = avgRPE > 0 ? avgRPE : 7.4;
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];
    return [...baseline, today].map((value, i) => ({ label: labels[i], value }));
  }, [avgRPE]);
  const trendDelta = +(sparkData[6].value - sparkData[5].value).toFixed(1);

  // Athletes who haven't checked in yet — show Nudge button (demo: anyone after 09:00)
  const checkedInNames = React.useMemo(() => new Set(checkIns.map((c) => c.athlete)), [checkIns]);
  const [nudged, setNudged] = React.useState<Set<string>>(new Set());
  const handleNudge = (name: string) => {
    setNudged((prev) => new Set(prev).add(name));
    toast.success(`Nudge sent to ${name.split(" ")[0]}`, {
      description: "Push reminder: complete your morning check-in",
    });
  };

  return (
    <MobileFrame title="Coach Mensah">
      <div className="px-5">
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Ready" value={ready} accent="success" />
          <StatCard label="Fatigued" value={fatigued} accent="gold" />
          <StatCard label="Injured" value={injured} accent="danger" />
        </div>

        {/* Live athlete feed */}
        <SectionHeader title="Today · live" />
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Check-ins" value={checkInsToday} hint={`Avg sleep ${avgSleep || "—"}h`} accent="navy" />
          <StatCard label="Avg RPE" value={avgRPE || "—"} hint={`${rpeLogs.length} sessions`} accent="gold" />
          <StatCard label="Absences" value={skipNotices.length} hint="Notified" accent="danger" />
        </div>

        {/* 7-day squad RPE trend */}
        <div className="mt-3 bg-card rounded-2xl border p-3.5">
          <div className="flex items-end justify-between mb-1">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Squad RPE · 7-day</div>
              <div className="font-display text-2xl leading-none mt-0.5 flex items-baseline gap-1.5">
                {sparkData[6].value.toFixed(1)}
                <span className={cn(
                  "text-[11px] flex items-center gap-0.5 font-bold",
                  trendDelta > 0 ? "text-destructive" : trendDelta < 0 ? "text-success" : "text-muted-foreground",
                )}>
                  <TrendingUp className={cn("h-3 w-3", trendDelta < 0 && "rotate-180")} />
                  {trendDelta > 0 ? "+" : ""}{trendDelta}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground text-right">
              vs yesterday<br />
              <span className="font-bold text-foreground">{trendDelta > 0 ? "Higher load" : trendDelta < 0 ? "Lighter day" : "Steady"}</span>
            </div>
          </div>
          <Sparkline data={sparkData} height={64} yMin={5} yMax={10} />
          <div className="flex justify-between mt-1 text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
            {sparkData.map((p) => <span key={p.label}>{p.label}</span>)}
          </div>
        </div>

        {skipNotices.length > 0 && (
          <>
            <SectionHeader title="Can't make it" />
            <div className="space-y-2">
              {skipNotices.slice(0, 3).map((s) => (
                <div key={s.id} className="bg-destructive/5 border border-destructive/30 rounded-xl p-3 flex items-start gap-3">
                  <div className="bg-destructive text-destructive-foreground rounded-full p-1.5 shrink-0">
                    <AlertCircle className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{s.athlete}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {s.session} · <span className="font-bold text-destructive">{REASON_LABEL[s.reason] ?? s.reason}</span>
                    </div>
                    {s.notes && <div className="text-[11px] mt-0.5 italic truncate">"{s.notes}"</div>}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(s.at)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Flagged check-ins */}
        {flagged.length > 0 && (
          <>
            <SectionHeader title="Watch list" action={<span className="text-[10px] text-muted-foreground">High soreness or low readiness</span>} />
            <div className="space-y-2">
              {flagged.slice(0, 3).map((c, i) => (
                <div key={i} className="bg-card border rounded-xl p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-warn/15 text-warn flex items-center justify-center">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{c.athlete}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <span className="flex items-center gap-0.5"><Moon className="h-3 w-3" />{c.sleep.toFixed(1)}h</span>
                      <span>· soreness <span className="font-bold text-warn">{c.soreness}/10</span></span>
                      <span>· ready <span className={cn("font-bold", c.readiness < 60 ? "text-destructive" : "text-success")}>{c.readiness}%</span></span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(c.at)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Recent RPEs */}
        {rpeLogs.length > 0 && (
          <>
            <SectionHeader title="Recent RPE submissions" />
            <div className="bg-card rounded-xl border divide-y">
              {rpeLogs.slice(0, 4).map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5">
                  <div className={cn(
                    "h-8 w-8 rounded-full font-display text-base flex items-center justify-center",
                    r.rpe >= 8 ? "bg-destructive/15 text-destructive" : r.rpe >= 6 ? "bg-gold/20 text-gold" : "bg-success/15 text-success",
                  )}>
                    {r.rpe}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{r.athlete}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{r.session}</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(r.at)}</span>
                </div>
              ))}
            </div>
          </>
        )}

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
          {filtered.map((r) => {
            const ci = checkIns.find((c) => c.athlete === r.name);
            const lastRpe = rpeLogs.find((x) => x.athlete === r.name);
            const missing = !checkedInNames.has(r.name) && r.status !== "injured";
            const wasNudged = nudged.has(r.name);
            return (
              <div key={r.id} className="bg-card rounded-2xl border p-3 flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-navy to-navy-deep text-white font-bold flex items-center justify-center text-sm">
                    {r.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  {ci && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card" aria-label="Checked in" />
                  )}
                  {missing && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-warn border-2 border-card" aria-label="No check-in" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{r.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <SportTag sport={r.sport} />
                    <span className="text-[10px] text-muted-foreground">Load {r.load}</span>
                    {ci && (
                      <span className="text-[10px] text-success font-bold flex items-center gap-0.5">
                        <BellRing className="h-2.5 w-2.5" /> checked in
                      </span>
                    )}
                    {lastRpe && (
                      <span className="text-[10px] text-gold font-bold">RPE {lastRpe.rpe}</span>
                    )}
                    {missing && !wasNudged && (
                      <span className="text-[10px] text-warn font-bold">No check-in</span>
                    )}
                  </div>
                </div>
                {missing ? (
                  <button
                    onClick={() => handleNudge(r.name)}
                    disabled={wasNudged}
                    className={cn(
                      "shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border transition-all",
                      wasNudged
                        ? "bg-success/10 text-success border-success/30"
                        : "bg-gold text-navy-deep border-gold hover:scale-105 active:scale-95",
                    )}
                  >
                    <Bell className="h-3 w-3" />
                    {wasNudged ? "Sent" : "Nudge"}
                  </button>
                ) : (
                  <StatusPill status={r.status} />
                )}
              </div>
            );
          })}
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
          { title: "Live squad pulse", body: "Today's check-ins, average RPE and absence notifications update in real time as athletes submit them.", position: "top" },
          { title: "7-day load trend", body: "Sparkline shows the squad's average RPE over the last week — spot overload before it becomes injury.", position: "center" },
          { title: "Nudge stragglers", body: "Anyone without a check-in by 09:00 gets a gold Nudge button — one tap sends a reminder push.", position: "center" },
        ]}
      />
    </MobileFrame>
  );
}
