import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalIcon, Clock, Loader2, MapPin, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { cleanText } from "@/lib/sanitize";

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
type Game = {
  id: string;
  team_id: string | null;
  coach_id: string;
  opponent: string;
  game_date: string;
  game_time: string | null;
  location: string | null;
  notes: string | null;
};
type GameRsvp = { id: string; game_id: string; user_id: string; status: string };

function buildMonth(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startDay = (first.getDay() + 6) % 7;
  const days: { date: Date; iso: string; inMonth: boolean }[] = [];
  const start = new Date(first);
  start.setDate(start.getDate() - startDay);
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({
      date: d,
      iso: d.toISOString().slice(0, 10),
      inMonth: d.getMonth() === anchor.getMonth(),
    });
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
  const [games, setGames] = React.useState<Game[]>([]);
  const [gameRsvps, setGameRsvps] = React.useState<GameRsvp[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<string>(todayISO);
  const [anchor, setAnchor] = React.useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const isEventOwner =
    profile?.role === "coach" || profile?.role === "admin" || profile?.role === "physio";
  const canPickAnyTeam = profile?.role === "admin" || profile?.role === "physio";

  const load = React.useCallback(async () => {
    if (!profile) return;
    const db = supabase as any;
    const [sessRes, eventRes, rsvpRes, teamRes, gameRes, gRsvpRes] = await Promise.all([
      supabase
        .from("sessions")
        .select("id, name, session_date, programmes!inner(name)")
        .order("session_date", { ascending: true }),
      db.from("team_events").select("*").order("event_date", { ascending: true }),
      db.from("event_rsvps").select("*").eq("user_id", profile.id),
      canPickAnyTeam
        ? supabase.from("teams").select("id, name, sport").order("name", { ascending: true })
        : Promise.resolve({ data: [] }),
      db.from("games").select("*").order("game_date", { ascending: true }),
      db.from("game_rsvps").select("*"),
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
    setGames((gameRes.data ?? []) as Game[]);
    setGameRsvps((gRsvpRes.data ?? []) as GameRsvp[]);
    setLoading(false);
  }, [profile, canPickAnyTeam]);

  React.useEffect(() => {
    if (!profile) return;
    void load();
    const ch = supabase
      .channel(`calendar:${profile.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_events" },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_rsvps" },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games" },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_rsvps" },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [profile, load]);

  const setAttendance = async (eventId: string, status: "going" | "maybe" | "declined") => {
    if (!profile) return;
    const { error } = await (supabase as any)
      .from("event_rsvps")
      .upsert(
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
  const dayGames = games.filter((g) => g.game_date === selected);

  const myRsvpFor = (gameId: string) =>
    gameRsvps.find((r) => r.game_id === gameId && r.user_id === profile.id)?.status ?? "no_response";
  const countsFor = (gameId: string) => {
    const rs = gameRsvps.filter((r) => r.game_id === gameId);
    return {
      going: rs.filter((r) => r.status === "going").length,
      not: rs.filter((r) => r.status === "not_going").length,
      none: rs.filter((r) => r.status === "no_response").length,
    };
  };

  const setGameRsvp = async (gameId: string, status: "going" | "not_going" | "no_response") => {
    const { error } = await (supabase as any)
      .from("game_rsvps")
      .upsert(
        { game_id: gameId, user_id: profile.id, status, responded_at: new Date().toISOString() },
        { onConflict: "game_id,user_id" },
      );
    if (error) toast.error("Could not RSVP");
    else {
      toast.success("RSVP updated");
      await load();
    }
  };

  return (
    <MobileFrame title="Calendar">
      <div className="px-5 pb-5">
        {isEventOwner && <EventComposer teams={teams} selected={selected} onCreated={load} />}
        {(profile.role === "coach" || profile.role === "admin") && (
          <GameComposer teams={teams} selected={selected} onCreated={load} />
        )}

        <div className="flex items-center justify-between bg-card rounded-xl border p-2 mt-2">
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
                const hasItems =
                  sessions.some((s) => s.session_date === iso) ||
                  events.some((e) => e.event_date === iso);
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
                    {hasItems && (
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
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
            {selected === todayISO
              ? "Today"
              : new Date(selected + "T00:00:00").toLocaleDateString(undefined, { weekday: "long" })}
          </div>
          <h2 className="font-display text-2xl leading-none">
            {new Date(selected + "T00:00:00").toLocaleDateString(undefined, {
              day: "numeric",
              month: "long",
            })}
          </h2>

          {daySessions.length === 0 && dayEvents.length === 0 ? (
            <div className="bg-card rounded-xl border p-6 text-center text-sm text-muted-foreground mt-2">
              Nothing scheduled.
            </div>
          ) : (
            <div className="space-y-2 mt-2">
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
              {dayEvents.map((event) => {
                const rsvp = rsvps.find((r) => r.event_id === event.id)?.status;
                return (
                  <div key={event.id} className="bg-card rounded-xl border p-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-navy/10 text-navy flex items-center justify-center">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{event.title}</div>
                        <div className="text-[11px] text-muted-foreground space-y-0.5 mt-1">
                          {event.event_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {event.event_time.slice(0, 5)}
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {event.location}
                            </div>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-xs text-foreground/80 mt-2">{event.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mt-3">
                      {(["going", "maybe", "declined"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setAttendance(event.id, status)}
                          className={cn(
                            "rounded-full border px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider",
                            rsvp === status
                              ? "bg-gold text-navy-deep border-gold"
                              : "bg-background text-muted-foreground",
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

const EVENT_TYPES = [
  { value: "team_event", label: "Team event" },
  { value: "extra_mural", label: "Extra-mural" },
  { value: "team_meeting", label: "Team meeting" },
  { value: "individual", label: "Individual" },
  { value: "rehab_session", label: "Rehab session" },
] as const;

type Template = {
  id: string;
  label: string;
  type: (typeof EVENT_TYPES)[number]["value"];
  title: string;
  durationMin: number;
  notes: string;
};

const PHYSIO_TEMPLATES: Template[] = [
  {
    id: "rehab-30",
    label: "Rehab · 30m",
    type: "rehab_session",
    title: "Rehab session",
    durationMin: 30,
    notes: "Mobility, activation, controlled loading. Bring band + log book.",
  },
  {
    id: "rehab-45",
    label: "Rehab · 45m",
    type: "rehab_session",
    title: "Extended rehab",
    durationMin: 45,
    notes: "Phase progression, plyometric prep. Pain monitoring throughout.",
  },
  {
    id: "rtp-test",
    label: "RTP test",
    type: "individual",
    title: "Return-to-play test",
    durationMin: 60,
    notes: "Functional battery: hop, change-of-direction, tolerance check.",
  },
  {
    id: "team-meeting",
    label: "Team meeting",
    type: "team_meeting",
    title: "Medical team brief",
    durationMin: 30,
    notes: "Weekly update on cases, RTP timelines, and load management.",
  },
  {
    id: "1to1",
    label: "1-on-1",
    type: "individual",
    title: "Individual consult",
    durationMin: 20,
    notes: "Subjective check + treatment plan review.",
  },
];

function EventComposer({
  teams,
  selected,
  onCreated,
}: {
  teams: Team[];
  selected: string;
  onCreated: () => Promise<void>;
}) {
  const { profile } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState(selected);
  const [time, setTime] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [teamId, setTeamId] = React.useState("");
  const [eventType, setEventType] = React.useState<string>(
    profile?.role === "physio" ? "rehab_session" : "team_event",
  );
  const [saving, setSaving] = React.useState(false);

  const canPickTeam = profile?.role === "admin" || profile?.role === "physio";

  React.useEffect(() => setDate(selected), [selected]);

  const create = async () => {
    if (!profile) return;
    const cleanTitle = cleanText(title);
    if (!cleanTitle) {
      toast.error("Add an event title");
      return;
    }
    if (cleanTitle.length > 120) {
      toast.error("Title is too long (max 120 chars)");
      return;
    }
    const cleanDesc = cleanText(description).slice(0, 1000);
    const cleanLoc = cleanText(location).slice(0, 120);

    setSaving(true);
    const resolvedTeamId = canPickTeam
      ? teamId || null
      : (profile.team_id ?? null);

    const { error } = await (supabase as any).from("team_events").insert({
      created_by: profile.id,
      team_id: resolvedTeamId,
      title: cleanTitle.slice(0, 120),
      description: cleanDesc,
      event_type: eventType,
      event_date: date,
      event_time: time || null,
      location: cleanLoc || null,
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
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border-2 border-dashed border-gold/50 bg-gold/5 p-3 flex items-center gap-2 text-sm font-bold text-navy hover:bg-gold/10 transition-colors mb-2"
      >
        <Plus className="h-4 w-4 text-gold" />
        {profile?.role === "physio" ? "Schedule rehab / meeting" : "Add team event"}
      </button>
    );
  }

  const applyTemplate = (tpl: Template) => {
    setTitle(tpl.title);
    setEventType(tpl.type);
    setDescription(tpl.notes);
    // If a time is set, leave it; otherwise prefill 09:00 + duration suggestion in notes
    if (!time) setTime("09:00");
  };

  return (
    <div className="rounded-2xl border-2 border-gold/50 bg-card p-4 space-y-2 mb-2">
      {profile?.role === "physio" && (
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
            Quick templates
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {PHYSIO_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="shrink-0 rounded-full border-2 border-navy/30 bg-background px-3 py-1 text-[11px] font-bold text-navy hover:bg-navy hover:text-white transition-colors whitespace-nowrap"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Team building, rehab session, awards…"
        maxLength={120}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm font-bold"
      />
      <select
        value={eventType}
        onChange={(e) => setEventType(e.target.value)}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
      >
        {EVENT_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
      {canPickTeam && (
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">All / department-wide</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name} · {team.sport}
            </option>
          ))}
        </select>
      )}
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location"
        maxLength={120}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Details…"
        rows={2}
        maxLength={1000}
        className="w-full rounded-md border bg-background p-3 text-sm resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={() => setOpen(false)}
          className="flex-1 rounded-full border py-2 text-xs font-bold uppercase tracking-wider"
        >
          Cancel
        </button>
        <button
          onClick={create}
          disabled={saving}
          className="flex-1 rounded-full bg-gold text-navy-deep py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-60"
        >
          {saving ? "Saving…" : "Create"}
        </button>
      </div>
    </div>
  );
}
