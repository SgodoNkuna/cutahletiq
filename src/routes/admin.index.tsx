import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { StatCard, SectionHeader, SportTag } from "@/components/primitives";
import { TourOverlay } from "@/components/TourOverlay";
import { roster, leaderboard, injuries, SPORTS } from "@/data/mock";
import { ShieldCheck, TrendingDown, TrendingUp, Trophy, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — CUT Athletiq" },
      { name: "description", content: "Department-wide KPIs across athletes, sessions and injuries." },
    ],
  }),
  component: AdminHome,
});

// Mock weekly trends
const weeklySessions = [142, 158, 167, 154, 171, 183, 189];
const injuryTrend = [11, 9, 10, 8, 7, 6, 5]; // injury rate %, declining

function Sparkline({ data, color = "var(--gold)" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts} />
      <polyline
        fill={color}
        opacity="0.15"
        points={`0,${h} ${pts} ${w},${h}`}
      />
    </svg>
  );
}

function AdminHome() {
  const totalAthletes = roster.length;
  const sessionsThisWeek = weeklySessions[weeklySessions.length - 1];
  const sessionsDelta = sessionsThisWeek - weeklySessions[weeklySessions.length - 2];
  const currentInjury = injuryTrend[injuryTrend.length - 1];
  const prevInjury = injuryTrend[injuryTrend.length - 2];
  const injuryDelta = currentInjury - prevInjury;

  // top sport by points
  const sportPoints = SPORTS.map((s) => ({
    sport: s,
    points: leaderboard.filter((l) => l.sport === s).reduce((a, b) => a + b.points, 0),
    athletes: roster.filter((r) => r.sport === s).length,
  })).sort((a, b) => b.points - a.points);
  const topSport = sportPoints[0];
  const maxSportPts = sportPoints[0]?.points || 1;

  return (
    <MobileFrame title="Department">
      <div className="px-5">
        <div className="bg-gradient-to-br from-navy to-navy-deep text-white rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gold/20 blur-2xl" />
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/70 relative">
            <ShieldCheck className="h-3.5 w-3.5 text-gold" /> CUT Sports Department
          </div>
          <div className="font-display text-3xl mt-1 relative">Q2 Snapshot</div>
          <div className="text-[11px] text-white/70 relative">Week 8 of 2025 season</div>
          <div className="mt-3 grid grid-cols-2 gap-2 relative">
            <div className="bg-white/10 rounded-xl p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-white/60">Athletes</div>
              <div className="font-display text-3xl text-gold leading-none mt-0.5">{totalAthletes}</div>
              <div className="text-[10px] text-white/60 mt-0.5">across {SPORTS.length} sports</div>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-white/60">Sessions / wk</div>
              <div className="font-display text-3xl text-gold leading-none mt-0.5">{sessionsThisWeek}</div>
              <div className="text-[10px] text-success mt-0.5 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> +{sessionsDelta} vs last wk
              </div>
            </div>
          </div>
        </div>

        <SectionHeader title="Weekly sessions logged" />
        <div className="bg-card rounded-xl border p-3">
          <div className="flex items-end justify-between mb-1">
            <div>
              <div className="font-display text-2xl">{sessionsThisWeek}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">this week</div>
            </div>
            <div className="text-[11px] text-success font-bold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +{Math.round((sessionsDelta / weeklySessions[weeklySessions.length - 2]) * 100)}%
            </div>
          </div>
          <Sparkline data={weeklySessions} color="oklch(0.79 0.16 78)" />
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
            {["W2", "W3", "W4", "W5", "W6", "W7", "W8"].map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
        </div>

        <SectionHeader title="Injury rate trend" />
        <div className="bg-card rounded-xl border p-3">
          <div className="flex items-end justify-between mb-1">
            <div>
              <div className="font-display text-2xl">{currentInjury}<span className="text-base text-muted-foreground">%</span></div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">of squad</div>
            </div>
            <div className={cn(
              "text-[11px] font-bold flex items-center gap-1",
              injuryDelta < 0 ? "text-success" : "text-destructive",
            )}>
              {injuryDelta < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {injuryDelta > 0 ? "+" : ""}{injuryDelta} pp
            </div>
          </div>
          <Sparkline data={injuryTrend} color="oklch(0.62 0.22 27)" />
          <div className="text-[10px] text-muted-foreground mt-1">
            {injuries.length} active cases · avg RTP {Math.round(injuries.reduce((s, i) => s + i.rtpDays, 0) / injuries.length)}d
          </div>
        </div>

        <SectionHeader title="Top sport by points" action={<Link to="/leaderboard" className="text-[11px] font-bold text-navy uppercase tracking-wider">All →</Link>} />
        <div className="bg-gold/10 border border-gold/40 rounded-xl p-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gold text-navy-deep flex items-center justify-center">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-display text-xl leading-none">{topSport.sport}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{topSport.athletes} athletes</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl text-navy tabular-nums">{topSport.points.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">points</div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border divide-y">
          {sportPoints.map((s) => (
            <div key={s.sport} className="p-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <SportTag sport={s.sport} />
                <span className="font-bold tabular-nums">{s.points.toLocaleString()} pts</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-navy to-gold"
                  style={{ width: `${(s.points / maxSportPts) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <SectionHeader title="Quick actions" />
        <div className="grid grid-cols-2 gap-2">
          <Link to="/coach" className="bg-card rounded-xl border p-3 flex items-center gap-2 hover:border-gold transition-colors">
            <div className="text-sm font-bold flex-1">Squads</div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link to="/physio" className="bg-card rounded-xl border p-3 flex items-center gap-2 hover:border-gold transition-colors">
            <div className="text-sm font-bold flex-1">Health</div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link to="/feed" className="bg-card rounded-xl border p-3 flex items-center gap-2 hover:border-gold transition-colors">
            <div className="text-sm font-bold flex-1">Team feed</div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link to="/present" className="bg-gold/15 border-gold/40 rounded-xl border p-3 flex items-center gap-2 hover:bg-gold/25 transition-colors">
            <div className="text-sm font-bold flex-1 text-navy-deep">▶ Present</div>
            <ChevronRight className="h-4 w-4 text-navy-deep" />
          </Link>
        </div>
      </div>

      <TourOverlay
        tourKey="admin.home"
        steps={[
          {
            title: "Department snapshot",
            body: "Track athletes, weekly sessions and injury rate trends across every CUT sport — all in one view.",
            position: "center",
          },
          {
            title: "Hit ▶ Present",
            body: "Tap Present in Quick actions to launch a hands-free demo that auto-cycles through hero screens.",
            position: "bottom",
          },
        ]}
      />
    </MobileFrame>
  );
}
