import { createFileRoute } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { SectionHeader } from "@/components/primitives";
import { squatProgression, personalRecords, trainingHeatmap } from "@/data/mock";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/athlete/progress")({
  head: () => ({
    meta: [
      { title: "Progress — CUT Athletiq" },
      { name: "description", content: "8-week progression, personal records and training calendar." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <MobileFrame title="My Progress">
      <div className="px-5">
        <SectionHeader title="Back Squat · 8 weeks" />
        <div className="bg-card rounded-2xl border p-3">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={squatProgression} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 250)" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="oklch(0.5 0.02 260)" />
                <YAxis tick={{ fontSize: 10 }} stroke="oklch(0.5 0.02 260)" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid oklch(0.9 0.01 250)" }}
                  formatter={(v) => [`${v} kg`, "Top set"]}
                />
                <Line
                  type="monotone"
                  dataKey="kg"
                  stroke="oklch(0.32 0.13 258)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "oklch(0.79 0.16 78)", stroke: "oklch(0.32 0.13 258)", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-muted-foreground text-center mt-1">
            +25 kg in 8 weeks · <span className="text-success font-bold">+26%</span>
          </div>
        </div>

        <SectionHeader title="Personal records" />
        <div className="space-y-2">
          {personalRecords.map((pr) => (
            <div key={pr.lift} className="bg-card rounded-xl border p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">{pr.lift}</div>
                <div className="text-[11px] text-muted-foreground">Set on {pr.date}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl text-navy leading-none">
                  {pr.value}<span className="text-sm text-muted-foreground ml-1">{pr.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <SectionHeader title="Training calendar · 8 weeks" />
        <div className="bg-card rounded-xl border p-3">
          <div className="grid grid-cols-8 gap-1.5 text-[9px] text-muted-foreground">
            <div />
            {days.map((d, i) => <div key={i} className="text-center">{d}</div>)}
            {trainingHeatmap.map((week, wi) => (
              <FragmentRow key={wi} weekIdx={wi} week={week} />
            ))}
          </div>
          <Legend />
        </div>
      </div>
    </MobileFrame>
  );
}

function FragmentRow({ weekIdx, week }: { weekIdx: number; week: number[] }) {
  return (
    <>
      <div className="text-[9px] text-muted-foreground text-right pr-1 self-center">W{weekIdx + 1}</div>
      {week.map((v, di) => (
        <div
          key={di}
          className={cn(
            "aspect-square rounded-sm",
            v === 0 && "bg-secondary",
            v === 1 && "bg-gold/30",
            v === 2 && "bg-gold/70",
            v === 3 && "bg-gold",
          )}
          title={`Intensity ${v}`}
        />
      ))}
    </>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground justify-end">
      <span>Less</span>
      <div className="h-3 w-3 rounded-sm bg-secondary" />
      <div className="h-3 w-3 rounded-sm bg-gold/30" />
      <div className="h-3 w-3 rounded-sm bg-gold/70" />
      <div className="h-3 w-3 rounded-sm bg-gold" />
      <span>More</span>
    </div>
  );
}
