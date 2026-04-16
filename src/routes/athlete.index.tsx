import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { StatCard, SectionHeader, SportTag } from "@/components/primitives";
import { currentAthlete, todaysWorkout, leaderboard } from "@/data/mock";
import { Dumbbell, HeartPulse, Trophy, Flame, ChevronRight } from "lucide-react";

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

  return (
    <MobileFrame>
      {/* Hero */}
      <div className="bg-gradient-to-br from-navy to-navy-deep text-white px-5 pt-5 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/60">Good morning</div>
            <div className="font-display text-3xl">{currentAthlete.name.split(" ")[0]} 👋</div>
            <div className="flex items-center gap-2 mt-1">
              <SportTag sport={currentAthlete.sport} />
              <span className="text-[11px] text-white/70">{currentAthlete.position}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-4xl text-gold leading-none">{currentAthlete.readiness}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/60">Readiness</div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 bg-white/10 rounded-full px-3 py-2 text-xs">
          <Flame className="h-4 w-4 text-gold" />
          <span className="font-bold">{currentAthlete.streak}-day streak</span>
          <span className="text-white/60 ml-auto">Attendance {currentAthlete.attendance}%</span>
        </div>
      </div>

      <div className="px-5 -mt-4 relative z-10">
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
          <div className="mt-3 flex items-center gap-1 text-xs font-bold text-navy">
            Start session <ChevronRight className="h-4 w-4" />
          </div>
        </Link>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <StatCard label="My Rank" value={`#${myRank}`} accent="gold" hint="Squad" />
          <StatCard label="Sleep" value="7.4h" accent="success" hint="Last night" />
          <StatCard label="Soreness" value="2/10" accent="navy" hint="Self report" />
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
    </MobileFrame>
  );
}
