import type { CalEvent } from "@/data/mock";
import { cleanText } from "@/lib/sanitize";

/** Convert "HH:MM" + "YYYY-MM-DD" into a UTC-ish ICS timestamp. */
function toICSDate(dateISO: string, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(`${dateISO}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  const pad = (n: number) => String(n).padStart(2, "0");
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
  const d = new Date(`${dateISO}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  d.setMinutes(d.getMinutes() + minutes);
  const pad = (n: number) => String(n).padStart(2, "0");
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

/** ICS text-field escape per RFC 5545. */
function ics(text: string): string {
  return cleanText(text)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildICS(event: CalEvent, durationMin = 60): string {
  const dtStart = toICSDate(event.date, event.time);
  const dtEnd = addMinutes(event.date, event.time, durationMin);
  const stamp = dtStart;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CUT Athletiq//Demo//EN",
    "BEGIN:VEVENT",
    `UID:${ics(event.id)}@cut-athletiq`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${ics(event.title)}`,
    `LOCATION:${ics(event.location)}`,
    `DESCRIPTION:${ics(`${event.who}${event.notes ? " — " + event.notes : ""}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
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
    details: cleanText(`${event.who}${event.notes ? " — " + event.notes : ""}`),
    location: cleanText(event.location),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
