// Calendar export helpers — generic CalEvent shape (no longer tied to mock data).
import { cleanText } from "@/lib/sanitize";

export type CalEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  title: string;
  location?: string;
  notes?: string;
};

function pad(n: number) { return String(n).padStart(2, "0"); }

function toICSDate(dateISO: string, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(`${dateISO}T${pad(h)}:${pad(m)}:00`);
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    "00"
  );
}

function addMinutes(dateISO: string, time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(`${dateISO}T${pad(h)}:${pad(m)}:00`);
  d.setMinutes(d.getMinutes() + minutes);
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    "00"
  );
}

function ics(text: string): string {
  return cleanText(text).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildICS(event: CalEvent, durationMin = 60): string {
  const dtStart = toICSDate(event.date, event.time);
  const dtEnd = addMinutes(event.date, event.time, durationMin);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CUT Athletiq//EN",
    "BEGIN:VEVENT",
    `UID:${ics(event.id)}@cut-athletiq`,
    `DTSTAMP:${dtStart}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${ics(event.title)}`,
    event.location ? `LOCATION:${ics(event.location)}` : "",
    event.notes ? `DESCRIPTION:${ics(event.notes)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

export function downloadICS(event: CalEvent) {
  const blob = new Blob([buildICS(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.id}-${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function googleCalendarUrl(event: CalEvent, durationMin = 60): string {
  const dates = `${toICSDate(event.date, event.time)}/${addMinutes(event.date, event.time, durationMin)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: cleanText(event.title),
    dates,
    details: cleanText(event.notes ?? ""),
    location: cleanText(event.location ?? ""),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
