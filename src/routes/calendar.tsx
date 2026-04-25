import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalIcon, Clock, Loader2, MapPin, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — CUT Athletiq" },
      { name: "description", content: "Upcoming training, team events, and attendance." },
    ],
  }),
  component: CalendarPage,
});

type Sess = { id: string; name: string; session_date: string; programme_name: string };
type TeamEvent = {
  id: string;
  team_id: string | null;
  created_by: string;
  title: string;
  description: string;
  event_type: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
};
type Rsvp = { id: string; event_id: string; user_id: string; status: string };
type Team = { id: string; name: string; sport: string };

function buildMonth(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startDay = (first.getDay() + 6) % 7;
  const days: { date: Date; iso: string; inMonth: boolean }[] = [];
  const start = new Date(first);
  start.setDate(start.getDate() - startDay);
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({ date: d, iso: d.toISOString().slice(0, 10), inMonth: d.getMonth() === anchor.getMonth() });
  }
  return days;
}

function CalendarPage() {
  const { profile } = useAuth();
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);
  const [sessions, setSessions] = React.useState<Sess[]>([]);
  const [events, setEvents] = React.useState<TeamEvent[]>([]);
  const [rsvps, setRsvps] = React.useState<Rsvp[]>([]);
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<string>(todayISO);
  const [anchor, setAnchor] = React.useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const isEventOwner = profile?.role === "coach" || profile?.role === "admin";

  const load = React.useCallback(async () => {
    if (!profile) return;
    const db = supabase as any;
    const [sessRes, eventRes, rsvpRes, teamRes] = await Promise.all([
      supabase
        .from("sessions")
        .select("id, name, session_date, programmes!inner(name)")
        .order("session_date", { ascending: true }),
      db.from("team_events").select("*").order("event_date", { ascending: true }),
      db.from("event_rsvps").select("*").eq("user_id", profile.id),
      profile.role === "admin"
        ? supabase.from("teams").select("id, name, sport").order("name", { ascending: true })
        : Promise.resolve({ data: [] }),
    ]);
    setSessions(
      (sessRes.data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        session_date: s.session_date,
        programme_name: (s.programmes as { name: string } | null)?.name ?? "Programme",
      })),
    );
    setEvents((eventRes.data ?? []) as TeamEvent[]);
    setRsvps((rsvpRes.data ?? []) as Rsvp[]);
    setTeams((teamRes.data ?? []) as Team[]);
    setLoading(false);
  }, [profile]);

  React.useEffect(() => {
    if (!profile) return;
    void load();
    const ch = supabase
      .channel(`calendar:${profile.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "team_events" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "event_rsvps" }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [profile, load]);

  const setAttendance = async (eventId: string, status: "going" | "maybe" | "declined") => {
    if (!profile) return;
    const { error } = await (supabase as any).from("event_rsvps").upsert(
      { event_id: eventId, user_id: profile.id, status, responded_at: new Date().toISOString() },
      { onConflict: "event_id,user_id" },
    );
    if (error) toast.error("Could not save attendance");
    else {
      toast.success("Attendance updated");
      await load();
    }
  };

  if (!profile) return null;

  const grid = buildMonth(anchor);
  const monthLabel = anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const daySessions = sessions.filter((s) => s.session_date === selected);
  const dayEvents = events.filter((e) => e.event_date === selected);

  return (
    <MobileFrame title="Calendar">
      <div className="px-5 pb-5">
        {isEventOwner && <EventComposer teams={teams} selected={selected} onCreated={load} />}

        <div className="flex items-center justify-between bg-card rounded-xl border p-2 mt-2">
          <button onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))} className="px-3 py-1 text-sm hover:bg-secondary rounded-md">‹</button>
          <div className="font-display text-xl">{monthLabel}</div>
          <button onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))} className="px-3 py-1 text-sm hover:bg-secondary rounded-md">›</button>
        </div>

        {loading ? (
          <div className="py-8 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gold" /></div>
        ) : (
          <div className="bg-card rounded-xl border p-2 mt-2">
            <div className="grid grid-cols-7 text-[9px] uppercase tracking-wider text-muted-foreground text-center mb-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map(({ iso, date, inMonth }) => {
                const hasItems = sessions.some((s) => s.session_date === iso) || events.some((e) => e.event_date === iso);
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
                    <span className={cn("font-bold leading-none", isSel && "text-white")}>{date.getDate()}</span>
                    {hasItems && <span className={cn("h-1 w-1 rounded-full mt-auto mb-0.5", isSel ? "bg-white" : "bg-gold")} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
            {selected === todayISO ? "Today" : new Date(selected + "T00:00:00").toLocaleDateString(undefined, { weekday: "long" })}
          </div>
          <h2 className="font-display text-2xl leading-none">
            {new Date(selected + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "long" })}
          </h2>

          {daySessions.length === 0 && dayEvents.length === 0 ? (
            <div className="bg-card rounded-xl border p-6 text-center text-sm text-muted-foreground mt-2">Nothing scheduled.</div>
          ) : (
            <div className="space-y-2 mt-2">
              {daySessions.map((s) => (
                <Link to="/athlete/workout" key={s.id} className="block bg-card rounded-xl border p-3 hover:border-gold transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gold/15 text-gold flex items-center justify-center"><CalIcon className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{s.programme_name}</div>
                    </div>
                  </div>
                </Link>
              ))}
              {dayEvents.map((event) => {
                const rsvp = rsvps.find((r) => r.event_id === event.id)?.status;
                return (
                  <div key={event.id} className="bg-card rounded-xl border p-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-navy/10 text-navy flex items-center justify-center"><Users className="h-4 w-4" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{event.title}</div>
                        <div className="text-[11px] text-muted-foreground space-y-0.5 mt-1">
                          {event.event_time && <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {event.event_time.slice(0, 5)}</div>}
                          {event.location && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</div>}
                        </div>
                        {event.description && <p className="text-xs text-foreground/80 mt-2">{event.description}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mt-3">
                      {(["going", "maybe", "declined"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setAttendance(event.id, status)}
                          className={cn(
                            "rounded-full border px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider",
                            rsvp === status ? "bg-gold text-navy-deep border-gold" : "bg-background text-muted-foreground",
                          )}
                        >
                          {status === "going" ? "I'll be there" : status}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MobileFrame>
  );
}

function EventComposer({ teams, selected, onCreated }: { teams: Team[]; selected: string; onCreated: () => Promise<void> }) {
  const { profile } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState(selected);
  const [time, setTime] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [teamId, setTeamId] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => setDate(selected), [selected]);

  const create = async () => {
    if (!profile || !title.trim()) {
      toast.error("Add an event title");
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("team_events").insert({
      created_by: profile.id,
      team_id: profile.role === "coach" ? profile.team_id : teamId || null,
      title: title.trim(),
      description: description.trim(),
      event_type: "extra_mural",
      event_date: date,
      event_time: time || null,
      location: location.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Could not create event");
      return;
    }
    toast.success("Event added");
    setTitle("");
    setDescription("");
    setLocation("");
    setTime("");
    setOpen(false);
    await onCreated();
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full rounded-2xl border-2 border-dashed border-gold/50 bg-gold/5 p-3 flex items-center gap-2 text-sm font-bold text-navy hover:bg-gold/10 transition-colors">
        <Plus className="h-4 w-4 text-gold" /> Add team event
      </button>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-gold/50 bg-card p-4 space-y-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Team building, awards evening…" className="w-full rounded-md border bg-background px-3 py-2 text-sm font-bold" />
      <div className="grid grid-cols-2 gap-2">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm" />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm" />
      </div>
      {profile?.role === "admin" && (
        <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">All / department-wide</option>
          {teams.map((team) => <option key={team.id} value={team.id}>{team.name} · {team.sport}</option>)}
        </select>
      )}
      <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details…" rows={2} className="w-full rounded-md border bg-background p-3 text-sm resize-none" />
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="flex-1 rounded-full border py-2 text-xs font-bold uppercase tracking-wider">Cancel</button>
        <button onClick={create} disabled={saving} className="flex-1 rounded-full bg-gold text-navy-deep py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-60">
          {saving ? "Saving…" : "Create"}
        </button>
      </div>
    </div>
  );
}
