import * as React from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  accent,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: "gold" | "navy" | "success" | "danger";
  className?: string;
}) {
  const accentClass =
    accent === "gold" ? "border-l-gold" :
    accent === "navy" ? "border-l-navy" :
    accent === "success" ? "border-l-success" :
    accent === "danger" ? "border-l-destructive" : "border-l-border";

  return (
    <div className={cn("bg-card rounded-xl border-l-4 border border-border p-3 shadow-sm", accentClass, className)}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="font-display text-2xl text-foreground leading-tight mt-0.5">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ready: { label: "Ready", cls: "bg-success/15 text-success border-success/30" },
    fatigued: { label: "Fatigued", cls: "bg-warn/15 text-warn border-warn/40" },
    injured: { label: "Injured", cls: "bg-destructive/15 text-destructive border-destructive/30" },
    rehab: { label: "Rehab", cls: "bg-warn/15 text-warn border-warn/40" },
    monitor: { label: "Monitor", cls: "bg-warn/10 text-warn border-warn/30" },
    "cleared-soon": { label: "Cleared soon", cls: "bg-success/10 text-success border-success/30" },
  };
  const m = map[status] ?? { label: status, cls: "bg-secondary text-foreground border-border" };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", m.cls)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {m.label}
    </span>
  );
}

export function SportTag({ sport }: { sport: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-navy/10 text-navy px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
      {sport}
    </span>
  );
}

export function PRBadge({ label = "NEW PR!" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gold text-navy-deep px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider animate-pulse">
      🔥 {label}
    </span>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-2 mt-4 first:mt-0">
      <h2 className="font-display text-lg text-foreground">{title}</h2>
      {action}
    </div>
  );
}
