/** Source-of-truth types for static JSON content under /data */

export type EventType =
  | "hackathon"
  | "pitch_competition"
  | "workshop"
  | "mixer"
  | "dinner"
  | "demo"
  | "other";

export type PartnerType =
  | "venue"
  | "technology"
  | "community"
  | "media"
  | "food"
  | "other"
  | "custom";

export type PrizePlacement = "first" | "second" | "third" | "winning" | "custom";

export type HostType = "host" | "sponsor" | "venue_partner" | "volunteer" | "other";

export function isCompetitionEvent(type: EventType): boolean {
  return type === "hackathon" || type === "pitch_competition";
}

export interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  linkedin: string | null;
  information: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  username: string;
  email: string | null;
  linkedin: string | null;
  role: string;
  title: string | null;
  phone: string | null;
  companyId: string | null;
  companyName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Track {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export interface EventSponsorRep {
  userId: string;
}

export interface EventSponsor {
  id: string;
  companyId: string;
  personId: string | null;
  sortOrder: number;
  representatives: EventSponsorRep[];
}

export interface EventPartner {
  id: string;
  companyId: string | null;
  customName: string | null;
  partnerType: PartnerType;
  customType: string | null;
}

export interface Prize {
  id: string;
  trackId: string | null;
  sponsorId: string | null;
  companyId: string | null;
  placement: PrizePlacement;
  customLabel: string | null;
  prizeName: string;
  amount: string | null;
  currency: string | null;
  sortOrder: number;
}

export interface ScheduleSpeaker {
  id: string;
  userId: string;
  sortOrder: number;
}

export interface ScheduleItem {
  id: string;
  startTime: string;
  endTime: string;
  topic: string;
  sortOrder: number;
  isSkipped: boolean;
  speakers: ScheduleSpeaker[];
}

export interface EventSpeaker {
  id: string;
  userId: string;
  eventDay: string | null;
  startTime: string | null;
  endTime: string | null;
  topic: string | null;
  isSkipped: boolean;
  sortOrder: number;
}

export interface EventJudge {
  id: string;
  userId: string;
  role: string | null;
  sortOrder: number;
}

export interface EventHost {
  id: string;
  userId: string;
  hostType: HostType;
  customType: string | null;
  role: string | null;
  sortOrder: number;
}

export interface EventLink {
  id: string;
  label: string;
  url: string;
  sortOrder: number;
}

export interface EventPhoto {
  id: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
}

export interface EventBasics {
  id: string;
  slug: string;
  name: string;
  type: EventType;
  description: string | null;
  theme: string | null;
  dayLabel: string | null;
  eventDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  locationLat: string | null;
  locationLng: string | null;
  coverImageUrl: string | null;
  coverPageUrl: string | null;
  lumaLink: string | null;
  eventbriteLink: string | null;
  groupLink: string | null;
  isPartnerEvent: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventRecord {
  event: EventBasics;
  tracks: Track[];
  sponsors: EventSponsor[];
  partners: EventPartner[];
  prizes: Prize[];
  schedule: ScheduleItem[];
  speakers: EventSpeaker[];
  judges: EventJudge[];
  hosts: EventHost[];
  links: EventLink[];
  photos: EventPhoto[];
  liveState: { liveReassignmentAt: string | null } | null;
}

export interface CompaniesFile {
  companies: Company[];
}

export interface PeopleFile {
  people: Person[];
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base}-${Date.now().toString(36)}`;
}

export function dayLabelFromDate(eventDate: string, endDate?: string | null): string {
  try {
    const start = new Date(`${eventDate}T12:00:00`);
    const opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
    if (endDate && endDate !== eventDate) {
      const end = new Date(`${endDate}T12:00:00`);
      return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
    }
    return start.toLocaleDateString("en-US", opts);
  } catch {
    return eventDate;
  }
}

export function emptyEvent(partial: {
  name: string;
  type: EventType;
  eventDate: string;
}): EventRecord {
  const id = newId();
  const ts = nowIso();
  return {
    event: {
      id,
      slug: slugify(partial.name),
      name: partial.name,
      type: partial.type,
      description: null,
      theme: null,
      dayLabel: dayLabelFromDate(partial.eventDate),
      eventDate: partial.eventDate,
      endDate: null,
      startTime: null,
      endTime: null,
      location: null,
      locationLat: null,
      locationLng: null,
      coverImageUrl: null,
      coverPageUrl: null,
      lumaLink: null,
      eventbriteLink: null,
      groupLink: null,
      isPartnerEvent: false,
      isPublished: true,
      createdAt: ts,
      updatedAt: ts,
    },
    tracks: [],
    sponsors: [],
    partners: [],
    prizes: [],
    schedule: [],
    speakers: [],
    judges: [],
    hosts: [],
    links: [],
    photos: [],
    liveState: null,
  };
}
