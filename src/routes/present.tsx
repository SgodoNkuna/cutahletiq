import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRole } from "@/lib/role-context";
import { Pause, Play, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

import logoUrl from "@/assets/cut-logo.png";
import { StatCard, SectionHeader, SportTag, StatusPill, PRBadge } from "@/components/primitives";
import { BodyMap } from "@/components/BodyMap";
import { currentAthlete, todaysWorkout, leaderboard, roster, injuries } from "@/data/mock";
import { Trophy, Flame, Dumbbell, HeartPulse, ShieldCheck, TrendingUp, Check } from "lucide-react";

export const Route = createFileRoute("/present")({
  head: () => ({
    meta: [
      { title: "Present Mode — CUT Athletiq" },
      { name: "description", content: "Auto-cycling hero showcase for CUT Athletiq presentations." },
    ],
  }),
  component: PresentPage,
});

const SLIDE_MS = 6000;

type Slide = {
  title: string;
  caption: string;
  render: () => React.ReactNode;
};

const SLIDES: Slide[] = [
  {
    title: "One platform",
    caption: "Athletes, coaches and physios on one connected experience — built for CUT.",
    render: () => (
      <div className="h-full bg-gradient-to-b from-navy via-navy to-navy-deep flex flex-col items-center justify-center px-8 text-center">
        <div className="rounded-full bg-white p-6 mb-6 animate-pulse-gold">
          <img src={logoUrl} alt="CUT" className="h-20 w-auto" />
        </div>
        <h1 className="font-display text-6xl text-white tracking-wider leading-none">
          CUT <span className="text-gold">ATHLETIQ</span>
        </h1>
        <p className="mt-4 text-white/80 text-sm max-w-xs text-balance">
          Train smarter. Recover faster. Win more.
        </p>
      </div>
    ),
  },
  {
    title: "Athlete daily home",
    caption: "Readiness, today's session, streaks — every athlete's locker on one screen.",
    render: () => (
      <div className="h-full overflow-hidden">
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
          <div className="block bg-card rounded-2xl shadow-md border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gold font-bold">Today · 16:00</div>
                <div className="font-display text-xl mt-0.5">{todaysWorkout.title}</div>
                <div className="text-xs text-muted-foreground">{todaysWorkout.focus}</div>
              </div>
              <div className="bg-gold text-navy-deep rounded-full p-3">
                <Dumbbell className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <StatCard label="Rank" value="#2" accent="gold" />
            <StatCard label="Sleep" value="7.4h" accent="success" />
            <StatCard label="Sore" value="2/10" accent="navy" />
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Real-time PR moments",
    caption: "Beat your previous best mid-set and a 🔥 NEW PR badge auto-fires. Coaches see it live.",
    render: () => {
      const ex = todaysWorkout.exercises[0];
      const sets = [
        { reps: 5, weight: 100, done: true },
        { reps: 5, weight: 110, done: true },
        { reps: 3, weight: 120, done: true },
        { reps: 3, weight: 125, done: true }, // PR!
      ];
      return (
        <div className="h-full overflow-hidden px-5 pt-5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">In session · 16:24</div>
          <h2 className="font-display text-3xl">{todaysWorkout.title}</h2>
          <div className="bg-card rounded-xl border p-3 mt-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider">Session progress</span>
              <span className="text-muted-foreground">9/10 sets</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-gold to-success" style={{ width: "90%" }} />
            </div>
          </div>
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden mt-3">
            <div className="flex items-center justify-between p-3 border-b bg-secondary/40">
              <div>
                <div className="font-display text-lg leading-none">{ex.name}</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Old PR: <span className="font-bold line-through">{ex.pr} {ex.unit}</span> · New: <span className="font-bold text-gold">125 kg</span>
                </div>
              </div>
              <PRBadge />
            </div>
            <div className="p-3 space-y-1.5">
              {sets.map((s, si) => (
                <div key={si} className="flex items-center gap-2 rounded-lg border p-2 bg-success/10 border-success/40">
                  <div className="w-7 h-7 rounded-md bg-navy/10 text-navy text-xs font-bold flex items-center justify-center">
                    {si + 1}
                  </div>
                  <div className="text-xs font-bold tabular-nums">{s.reps} × {s.weight}kg</div>
                  {s.weight > (ex.pr ?? 0) && <span className="text-[9px] font-bold text-gold uppercase">PR</span>}
                  <div className="ml-auto h-7 w-7 rounded-full bg-success text-white flex items-center justify-center">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    title: "Tap-to-log injury map",
    caption: "Athletes flag pain on a body silhouette — physio sees it before the next session.",
    render: () => (
      <div className="h-full overflow-hidden px-5 pt-5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Body check-in</div>
        <h2 className="font-display text-3xl">Where does it hurt?</h2>
        <div className="bg-card rounded-2xl border p-3 mt-3">
          <BodyMap selected={{ "knee-r": 6, "ankle-l": 3 }} onToggle={() => {}} />
          <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-warn/15 text-warn border border-warn/40 px-2 py-0.5 text-[10px] font-bold">
              R Knee · 6/10
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-warn/15 text-warn border border-warn/40 px-2 py-0.5 text-[10px] font-bold">
              L Ankle · 3/10
            </span>
          </div>
        </div>
        <div className="mt-3 bg-success/10 border border-success/40 rounded-xl p-3 text-sm">
          ✅ Sent to Physio Naidoo · response &lt; 24h
        </div>
      </div>
    ),
  },
  {
    title: "Coach control room",
    caption: "Squad readiness at a glance — green, amber, red. Tap any athlete to drill in.",
    render: () => (
      <div className="h-full overflow-hidden px-5 pt-5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Coach Mensah</div>
        <h2 className="font-display text-3xl">Squad pulse</h2>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <StatCard label="Ready" value={roster.filter((r) => r.status === "ready").length} accent="success" />
          <StatCard label="Fatigued" value={roster.filter((r) => r.status === "fatigued").length} accent="gold" />
          <StatCard label="Injured" value={roster.filter((r) => r.status === "injured").length} accent="danger" />
        </div>
        <SectionHeader title="Active roster" />
        <div className="space-y-2">
          {roster.slice(0, 5).map((r) => (
            <div key={r.id} className="bg-card rounded-xl border p-2.5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-navy to-navy-deep text-white font-bold flex items-center justify-center text-xs">
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
      </div>
    ),
  },
  {
    title: "Physio with RTP",
    caption: "Live injury cases with pain, severity and Return-to-Play timelines.",
    render: () => (
      <div className="h-full overflow-hidden px-5 pt-5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Physio Naidoo</div>
        <h2 className="font-display text-3xl">Open cases</h2>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <StatCard label="Active" value={injuries.length} accent="danger" hint="cases" />
          <StatCard label="Avg RTP" value={`${Math.round(injuries.reduce((s, i) => s + i.rtpDays, 0) / injuries.length)}d`} accent="gold" />
          <StatCard label="High pain" value={injuries.filter((i) => i.pain >= 6).length} accent="navy" />
        </div>
        <div className="space-y-2 mt-3">
          {injuries.slice(0, 2).map((inj) => (
            <div key={inj.id} className="bg-card rounded-2xl border shadow-sm p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-bold">{inj.athlete}</div>
                  <div className="text-[11px] text-muted-foreground">{inj.region}</div>
                </div>
                <StatusPill status={inj.status} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] mb-1">
                <span className="text-muted-foreground">RTP {inj.rtpDays}d</span>
                <span className="font-bold">{Math.round((1 - inj.rtpDays / 21) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-warn to-success" style={{ width: `${Math.round((1 - inj.rtpDays / 21) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Cross-sport leaderboard",
    caption: "One performance index across rugby, athletics, netball and more — campus-wide pride.",
    render: () => {
      const top = leaderboard[0];
      return (
        <div className="h-full overflow-hidden px-5 pt-5">
          <div className="bg-gradient-to-br from-navy to-navy-deep text-white rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gold/20 blur-2xl" />
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/70 relative">
              <Trophy className="h-3.5 w-3.5 text-gold" /> Top performer
            </div>
            <div className="relative mt-1">
              <div className="font-display text-3xl">{top.name}</div>
              <div className="text-[11px] text-white/70">{top.sport}</div>
              <div className="font-display text-5xl text-gold mt-2 leading-none tabular-nums">
                {top.points.toLocaleString()}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-white/60">Performance points</div>
            </div>
          </div>
          <div className="bg-card rounded-xl border divide-y mt-3">
            {leaderboard.slice(0, 5).map((l) => (
              <div key={l.name} className="flex items-center gap-3 p-2.5">
                <div className="font-display text-lg w-6 text-center text-navy">{l.rank}</div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-navy to-navy-deep text-white text-xs font-bold flex items-center justify-center">
                  {l.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{l.name}</div>
                  <div className="text-[10px] text-muted-foreground">{l.sport}</div>
                </div>
                <div className="font-bold text-sm tabular-nums">{l.points}</div>
              </div>
            ))}
          </div>
        </div>
      );
    },
  },
  {
    title: "Department oversight",
    caption: "Admin sees the full picture — total athletes, sessions logged, injury trends and top sport.",
    render: () => (
      <div className="h-full overflow-hidden px-5 pt-5">
        <div className="bg-gradient-to-br from-navy to-navy-deep text-white rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gold/20 blur-2xl" />
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/70 relative">
            <ShieldCheck className="h-3.5 w-3.5 text-gold" /> CUT Sports Department
          </div>
          <div className="font-display text-3xl mt-1 relative">Q2 Snapshot</div>
          <div className="mt-3 grid grid-cols-2 gap-2 relative">
            <div className="bg-white/10 rounded-xl p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-white/60">Athletes</div>
              <div className="font-display text-3xl text-gold leading-none mt-0.5">{roster.length}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-white/60">Sessions / wk</div>
              <div className="font-display text-3xl text-gold leading-none mt-0.5">189</div>
              <div className="text-[10px] text-success mt-0.5 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> +6 vs last wk
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-card rounded-xl border p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Injury rate</div>
            <div className="font-display text-2xl">5%</div>
            <div className="text-[10px] text-success font-bold">↘ -1 pp</div>
          </div>
          <div className="bg-card rounded-xl border p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Top sport</div>
            <div className="font-display text-2xl">Rugby</div>
            <div className="text-[10px] text-muted-foreground">{leaderboard.filter(l => l.sport === "Rugby").reduce((a,b)=>a+b.points,0).toLocaleString()} pts</div>
          </div>
        </div>
        <div className="mt-3 bg-gold/10 border border-gold/40 rounded-xl p-3 flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-gold" />
          <div className="text-sm font-bold">One unified system. Zero clipboards.</div>
        </div>
      </div>
    ),
  },
];

function PresentPage() {
  const navigate = useNavigate();
  const { setPresentMode } = useRole();
  const [i, setI] = React.useState(0);
  const [playing, setPlaying] = React.useState(true);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    setPresentMode(true);
    return () => setPresentMode(false);
  }, [setPresentMode]);

  React.useEffect(() => {
    if (!playing) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / SLIDE_MS);
      setProgress(p);
      if (p >= 1) {
        setI((prev) => (prev + 1) % SLIDES.length);
        setProgress(0);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, i]);

  const slide = SLIDES[i];
  const next = () => { setI((i + 1) % SLIDES.length); setProgress(0); };
  const prev = () => { setI((i - 1 + SLIDES.length) % SLIDES.length); setProgress(0); };
  const exit = () => navigate({ to: "/" });

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/40 flex items-center justify-center py-4 px-2">
      <div className="relative w-full max-w-[430px] min-h-[calc(100vh-2rem)] sm:min-h-[860px] bg-background rounded-[2.25rem] sm:border-[10px] border-navy-deep shadow-2xl overflow-hidden flex flex-col">
        {/* Top bar with progress */}
        <div className="bg-navy text-primary-foreground">
          <div className="flex items-center justify-between px-4 py-2 text-[11px] font-medium tracking-wide">
            <span className="opacity-80 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              PRESENT MODE
            </span>
            <span className="opacity-80">{i + 1} / {SLIDES.length}</span>
          </div>
          <div className="flex gap-1 px-3 pb-2">
            {SLIDES.map((_, idx) => (
              <div key={idx} className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
                <div
                  className={cn(
                    "h-full bg-gold transition-all",
                    idx < i ? "w-full" : idx === i ? "" : "w-0",
                  )}
                  style={idx === i ? { width: `${progress * 100}%` } : undefined}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Slide stage */}
        <div className="flex-1 relative overflow-hidden">
          {SLIDES.map((s, idx) => (
            <div
              key={idx}
              className={cn(
                "absolute inset-0 transition-all duration-700",
                idx === i ? "opacity-100 translate-x-0" : idx < i ? "opacity-0 -translate-x-4" : "opacity-0 translate-x-4 pointer-events-none",
              )}
            >
              {s.render()}
            </div>
          ))}
        </div>

        {/* Caption */}
        <div className="px-4 pb-2 pt-2 bg-gradient-to-t from-navy-deep to-navy text-white">
          <div className="text-[10px] uppercase tracking-wider text-gold font-bold">{slide.title}</div>
          <p className="text-sm leading-snug mt-0.5 text-balance">{slide.caption}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-3 py-2 bg-navy-deep text-white">
          <button onClick={exit} className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" aria-label="Exit">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={prev} className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPlaying((p) => !p)}
              className="h-11 w-11 rounded-full bg-gold text-navy-deep hover:scale-105 transition-transform flex items-center justify-center"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>
            <button onClick={next} className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="text-[10px] uppercase tracking-wider opacity-70 w-9 text-right">{Math.ceil((1 - progress) * (SLIDE_MS / 1000))}s</div>
        </div>
      </div>
    </div>
  );
}
