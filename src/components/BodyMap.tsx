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

// Tap regions positioned over the silhouette
const REGIONS: { id: BodyRegion; label: string; cx: number; cy: number; rx: number; ry: number }[] = [
  { id: "head", label: "Head", cx: 100, cy: 32, rx: 18, ry: 22 },
  { id: "neck", label: "Neck", cx: 100, cy: 58, rx: 8, ry: 5 },
  { id: "shoulder-l", label: "L Shoulder", cx: 70, cy: 76, rx: 14, ry: 11 },
  { id: "shoulder-r", label: "R Shoulder", cx: 130, cy: 76, rx: 14, ry: 11 },
  { id: "chest", label: "Chest", cx: 100, cy: 96, rx: 26, ry: 16 },
  { id: "abs", label: "Abs", cx: 100, cy: 130, rx: 22, ry: 18 },
  { id: "hip", label: "Hip", cx: 100, cy: 164, rx: 26, ry: 11 },
  { id: "quad-l", label: "L Quad", cx: 86, cy: 200, rx: 14, ry: 22 },
  { id: "quad-r", label: "R Quad", cx: 114, cy: 200, rx: 14, ry: 22 },
  { id: "knee-l", label: "L Knee", cx: 86, cy: 236, rx: 12, ry: 8 },
  { id: "knee-r", label: "R Knee", cx: 114, cy: 236, rx: 12, ry: 8 },
  { id: "calf-l", label: "L Calf", cx: 86, cy: 272, rx: 12, ry: 22 },
  { id: "calf-r", label: "R Calf", cx: 114, cy: 272, rx: 12, ry: 22 },
  { id: "ankle-l", label: "L Ankle", cx: 86, cy: 304, rx: 9, ry: 6 },
  { id: "ankle-r", label: "R Ankle", cx: 114, cy: 304, rx: 9, ry: 6 },
];

function painFill(pain: number | undefined) {
  if (!pain) return "var(--secondary)";
  if (pain <= 3) return "color-mix(in oklab, var(--warn) 70%, transparent)";
  if (pain <= 6) return "var(--warn)";
  return "var(--destructive)";
}
function painStroke(pain: number | undefined) {
  if (!pain) return "var(--border)";
  if (pain <= 3) return "var(--warn)";
  if (pain <= 6) return "var(--warn)";
  return "var(--destructive)";
}

export function BodyMap({ selected, onToggle }: Props) {
  return (
    <div className="relative w-full max-w-[260px] mx-auto">
      <svg viewBox="0 0 200 340" className="w-full h-auto" aria-label="Body map">
        <defs>
          <linearGradient id="bodyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.99 0 0)" />
            <stop offset="100%" stopColor="oklch(0.95 0.005 250)" />
          </linearGradient>
          <radialGradient id="painGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--destructive)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--destructive)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Body silhouette — anatomically clearer */}
        <g>
          {/* Head */}
          <ellipse cx="100" cy="32" rx="20" ry="24" fill="url(#bodyFill)" stroke="oklch(0.85 0.01 250)" strokeWidth="1.5" />
          {/* Neck */}
          <rect x="92" y="52" width="16" height="12" rx="3" fill="url(#bodyFill)" stroke="oklch(0.85 0.01 250)" strokeWidth="1.5" />
          {/* Torso */}
          <path
            d="M64 70 Q70 64 88 64 L112 64 Q130 64 136 70 L142 110 Q146 130 138 152 L130 174 Q120 178 100 178 Q80 178 70 174 L62 152 Q54 130 58 110 Z"
            fill="url(#bodyFill)"
            stroke="oklch(0.85 0.01 250)"
            strokeWidth="1.5"
          />
          {/* Arms */}
          <path d="M62 72 Q48 84 46 110 Q44 132 50 156 L58 158 Q56 132 58 112 Q60 90 70 78 Z" fill="url(#bodyFill)" stroke="oklch(0.85 0.01 250)" strokeWidth="1.5" />
          <path d="M138 72 Q152 84 154 110 Q156 132 150 156 L142 158 Q144 132 142 112 Q140 90 130 78 Z" fill="url(#bodyFill)" stroke="oklch(0.85 0.01 250)" strokeWidth="1.5" />
          {/* Legs */}
          <path d="M70 178 Q72 220 78 260 L82 314 Q84 322 92 322 Q98 322 100 314 L102 264 Q102 220 100 178 Z" fill="url(#bodyFill)" stroke="oklch(0.85 0.01 250)" strokeWidth="1.5" />
          <path d="M130 178 Q128 220 122 260 L118 314 Q116 322 108 322 Q102 322 100 314 L98 264 Q98 220 100 178 Z" fill="url(#bodyFill)" stroke="oklch(0.85 0.01 250)" strokeWidth="1.5" />
          {/* Center line */}
          <line x1="100" y1="68" x2="100" y2="174" stroke="oklch(0.9 0.01 250)" strokeWidth="0.6" strokeDasharray="2 3" />
        </g>

        {/* Tap regions */}
        {REGIONS.map((r) => {
          const pain = selected[r.id];
          const active = !!pain;
          return (
            <g key={r.id} onClick={() => onToggle(r.id)} className="cursor-pointer group">
              {active && pain >= 6 && (
                <ellipse cx={r.cx} cy={r.cy} rx={r.rx + 8} ry={r.ry + 8} fill="url(#painGlow)" className="animate-pulse" />
              )}
              <ellipse
                cx={r.cx}
                cy={r.cy}
                rx={r.rx}
                ry={r.ry}
                fill={painFill(pain)}
                stroke={painStroke(pain)}
                strokeWidth={active ? 2 : 1}
                opacity={active ? 0.9 : 0.25}
                className="transition-all group-hover:opacity-70"
              />
              {active && (
                <text
                  x={r.cx}
                  y={r.cy + 3}
                  textAnchor="middle"
                  className="fill-white text-[10px] font-bold pointer-events-none"
                >
                  {pain}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-2 text-[9px] text-muted-foreground">
        <span>Pain</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warn/70" /> 1-3</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warn" /> 4-6</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> 7+</span>
      </div>
    </div>
  );
}

export const BODY_LABELS: Record<string, string> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r.label]),
);
