import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { leaderboard, SPORTS } from "@/data/mock";
import { cn } from "@/lib/utils";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — CUT Athletiq" },
      { name: "description", content: "Cross-sport performance ranking across CUT athletes." },
    ],
  }),
  component: LeaderboardPage,
});

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function LeaderboardPage() {
  const [filter, setFilter] = React.useState<string>("All");
  const filtered = filter === "All" ? leaderboard : leaderboard.filter((l) => l.sport === filter);
  const top = filtered[0];
  const topPts = useCountUp(top?.points ?? 0);

  return (
    <MobileFrame title="Leaderboard">
      <div className="px-5">
        <div className="bg-gradient-to-br from-navy to-navy-deep text-white rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gold/20 blur-2xl" />
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/70 relative">
            <Trophy className="h-3.5 w-3.5 text-gold" /> Top performer
          </div>
          {top && (
            <div className="relative mt-1">
              <div className="font-display text-3xl">{top.name}</div>
              <div className="text-[11px] text-white/70">{top.sport}</div>
              <div className="font-display text-5xl text-gold mt-2 leading-none tabular-nums">
                {topPts.toLocaleString()}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-white/60">Performance points</div>
            </div>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-2 mt-4 -mx-1 px-1">
          {["All", ...SPORTS].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider border transition-colors",
                filter === s ? "bg-gold text-navy-deep border-gold" : "bg-card border-border text-muted-foreground hover:border-gold/40",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Podium */}
        {filtered.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 items-end my-3">
            {[filtered[1], filtered[0], filtered[2]].map((p, i) => {
              const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
              const h = rank === 1 ? "h-20" : rank === 2 ? "h-14" : "h-10";
              return (
                <div key={p.name} className="flex flex-col items-center">
                  <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center text-white font-bold mb-1",
                    rank === 1 && "bg-gold text-navy-deep ring-4 ring-gold/30",
                    rank === 2 && "bg-secondary text-navy ring-2 ring-border",
                    rank === 3 && "bg-navy/20 text-navy ring-2 ring-border",
                  )}>
                    {p.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="text-[10px] font-bold text-center truncate w-full">{p.name.split(" ")[0]}</div>
                  <div className={cn(
                    "w-full rounded-t-md mt-1 flex items-start justify-center pt-1 font-display text-lg",
                    h,
                    rank === 1 && "bg-gold text-navy-deep",
                    rank === 2 && "bg-secondary text-navy",
                    rank === 3 && "bg-navy/15 text-navy",
                  )}>{rank}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* List */}
        <div className="bg-card rounded-xl border divide-y mt-2">
          {filtered.map((l) => {
            const change = l.change;
            const isUp = change.startsWith("+");
            const isDown = change.startsWith("-");
            return (
              <div key={l.name} className="flex items-center gap-3 p-3">
                <div className="font-display text-lg w-6 text-center text-navy">{l.rank}</div>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-navy to-navy-deep text-white text-xs font-bold flex items-center justify-center">
                  {l.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{l.name}</div>
                  <div className="text-[10px] text-muted-foreground">{l.sport}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm tabular-nums">{l.points}</div>
                  <div className={cn(
                    "text-[10px] flex items-center justify-end gap-0.5",
                    isUp && "text-success",
                    isDown && "text-destructive",
                    !isUp && !isDown && "text-muted-foreground",
                  )}>
                    {isUp && <TrendingUp className="h-3 w-3" />}
                    {isDown && <TrendingDown className="h-3 w-3" />}
                    {!isUp && !isDown && <Minus className="h-3 w-3" />}
                    {change}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MobileFrame>
  );
}
