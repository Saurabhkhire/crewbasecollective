import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Parse YYYY-MM-DD (or Date) as a local calendar date — avoids UTC off-by-one. */
export function parseLocalDate(date: string | Date): Date {
  if (date instanceof Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(date.trim());
  if (dateOnly) {
    const y = Number(dateOnly[1]);
    const m = Number(dateOnly[2]) - 1;
    const d = Number(dateOnly[3]);
    return new Date(y, m, d);
  }
  const parsed = new Date(date);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function formatDate(date: string | Date): string {
  return parseLocalDate(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** e.g. Monday, Jul 13 */
export function formatDayHeading(date: string | Date): string {
  return parseLocalDate(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** Compact list date: Jul 13, 2026 */
export function formatDateShort(date: string | Date): string {
  return parseLocalDate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  if (Number.isNaN(h)) return "";
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const mins = (minutes || "00").slice(0, 2);
  return `${h12}:${mins} ${ampm}`;
}

export function formatClockFromIso(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function localDateKeyFromIso(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function externalUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

export function isCompetitionEvent(type: string): boolean {
  return type === "hackathon" || type === "pitch_competition";
}

export interface EventScheduleFields {
  eventDate: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

function applyTimeToLocalDate(day: string, time: string): Date {
  const base = parseLocalDate(day);
  const [hours, minutes, seconds] = time.split(":");
  base.setHours(
    parseInt(hours, 10) || 0,
    parseInt(minutes || "0", 10) || 0,
    parseInt((seconds || "0").slice(0, 2), 10) || 0,
    0
  );
  return base;
}

/** When an event starts (local). Midnight if no start time. */
export function getEventStartAt(event: EventScheduleFields): Date {
  if (event.startTime) {
    return applyTimeToLocalDate(event.eventDate, event.startTime);
  }
  const d = parseLocalDate(event.eventDate);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** When an event ends (local). End of last day if no end time. */
export function getEventEndAt(event: EventScheduleFields): Date {
  const lastDay = event.endDate || event.eventDate;
  if (event.endTime) {
    return applyTimeToLocalDate(lastDay, event.endTime);
  }
  const d = parseLocalDate(lastDay);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function isEventPast(event: EventScheduleFields, now = new Date()): boolean {
  return getEventEndAt(event).getTime() < now.getTime();
}

export function partitionEventsBySchedule<T extends EventScheduleFields>(
  events: T[],
  now = new Date()
): { upcoming: T[]; past: T[] } {
  const upcoming: T[] = [];
  const past: T[] = [];
  for (const event of events) {
    if (isEventPast(event, now)) past.push(event);
    else upcoming.push(event);
  }
  upcoming.sort((a, b) => getEventStartAt(a).getTime() - getEventStartAt(b).getTime());
  past.sort((a, b) => getEventEndAt(b).getTime() - getEventEndAt(a).getTime());
  return { upcoming, past };
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  hackathon: "Hackathon",
  pitch_competition: "Pitch Competition",
  workshop: "Workshop",
  mixer: "Mixer",
  dinner: "Dinner",
  demo: "Demo",
  other: "Other",
};

export const PRIZE_PLACEMENT_LABELS: Record<string, string> = {
  first: "1st Place",
  second: "2nd Place",
  third: "3rd Place",
  winning: "Winning",
  custom: "Custom",
};

export const PARTNER_TYPE_LABELS: Record<string, string> = {
  venue: "Venue Partner",
  ventures: "Ventures Partner",
  community: "Community Partner",
  media: "Media Partner",
  food: "Food Partner",
  other: "Other Partner",
  custom: "Custom",
};

export const HOST_TYPE_LABELS: Record<string, string> = {
  host: "Host",
  sponsor: "Sponsor Host",
  venue_partner: "Venue Partner Host",
  volunteer: "Volunteer",
  other: "Other",
};
