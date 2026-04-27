import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { SectionHeader } from "@/components/primitives";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Moon, Activity, Loader2 } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/athlete/wellness")({
  head: () => ({
    meta: [
      { title: "Daily Wellness — CUT Athletiq" },
      { name: "description", content: "Log how you slept and how ready you feel today." },
    ],
  }),
  component: AthleteWellness,
});

const Schema = z.object({
  sleep_hours: z.number().min(0).max(24),
  sleep_quality: z.number().int().min(1).max(5),
  readiness: z.number().int().min(1).max(5),
  notes: z.string().max(500).optional(),
});

type Row = {
  id: string;
  checkin_date: string;
  sleep_hours: number;
  sleep_quality: number;
  readiness: number;
  notes: string | null;
};

function AthleteWellness() {
  const { profile } = useAuth();
  const [sleep, setSleep] = React.useState("8");
  const [quality, setQuality] = React.useState(4);
  const [ready, setReady] = React.useState(4);
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [history, setHistory] = React.useState<Row[]>([]);

  const today = new Date().toISOString().slice(0, 10);

  const load = React.useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("wellness_checkins")
      .select("id, checkin_date, sleep_hours, sleep_quality, readiness, notes")
      .eq("athlete_id", profile.id)
      .order("checkin_date", { ascending: false })
      .limit(14);
    const rows = (data ?? []) as Row[];
    setHistory(rows);
    const todayRow = rows.find((r) => r.checkin_date === today);
    if (todayRow) {
      setSleep(String(todayRow.sleep_hours));
      setQuality(todayRow.sleep_quality);
      setReady(todayRow.readiness);
      setNotes(todayRow.notes ?? "");
    }
  }, [profile, today]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (!profile) return;
    const parsed = Schema.safeParse({
      sleep_hours: Number(sleep),
      sleep_quality: quality,
      readiness: ready,
      notes: notes.trim() || undefined,
    });
    if (!parsed.success) {
      toast.error("Check your inputs (0–24 hrs; ratings 1–5).");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("wellness_checkins").upsert(
      {
        athlete_id: profile.id,
        checkin_date: today,
        ...parsed.data,
      },
      { onConflict: "athlete_id,checkin_date" },
    );
    setSaving(false);
    if (error) {
      toast.error("Could not save. Try again.");
      return;
    }
    toast.success("Wellness saved for today");
    void load();
  };

  return (
    <MobileFrame title="Daily wellness">
      <div className="px-5">
        <div className="bg-gradient-to-br from-navy to-navy-deep text-white rounded-2xl p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/70">
            <Moon className="h-3.5 w-3.5 text-gold" /> Today · {new Date().toLocaleDateString()}
          </div>
          <div className="font-display text-2xl mt-1">How did you sleep & feel?</div>
        </div>

        <SectionHeader title="Today's check-in" />
        <div className="bg-card rounded-2xl border p-4 space-y-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Hours slept
            </label>
            <Input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              className="mt-1"
            />
          </div>
          <RatingRow label="Sleep quality" value={quality} onChange={setQuality} />
          <RatingRow label="Gym readiness" value={ready} onChange={setReady} />
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Notes (optional)
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              placeholder="Soreness, mood, etc."
              className="mt-1"
            />
          </div>
          <button
            onClick={submit}
            disabled={saving}
            className="w-full bg-gold text-navy-deep font-bold uppercase tracking-wider rounded-full py-3 hover:scale-[1.01] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save today
          </button>
        </div>

        <SectionHeader title="Last 14 days" />
        {history.length === 0 ? (
          <div className="bg-card rounded-xl border p-5 text-center text-sm text-muted-foreground">
            No history yet.
          </div>
        ) : (
          <div className="bg-card rounded-xl border divide-y">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 p-3">
                <Activity className="h-4 w-4 text-gold" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold">
                    {new Date(h.checkin_date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {h.sleep_hours}h sleep · quality {h.sleep_quality}/5 · ready {h.readiness}/5
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileFrame>
  );
}

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="flex gap-1 mt-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 py-2 rounded-lg border-2 font-bold transition-all ${
              value === n
                ? "bg-navy text-white border-navy-deep"
                : "bg-secondary text-muted-foreground border-transparent hover:border-navy/30"
            }`}
            aria-label={`${label} ${n}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
