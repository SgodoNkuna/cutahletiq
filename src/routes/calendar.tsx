import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { TourOverlay } from "@/components/TourOverlay";
import { calendarEvents, EVENT_KIND_META, TODAY_ISO, type EventKind, type CalEvent } from "@/data/mock";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, MapPin, Clock, Users, X, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — CUT Athletiq" },
      { name: "description", content: "Gym sessions, physio appointments, games and tournaments — one shared schedule." },
    ],
  }),
  component: CalendarPage,
});

const KINDS: EventKind[] = ["gym", "physio", "game", "tournament", "team", "misc"];

// Build a 6x7 grid for the month containing the anchor date
function buildMonth(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startDay = (first.getDay() + 6) % 7; // Mon=0
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
  const today = new Date(TODAY_ISO);
  const [anchor, setAnchor] = React.useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = React.useState<string>(TODAY_ISO);
  const [activeKinds, setActiveKinds] = React.useState<Set<EventKind>>(new Set(KINDS));
  const [detail, setDetail] = React.useState<CalEvent | null>(null);

  const grid = buildMonth(anchor);
  const monthLabel = anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const toggleKind = (k: EventKind) =>
    setActiveKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of calendarEvents) {
      if (!activeKinds.has(e.kind)) continue;
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    for (const list of map.values()) list.sort((a, b) => a.time.localeCompare(b.time));
    return map;
  }, [activeKinds]);

  const dayEvents = eventsByDay.get(selected) ?? [];

  return (
    <MobileFrame title="Calendar">
      <div className="px-5">
        {/* Month switcher */}
        <div className="flex items-center justify-between bg-card rounded-xl border p-2">
          <button
            onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))}
            className="h-8 w-8 rounded-md hover:bg-secondary flex items-center justify-center"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="font-display text-xl">{monthLabel}</div>
          <button
            onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))}
            className="h-8 w-8 rounded-md hover:bg-secondary flex items-center justify-center"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mt-3 -mx-1 px-1">
          {KINDS.map((k) => {
            const meta = EVENT_KIND_META[k];
            const on = activeKinds.has(k);
            return (
              <button
                key={k}
                onClick={() => toggleKind(k)}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border transition-all",
                  on ? "bg-card border-foreground/20" : "bg-secondary/40 border-transparent text-muted-foreground line-through opacity-60",
                )}
              >
                <span className="mr-1">{meta.emoji}</span>{meta.label}
              </button>
            );
          })}
        </div>

        {/* Month grid */}
        <div className="bg-card rounded-xl border p-2 mt-2">
          <div className="grid grid-cols-7 text-[9px] uppercase tracking-wider text-muted-foreground text-center mb-1">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map(({ iso, date, inMonth }) => {
              const evs = eventsByDay.get(iso) ?? [];
              const isToday = iso === TODAY_ISO;
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
                  <span className={cn("font-bold leading-none", isSel && "text-white")}>{date.getDate()}</span>
                  <div className="flex gap-0.5 mt-auto pb-0.5">
                    {evs.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className={cn(
                          "h-1 w-1 rounded-full",
                          e.kind === "gym" && "bg-navy",
                          e.kind === "physio" && "bg-success",
                          e.kind === "game" && "bg-destructive",
                          e.kind === "tournament" && "bg-gold",
                          e.kind === "team" && "bg-navy/60",
                          e.kind === "misc" && "bg-foreground/60",
                          isSel && "bg-white",
                        )}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day */}
        <div className="mt-4">
          <div className="flex items-end justify-between mb-2">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                {selected === TODAY_ISO ? "Today" : new Date(selected).toLocaleDateString(undefined, { weekday: "long" })}
              </div>
              <h2 className="font-display text-2xl leading-none">
                {new Date(selected).toLocaleDateString(undefined, { day: "numeric", month: "long" })}
              </h2>
            </div>
            <button
              onClick={() => toast("Event added · synced to your team", { description: "(Demo only)" })}
              className="text-[11px] font-bold text-navy uppercase tracking-wider flex items-center gap-1 hover:text-gold"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>

          {dayEvents.length === 0 ? (
            <div className="bg-card rounded-xl border p-6 text-center text-sm text-muted-foreground">
              Nothing scheduled. Enjoy the rest day 🌴
            </div>
          ) : (
            <div className="space-y-2">
              {dayEvents.map((e) => {
                const meta = EVENT_KIND_META[e.kind];
                return (
                  <button
                    key={e.id}
                    onClick={() => setDetail(e)}
                    className="w-full text-left bg-card rounded-xl border p-3 flex items-start gap-3 hover:border-gold transition-colors"
                  >
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-lg shrink-0", meta.color)}>
                      {meta.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {e.time}
                        <span className="mx-1">·</span>
                        <span className="font-bold uppercase tracking-wider">{meta.label}</span>
                      </div>
                      <div className="font-bold text-sm mt-0.5 truncate">{e.title}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="h-3 w-3" /> {e.location}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail sheet */}
      {detail && (
        <div className="absolute inset-0 z-40 bg-black/40 flex items-end" onClick={() => setDetail(null)}>
          <div
            className="w-full bg-card rounded-t-3xl p-5 animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-2xl shrink-0", EVENT_KIND_META[detail.kind].color)}>
                {EVENT_KIND_META[detail.kind].emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  {EVENT_KIND_META[detail.kind].label} · {detail.time}
                </div>
                <div className="font-display text-2xl leading-tight">{detail.title}</div>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" /> {detail.location}
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" /> {detail.who}
              </div>
              {detail.notes && (
                <div className="bg-gold/10 border border-gold/30 rounded-lg p-2.5 text-xs">
                  <span className="font-bold">Note · </span>{detail.notes}
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => { toast.success("Marked as going"); setDetail(null); }}
                className="rounded-full bg-navy text-primary-foreground font-bold uppercase tracking-wider py-2.5 text-xs"
              >
                I'm in
              </button>
              <button
                onClick={() => { toast("Coach notified you can't attend", { description: "(Demo only)" }); setDetail(null); }}
                className="rounded-full border-2 border-destructive text-destructive font-bold uppercase tracking-wider py-2.5 text-xs"
              >
                Can't make it
              </button>
            </div>
          </div>
        </div>
      )}

      <TourOverlay
        tourKey="calendar.home"
        steps={[
          { title: "Everyone, one schedule", body: "Gym sessions, physio appointments, games and tournaments — colour-coded by type. Tap any day to drill in.", position: "center" },
          { title: "Filter by what you care about", body: "Use the pills to hide categories. Coaches mostly want gym + games; physios want physio + screenings.", position: "top" },
        ]}
      />
    </MobileFrame>
  );
}
