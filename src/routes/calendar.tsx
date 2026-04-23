import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — CUT Athletiq" },
      { name: "description", content: "Upcoming team training sessions." },
    ],
  }),
  component: CalendarPage,
});

type Sess = { id: string; name: string; session_date: string; programme_name: string };

function buildMonth(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startDay = (first.getDay() + 6) % 7;
  const days: { date: Date; iso: string; inMonth: boolean }[] = [];
  const start = new Date(first);
  start.setDate(start.getDate() - startDay);
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    days.push({ date: d, iso, inMonth: d.getMonth() === anchor.getMonth() });
  }
  return days;
}

function CalendarPage() {
  const { profile } = useAuth();
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);
  const [sessions, setSessions] = React.useState<Sess[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<string>(todayISO);
  const [anchor, setAnchor] = React.useState(new Date(today.getFullYear(), today.getMonth(), 1));

  React.useEffect(() => {
    let cancelled = false;
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from("sessions")
        .select("id, name, session_date, programmes!inner(name)")
        .order("session_date", { ascending: true });
      if (cancelled) return;
      setSessions(
        (data ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          session_date: s.session_date,
          programme_name: (s.programmes as { name: string } | null)?.name ?? "Programme",
        })),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const sessionsByDay = React.useMemo(() => {
    const map = new Map<string, Sess[]>();
    for (const s of sessions) {
      if (!map.has(s.session_date)) map.set(s.session_date, []);
      map.get(s.session_date)!.push(s);
    }
    return map;
  }, [sessions]);

  if (!profile) return null;

  const grid = buildMonth(anchor);
  const monthLabel = anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const daySessions = sessionsByDay.get(selected) ?? [];

  return (
    <MobileFrame title="Calendar">
      <div className="px-5">
        <div className="flex items-center justify-between bg-card rounded-xl border p-2">
          <button
            onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))}
            className="px-3 py-1 text-sm hover:bg-secondary rounded-md"
          >
            ‹
          </button>
          <div className="font-display text-xl">{monthLabel}</div>
          <button
            onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))}
            className="px-3 py-1 text-sm hover:bg-secondary rounded-md"
          >
            ›
          </button>
        </div>

        {loading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          </div>
        ) : (
          <div className="bg-card rounded-xl border p-2 mt-2">
            <div className="grid grid-cols-7 text-[9px] uppercase tracking-wider text-muted-foreground text-center mb-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map(({ iso, date, inMonth }) => {
                const evs = sessionsByDay.get(iso) ?? [];
                const isToday = iso === todayISO;
                const isSel = iso === selected;
                return (
                  <button
                    key={iso}
                    onClick={() => setSelected(iso)}
                    className={cn(
                      "aspect-square rounded-md text-[11px] flex flex-col items-center justify-start p-1 transition-all relative",
                      !inMonth && "opacity-30",
                      isSel ? "bg-navy text-white" : "hover:bg-secondary",
                      isToday && !isSel && "ring-2 ring-gold",
                    )}
                  >
                    <span className={cn("font-bold leading-none", isSel && "text-white")}>
                      {date.getDate()}
                    </span>
                    {evs.length > 0 && (
                      <span
                        className={cn(
                          "h-1 w-1 rounded-full mt-auto mb-0.5",
                          isSel ? "bg-white" : "bg-gold",
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="flex items-end justify-between mb-2">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                {selected === todayISO
                  ? "Today"
                  : new Date(selected + "T00:00:00").toLocaleDateString(undefined, {
                      weekday: "long",
                    })}
              </div>
              <h2 className="font-display text-2xl leading-none">
                {new Date(selected + "T00:00:00").toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "long",
                })}
              </h2>
            </div>
          </div>

          {daySessions.length === 0 ? (
            <div className="bg-card rounded-xl border p-6 text-center text-sm text-muted-foreground">
              Nothing scheduled.
            </div>
          ) : (
            <div className="space-y-2">
              {daySessions.map((s) => (
                <Link
                  to="/athlete/workout"
                  key={s.id}
                  className="block bg-card rounded-xl border p-3 hover:border-gold transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gold/15 text-gold flex items-center justify-center">
                      <CalIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {s.programme_name}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileFrame>
  );
}
