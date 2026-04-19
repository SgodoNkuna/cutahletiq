import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { TourOverlay } from "@/components/TourOverlay";
import { calendarEvents, EVENT_KIND_META, TODAY_ISO, type EventKind, type CalEvent } from "@/data/mock";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, MapPin, Clock, Users, X, Plus, Calendar as CalIcon, Download, GripVertical, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/lib/role-context";
import { downloadICS, googleCalendarUrl } from "@/lib/calendar-export";

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

function buildWeek(anchor: Date) {
  // Monday-anchored week containing `anchor`
  const d = new Date(anchor);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return { date: day, iso: day.toISOString().slice(0, 10) };
  });
}

function CalendarPage() {
  const today = new Date(TODAY_ISO);
  const [view, setView] = React.useState<"month" | "week">("month");
  const [anchor, setAnchor] = React.useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [weekAnchor, setWeekAnchor] = React.useState(today);
  const [selected, setSelected] = React.useState<string>(TODAY_ISO);
  const [activeKinds, setActiveKinds] = React.useState<Set<EventKind>>(new Set(KINDS));
  const [detail, setDetail] = React.useState<CalEvent | null>(null);
  const { role, eventOverrides, rescheduleEvent } = useRole();
  const canDrag = role === "coach" || role === "admin";

  // Apply user reschedules on top of mock data
  const events = React.useMemo<CalEvent[]>(
    () =>
      calendarEvents.map((e) => {
        const o = eventOverrides[e.id];
        return o ? { ...e, date: o.date, time: o.time } : e;
      }),
    [eventOverrides],
  );

  const grid = buildMonth(anchor);
  const week = buildWeek(weekAnchor);
  const monthLabel = anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const weekLabel = `${week[0].date.toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${week[6].date.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;

  const toggleKind = (k: EventKind) =>
    setActiveKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      if (!activeKinds.has(e.kind)) continue;
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    for (const list of map.values()) list.sort((a, b) => a.time.localeCompare(b.time));
    return map;
  }, [events, activeKinds]);

  const dayEvents = eventsByDay.get(selected) ?? [];

  // --- Drag state for week view (coach only) ---
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [dragOverIso, setDragOverIso] = React.useState<string | null>(null);
  const [conflict, setConflict] = React.useState<{ ev: CalEvent; iso: string; clashes: CalEvent[] } | null>(null);

  const commitMove = (id: string, iso: string, time: string) => {
    rescheduleEvent(id, iso, time);
    const ev = events.find((e) => e.id === id);
    toast.success(`${ev?.title ?? "Session"} moved to ${new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}`);
  };

  const handleDrop = (iso: string) => {
    if (!dragId) return;
    const ev = events.find((e) => e.id === dragId);
    setDragId(null);
    setDragOverIso(null);
    if (!ev) return;
    if (ev.date === iso) return;

    // Block clashes with games / tournaments — needs explicit confirm
    const clashes = events.filter(
      (x) => x.id !== ev.id && x.date === iso && (x.kind === "game" || x.kind === "tournament"),
    );
    if (clashes.length > 0) {
      setConflict({ ev, iso, clashes });
      return;
    }
    commitMove(ev.id, iso, ev.time);
  };

  return (
    <MobileFrame title="Calendar">
      <div className="px-5">
        {/* View toggle */}
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-secondary rounded-full p-0.5 flex">
            {(["month", "week"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold transition-colors",
                  view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>
          {view === "week" && canDrag && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <GripVertical className="h-3 w-3" /> Drag to reschedule
            </span>
          )}
        </div>

        {/* Switcher */}
        <div className="flex items-center justify-between bg-card rounded-xl border p-2">
          <button
            onClick={() => {
              if (view === "month") setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1));
              else { const d = new Date(weekAnchor); d.setDate(d.getDate() - 7); setWeekAnchor(d); }
            }}
            className="h-8 w-8 rounded-md hover:bg-secondary flex items-center justify-center"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="font-display text-xl">{view === "month" ? monthLabel : weekLabel}</div>
          <button
            onClick={() => {
              if (view === "month") setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1));
              else { const d = new Date(weekAnchor); d.setDate(d.getDate() + 7); setWeekAnchor(d); }
            }}
            className="h-8 w-8 rounded-md hover:bg-secondary flex items-center justify-center"
            aria-label="Next"
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

        {view === "month" ? (
          <MonthGrid
            grid={grid}
            eventsByDay={eventsByDay}
            selected={selected}
            setSelected={setSelected}
          />
        ) : (
          <WeekStrip
            week={week}
            eventsByDay={eventsByDay}
            canDrag={canDrag}
            dragId={dragId}
            dragOverIso={dragOverIso}
            setDragId={setDragId}
            setDragOverIso={setDragOverIso}
            handleDrop={handleDrop}
            onOpen={setDetail}
            dragEvent={dragId ? events.find((e) => e.id === dragId) ?? null : null}
          />
        )}

        {/* Selected day list (month view only) */}
        {view === "month" && (
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
        )}
      </div>

      {/* Detail sheet */}
      {detail && <DetailSheet event={detail} onClose={() => setDetail(null)} />}

      {/* Conflict warning */}
      {conflict && (
        <ConflictDialog
          ev={conflict.ev}
          iso={conflict.iso}
          clashes={conflict.clashes}
          onCancel={() => setConflict(null)}
          onConfirm={() => {
            commitMove(conflict.ev.id, conflict.iso, conflict.ev.time);
            setConflict(null);
          }}
        />
      )}

      <TourOverlay
        tourKey="calendar.home"
        steps={[
          { title: "Everyone, one schedule", body: "Gym sessions, physio appointments, games and tournaments — colour-coded by type. Tap any day to drill in.", position: "center" },
          { title: "Switch to Week", body: "Coaches can drag a session card to a new day to reschedule on the fly.", position: "top" },
          { title: "Sync to your phone", body: "Open any event → 'Add to Google' or download the .ics for Apple/Outlook.", position: "bottom" },
        ]}
      />
    </MobileFrame>
  );
}

function MonthGrid({
  grid,
  eventsByDay,
  selected,
  setSelected,
}: {
  grid: { iso: string; date: Date; inMonth: boolean }[];
  eventsByDay: Map<string, CalEvent[]>;
  selected: string;
  setSelected: (s: string) => void;
}) {
  return (
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
  );
}

function WeekStrip({
  week,
  eventsByDay,
  canDrag,
  dragId,
  dragOverIso,
  setDragId,
  setDragOverIso,
  handleDrop,
  onOpen,
  dragEvent,
}: {
  week: { date: Date; iso: string }[];
  eventsByDay: Map<string, CalEvent[]>;
  canDrag: boolean;
  dragId: string | null;
  dragOverIso: string | null;
  setDragId: (id: string | null) => void;
  setDragOverIso: (iso: string | null) => void;
  handleDrop: (iso: string) => void;
  onOpen: (e: CalEvent) => void;
  dragEvent: CalEvent | null;
}) {
  const dragging = !!dragEvent;
  return (
    <div className="mt-2 space-y-2">
      {week.map(({ date, iso }) => {
        const evs = eventsByDay.get(iso) ?? [];
        const isToday = iso === TODAY_ISO;
        const isOver = dragOverIso === iso;
        const wouldClash =
          dragging &&
          dragEvent!.date !== iso &&
          evs.some((x) => x.id !== dragEvent!.id && (x.kind === "game" || x.kind === "tournament"));
        const isSourceDay = dragging && dragEvent!.date === iso;
        const isSafeTarget = dragging && !wouldClash && !isSourceDay;
        return (
          <div
            key={iso}
            onDragOver={(e) => { if (canDrag && dragId) { e.preventDefault(); setDragOverIso(iso); } }}
            onDragLeave={() => setDragOverIso(null)}
            onDrop={() => handleDrop(iso)}
            className={cn(
              "bg-card rounded-xl border-2 p-2 transition-all",
              !dragging && "border-border",
              !dragging && isToday && "ring-2 ring-gold border-border",
              dragging && isSourceDay && "border-dashed border-muted-foreground/40 opacity-60",
              dragging && wouldClash && "border-destructive bg-destructive/5",
              dragging && isSafeTarget && "border-success/60 bg-success/5",
              isOver && wouldClash && "bg-destructive/15 scale-[1.01]",
              isOver && isSafeTarget && "bg-success/15 scale-[1.01]",
            )}
          >
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-xl leading-none">
                  {date.getDate()}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  {date.toLocaleDateString(undefined, { weekday: "short" })}
                </span>
                {dragging && wouldClash && (
                  <span className="text-[9px] uppercase tracking-wider font-bold text-destructive flex items-center gap-0.5">
                    <AlertTriangle className="h-2.5 w-2.5" /> Clash
                  </span>
                )}
                {dragging && isSafeTarget && (
                  <span className="text-[9px] uppercase tracking-wider font-bold text-success">
                    ✓ Safe
                  </span>
                )}
              </div>
              {isToday && !dragging && <span className="text-[9px] uppercase tracking-wider font-bold text-gold">Today</span>}
            </div>
            {evs.length === 0 ? (
              <div className="text-[11px] text-muted-foreground py-2 italic">— Open day —</div>
            ) : (
              <div className="space-y-1.5">
                {evs.map((e) => {
                  const meta = EVENT_KIND_META[e.kind];
                  const isDragging = dragId === e.id;
                  return (
                    <div
                      key={e.id}
                      draggable={canDrag}
                      onDragStart={() => setDragId(e.id)}
                      onDragEnd={() => { setDragId(null); setDragOverIso(null); }}
                      onClick={() => onOpen(e)}
                      className={cn(
                        "rounded-lg border p-2 flex items-center gap-2 cursor-pointer hover:border-gold transition-all",
                        isDragging && "opacity-50 scale-95",
                        canDrag && "active:cursor-grabbing",
                      )}
                    >
                      {canDrag && <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                      <div className={cn("h-8 w-8 rounded-md flex items-center justify-center text-sm shrink-0", meta.color)}>
                        {meta.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {e.time} · {meta.label}
                        </div>
                        <div className="text-sm font-bold truncate">{e.title}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DetailSheet({ event, onClose }: { event: CalEvent; onClose: () => void }) {
  const meta = EVENT_KIND_META[event.kind];
  return (
    <div className="absolute inset-0 z-40 bg-black/40 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-card rounded-t-3xl p-5 animate-fade-up max-h-[90%] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-2xl shrink-0", meta.color)}>
            {meta.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              {meta.label} · {new Date(event.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · {event.time}
            </div>
            <div className="font-display text-2xl leading-tight">{event.title}</div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" /> {event.location}
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" /> {event.who}
          </div>
          {event.notes && (
            <div className="bg-gold/10 border border-gold/30 rounded-lg p-2.5 text-xs">
              <span className="font-bold">Note · </span>{event.notes}
            </div>
          )}
        </div>

        {/* Sync */}
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Sync to your phone</div>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={googleCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border-2 border-navy/30 hover:border-navy bg-card py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 text-navy"
            >
              <CalIcon className="h-3.5 w-3.5" /> Google
            </a>
            <button
              onClick={() => { downloadICS(event); toast.success(".ics downloaded · open it to add to Apple/Outlook"); }}
              className="rounded-lg border-2 border-navy/30 hover:border-navy bg-card py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 text-navy"
            >
              <Download className="h-3.5 w-3.5" /> .ics file
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => { toast.success("Marked as going"); onClose(); }}
            className="rounded-full bg-navy text-primary-foreground font-bold uppercase tracking-wider py-2.5 text-xs"
          >
            I'm in
          </button>
          <button
            onClick={() => { toast("Coach notified you can't attend", { description: "(Demo only)" }); onClose(); }}
            className="rounded-full border-2 border-destructive text-destructive font-bold uppercase tracking-wider py-2.5 text-xs"
          >
            Can't make it
          </button>
        </div>
      </div>
    </div>
  );
}

function ConflictDialog({
  ev,
  iso,
  clashes,
  onCancel,
  onConfirm,
}: {
  ev: CalEvent;
  iso: string;
  clashes: CalEvent[];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dayLabel = new Date(iso).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
  return (
    <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-5" onClick={onCancel}>
      <div
        className="w-full max-w-sm bg-card rounded-2xl p-5 animate-fade-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-display text-xl leading-tight">Schedule clash</div>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-bold text-foreground">{dayLabel}</span> already has a fixture:
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          {clashes.map((c) => {
            const meta = EVENT_KIND_META[c.kind];
            return (
              <div key={c.id} className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2">
                <div className={cn("h-8 w-8 rounded-md flex items-center justify-center text-sm shrink-0", meta.color)}>
                  {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{c.title}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{c.time} · {meta.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground mt-3">
          Moving <span className="font-bold text-foreground">{ev.title}</span> here may overload the squad on game day.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={onCancel}
            className="rounded-full border-2 border-border hover:border-foreground/30 font-bold uppercase tracking-wider py-2.5 text-xs"
          >
            Keep original
          </button>
          <button
            onClick={onConfirm}
            className="rounded-full bg-destructive text-destructive-foreground font-bold uppercase tracking-wider py-2.5 text-xs hover:opacity-90"
          >
            Move anyway
          </button>
        </div>
      </div>
    </div>
  );
}

