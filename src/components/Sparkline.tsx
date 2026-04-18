import * as React from "react";
import { cn } from "@/lib/utils";

export type SparkPoint = { label: string; value: number };

/**
 * Lightweight inline sparkline (no chart lib).
 * Renders a smooth area + line + dots.
 */
export function Sparkline({
  data,
  width = 220,
  height = 56,
  stroke = "var(--navy)",
  fill = "color-mix(in oklab, var(--navy) 14%, transparent)",
  className,
  showLastDot = true,
  showLastLabel = true,
  yMin,
  yMax,
}: {
  data: SparkPoint[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
  showLastDot?: boolean;
  showLastLabel?: boolean;
  yMin?: number;
  yMax?: number;
}) {
  if (data.length === 0) return null;

  const padX = 4;
  const padY = 8;
  const w = width - padX * 2;
  const h = height - padY * 2;

  const values = data.map((d) => d.value);
  const min = yMin ?? Math.min(...values);
  const max = yMax ?? Math.max(...values);
  const range = Math.max(0.001, max - min);

  const stepX = data.length === 1 ? 0 : w / (data.length - 1);
  const points = data.map((d, i) => ({
    x: padX + stepX * i,
    y: padY + h - ((d.value - min) / range) * h,
    value: d.value,
    label: d.label,
  }));

  // Smooth path via simple monotone-ish bezier
  const path = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, "");

  const area = `${path} L ${points[points.length - 1].x} ${padY + h} L ${points[0].x} ${padY + h} Z`;
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("block w-full h-auto", className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={area} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {showLastDot && (
        <>
          <circle cx={last.x} cy={last.y} r={4} fill="var(--gold)" stroke="var(--card)" strokeWidth={2} />
        </>
      )}
      {showLastLabel && (
        <text
          x={last.x}
          y={Math.max(12, last.y - 8)}
          textAnchor="end"
          fontSize="10"
          fontWeight="700"
          fill="var(--ink)"
        >
          {last.value.toFixed(1)}
        </text>
      )}
    </svg>
  );
}
