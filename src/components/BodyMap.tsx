import * as React from "react";
import { cn } from "@/lib/utils";

export type BodyRegion =
  | "head" | "neck" | "chest" | "shoulder-l" | "shoulder-r"
  | "abs" | "back" | "hip" | "quad-l" | "quad-r"
  | "hamstring-l" | "hamstring-r" | "knee-l" | "knee-r"
  | "calf-l" | "calf-r" | "ankle-l" | "ankle-r" | "foot-l" | "foot-r";

type Props = {
  selected: Record<string, number>; // region -> pain 0-10
  onToggle: (region: BodyRegion) => void;
};

// Each region: simple rounded rect/ellipse on a stylised silhouette
const REGIONS: { id: BodyRegion; label: string; cx: number; cy: number; rx: number; ry: number }[] = [
  { id: "head", label: "Head", cx: 100, cy: 30, rx: 18, ry: 22 },
  { id: "neck", label: "Neck", cx: 100, cy: 56, rx: 10, ry: 6 },
  { id: "shoulder-l", label: "L Shoulder", cx: 72, cy: 72, rx: 14, ry: 12 },
  { id: "shoulder-r", label: "R Shoulder", cx: 128, cy: 72, rx: 14, ry: 12 },
  { id: "chest", label: "Chest", cx: 100, cy: 92, rx: 26, ry: 16 },
  { id: "abs", label: "Abs", cx: 100, cy: 128, rx: 22, ry: 18 },
  { id: "hip", label: "Hip", cx: 100, cy: 162, rx: 26, ry: 12 },
  { id: "quad-l", label: "L Quad", cx: 86, cy: 200, rx: 14, ry: 24 },
  { id: "quad-r", label: "R Quad", cx: 114, cy: 200, rx: 14, ry: 24 },
  { id: "knee-l", label: "L Knee", cx: 86, cy: 238, rx: 12, ry: 8 },
  { id: "knee-r", label: "R Knee", cx: 114, cy: 238, rx: 12, ry: 8 },
  { id: "calf-l", label: "L Calf", cx: 86, cy: 272, rx: 12, ry: 22 },
  { id: "calf-r", label: "R Calf", cx: 114, cy: 272, rx: 12, ry: 22 },
  { id: "ankle-l", label: "L Ankle", cx: 86, cy: 304, rx: 10, ry: 6 },
  { id: "ankle-r", label: "R Ankle", cx: 114, cy: 304, rx: 10, ry: 6 },
];

function painColor(pain: number | undefined) {
  if (!pain) return "fill-secondary stroke-border";
  if (pain <= 3) return "fill-warn/70 stroke-warn";
  if (pain <= 6) return "fill-warn stroke-warn";
  return "fill-destructive stroke-destructive";
}

export function BodyMap({ selected, onToggle }: Props) {
  return (
    <div className="relative w-full max-w-[260px] mx-auto">
      <svg viewBox="0 0 200 340" className="w-full h-auto">
        {/* Body outline */}
        <path
          d="M100 8 c-12 0 -22 10 -22 22 c0 8 4 14 10 18 c-12 4 -22 12 -28 24 c-6 12 -8 26 -8 38 c0 12 6 22 14 28 c-2 8 -2 16 -2 24 c0 16 4 30 10 42 c-2 10 -2 18 -2 28 c0 16 4 30 8 42 l8 60 c2 8 8 12 14 12 c6 0 10 -4 12 -12 l4 -60 l4 60 c2 8 6 12 12 12 c6 0 12 -4 14 -12 l8 -60 c4 -12 8 -26 8 -42 c0 -10 0 -18 -2 -28 c6 -12 10 -26 10 -42 c0 -8 0 -16 -2 -24 c8 -6 14 -16 14 -28 c0 -12 -2 -26 -8 -38 c-6 -12 -16 -20 -28 -24 c6 -4 10 -10 10 -18 c0 -12 -10 -22 -22 -22 z"
          fill="hsl(0 0% 100%)"
          stroke="oklch(0.85 0.01 250)"
          strokeWidth="1.5"
        />
        {REGIONS.map((r) => {
          const pain = selected[r.id];
          const active = !!pain;
          return (
            <g key={r.id} onClick={() => onToggle(r.id)} className="cursor-pointer">
              <ellipse
                cx={r.cx}
                cy={r.cy}
                rx={r.rx}
                ry={r.ry}
                className={cn("transition-all", painColor(pain))}
                strokeWidth={active ? 2 : 1}
                opacity={active ? 0.9 : 0.45}
              />
              {active && (
                <text
                  x={r.cx}
                  y={r.cy + 3}
                  textAnchor="middle"
                  className="fill-white text-[10px] font-bold"
                >
                  {pain}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export const BODY_LABELS: Record<string, string> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r.label]),
);
