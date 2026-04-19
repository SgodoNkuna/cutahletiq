import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { StatCard, SectionHeader, SportTag } from "@/components/primitives";
import { TourOverlay } from "@/components/TourOverlay";
import { DailyCheckIn } from "@/components/DailyCheckIn";
import { SkipPracticeSheet } from "@/components/SkipPracticeSheet";
import { currentAthlete, todaysWorkout, leaderboard, calendarEvents, EVENT_KIND_META, TODAY_ISO } from "@/data/mock";
import { Dumbbell, HeartPulse, Trophy, Flame, ChevronRight, Calendar, BellRing, XCircle, Moon } from "lucide-react";
import { useRole } from "@/lib/role-context";

export const Route = createFileRoute("/athlete/")({
  head: () => ({
    meta: [
      { title: "Athlete Home — CUT Athletiq" },
      { name: "description", content: "Your daily training, readiness and recovery snapshot." },
    ],
  }),
  component: AthleteHome,
});

function AthleteHome() {
  const myRank = leaderboard.find((l) => l.name === currentAthlete.name)?.rank ?? "—";
  const { dailyCheckIn, setDailyCheckIn } = useRole();
  const checkedIn = !!dailyCheckIn;
  const sleep = dailyCheckIn?.sleep ?? 7.4;
  const soreness = dailyCheckIn?.soreness ?? 2;
  const readiness = dailyCheckIn?.readiness ?? currentAthlete.readiness;
  const [showCheckIn, setShowCheckIn] = React.useState(false);
  const [showSkip, setShowSkip] = React.useState(false);
  const [justCheckedIn, setJustCheckedIn] = React.useState(false);

  // Soft auto-prompt for the daily check-in (only once per session, only if not yet done)
  const promptedRef = React.useRef(false);
  React.useEffect(() => {
    if (checkedIn || promptedRef.current) return;
    promptedRef.current = true;
    const t = setTimeout(() => setShowCheckIn(true), 1800);
    return () => clearTimeout(t);
  }, [checkedIn]);

  const upcoming = calendarEvents
    .filter((e) => e.date >= TODAY_ISO && (e.who.includes("Rugby") || e.who.includes("All")))
    .slice(0, 3);

  return (
    <MobileFrame>
      {/* Hero */}
      <div className="bg-gradient-to-br from-navy to-navy-deep text-white px-5 pt-5 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-3">
            <div className="text-[11px] uppercase tracking-wider text-white/60">Good morning</div>
            <div className="font-display text-3xl truncate">{currentAthlete.name.split(" ")[0]} 👋</div>
            <div className="flex items-center gap-2 mt-1">
              <SportTag sport={currentAthlete.sport} />
              <span className="text-[11px] text-white/70 truncate">{currentAthlete.position}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-display text-4xl text-gold leading-none">{readiness}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/60">Readiness</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-full px-3 py-2 text-xs">
          <Flame className="h-4 w-4 text-gold shrink-0" />
          <span className="font-bold">{currentAthlete.streak}-day streak</span>
          <span className="text-white/60 ml-auto truncate">Attendance {currentAthlete.attendance}%</span>
        </div>
      </div>

      <div className="px-5 pt-3 relative z-10">
        {/* Daily check-in nudge */}
        {!checkedIn && (
          <button
            onClick={() => setShowCheckIn(true)}
            className="w-full text-left bg-gold/15 border-2 border-dashed border-gold/60 rounded-2xl p-3 flex items-center gap-3 mb-3 hover:bg-gold/20 transition-colors"
          >
            <div className="bg-gold text-navy-deep rounded-full p-2 shrink-0">
              <BellRing className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-gold font-bold">Morning check-in</div>
              <div className="text-sm font-bold">Log sleep, soreness & readiness</div>
              <div className="text-[11px] text-muted-foreground">Takes 20 seconds · counts toward your readiness score</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        )}
        {checkedIn && (
          <div
            className={`bg-success/10 border border-success/40 rounded-2xl p-3 flex items-center gap-2 mb-3 text-xs ${justCheckedIn ? "animate-slide-down-soft" : ""}`}
          >
            <Moon className="h-3.5 w-3.5 text-success shrink-0" />
            <span className="truncate">
              <span className="font-bold">{sleep.toFixed(1)}h sleep</span>
              <span className="text-muted-foreground"> · soreness </span>
              <span className="font-bold">{soreness}/10</span>
            </span>
            <button
              onClick={() => setShowCheckIn(true)}
              className="ml-auto text-[10px] uppercase tracking-wider font-bold text-navy hover:text-gold shrink-0"
            >
              Update
            </button>
          </div>
        )}

        {/* Today's session */}
        <Link to="/athlete/workout" className="block bg-card rounded-2xl shadow-md border p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-gold font-bold">Today · 16:00</div>
              <div className="font-display text-xl mt-0.5">{todaysWorkout.title}</div>
              <div className="text-xs text-muted-foreground">{todaysWorkout.focus} · {todaysWorkout.exercises.length} lifts</div>
            </div>
            <div className="bg-gold text-navy-deep rounded-full p-3">
              <Dumbbell className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs font-bold text-navy">
              Start session <ChevronRight className="h-4 w-4" />
            </span>
            <button
              onClick={(e) => { e.preventDefault(); setShowSkip(true); }}
              className="text-[10px] uppercase tracking-wider font-bold text-destructive flex items-center gap-1 hover:underline"
            >
              <XCircle className="h-3 w-3" /> Can't make it
            </button>
          </div>
        </Link>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <StatCard label="My Rank" value={`#${myRank}`} accent="gold" hint="Squad" />
          <StatCard label="Sleep" value={`${sleep.toFixed(1)}h`} accent="success" hint="Last night" />
          <StatCard label="Soreness" value={`${soreness}/10`} accent="navy" hint="Self report" />
        </div>

        {/* Up next from calendar */}
        <SectionHeader
          title="Up next"
          action={<Link to="/calendar" className="text-[11px] font-bold text-navy uppercase tracking-wider">Calendar →</Link>}
        />
        <div className="bg-card rounded-xl border divide-y">
          {upcoming.map((e) => {
            const meta = EVENT_KIND_META[e.kind];
            return (
              <Link to="/calendar" key={e.id} className="flex items-center gap-3 p-2.5 hover:bg-secondary/40">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-base shrink-0 ${meta.color}`}>
                  {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{e.title}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(e.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · {e.time}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </div>

        <SectionHeader title="Quick actions" />
        <div className="grid grid-cols-2 gap-3">
          <Link to="/athlete/progress" className="bg-card rounded-xl border p-3 flex items-center gap-3 hover:border-gold transition-colors">
            <div className="bg-navy/10 text-navy rounded-lg p-2"><Trophy className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-bold">Progress</div>
              <div className="text-[11px] text-muted-foreground">PRs & charts</div>
            </div>
          </Link>
          <Link to="/athlete/injury" className="bg-card rounded-xl border p-3 flex items-center gap-3 hover:border-destructive transition-colors">
            <div className="bg-destructive/10 text-destructive rounded-lg p-2"><HeartPulse className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-bold">Body check</div>
              <div className="text-[11px] text-muted-foreground">Log pain / injury</div>
            </div>
          </Link>
        </div>

        <SectionHeader title="Coach's note" />
        <div className="bg-gold/10 border border-gold/30 rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-wider font-bold text-gold">Coach Mensah</div>
          <p className="text-sm mt-1">
            "Big lift today — focus on bar speed off the chest. Recovery non-negotiable tonight."
          </p>
        </div>
      </div>

      <DailyCheckIn
        open={showCheckIn}
        onClose={() => setShowCheckIn(false)}
        onSubmit={(d) => {
          setDailyCheckIn({ ...d, at: Date.now() });
          setJustCheckedIn(true);
          window.setTimeout(() => setJustCheckedIn(false), 600);
        }}
      />
      <SkipPracticeSheet open={showSkip} onClose={() => setShowSkip(false)} />

      <TourOverlay
        tourKey="athlete.home"
        steps={[
          { title: "Morning check-in first", body: "Log sleep, soreness and readiness — it powers your gold readiness score and tells your coach how to push you.", position: "top" },
          { title: "Tap the gold card", body: "Opens today's workout. Or hit 'Can't make it' to notify Coach instantly.", position: "center" },
          { title: "Calendar at a glance", body: "Up next shows your gym, games and physio appointments — full view in the Calendar tab.", position: "bottom" },
        ]}
      />
    </MobileFrame>
  );
}
