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
  | "ventures"
  | "community"
  | "media"
  | "food"
  | "other"
  | "custom";

export type PrizePlacement = "first" | "second" | "third" | "winning" | "custom";

export type HostType = "host" | "sponsor" | "venue_partner" | "volunteer" | "other";

/** RSVP / assignment status — only "confirmed" is published to the public site. */
export type RoleStatus = "confirmed" | "maybe" | "no_response";

export const ROLE_STATUSES: RoleStatus[] = ["confirmed", "maybe", "no_response"];

export const ROLE_STATUS_LABELS: Record<RoleStatus, string> = {
  confirmed: "Confirmed",
  maybe: "Maybe",
  no_response: "No response",
};

/** Roles that may appear on the public event page (when confirmed). */
export const PUBLIC_EVENT_ROLE_KEYS = new Set([
  "host",
  "volunteer",
  "judge",
  "speaker",
  "sponsor",
  "sponsor_rep",
  "partner",
  "partner_rep",
]);

export function normalizeRoleStatus(value: unknown): RoleStatus {
  if (value === "maybe" || value === "no_response" || value === "confirmed") return value;
  return "confirmed";
}

export function isCompetitionEvent(type: EventType): boolean {
  return type === "hackathon" || type === "pitch_competition";
}

export interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  /** Local-only — never published to static site */
  linkedin: string | null;
  /** Local-only — never published to static site */
  email: string | null;
  information: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Fixed primary roles — assigned on events; not configurable in Settings. */
export const FIXED_PERSON_ROLES = [
  "judge",
  "speaker",
  "sponsor representative",
  "partner representative",
  "host",
  "volunteer",
  "associated",
] as const;

export type FixedPersonRole = (typeof FIXED_PERSON_ROLES)[number];

/** Configurable sub-role (MC, photographer, venue finder, …) with public visibility. */
export interface PersonSubRole {
  key: string;
  visible: boolean;
}

export const DEFAULT_SUB_ROLES: PersonSubRole[] = [
  { key: "marketing", visible: false },
  { key: "mc", visible: true },
  { key: "sponsor finder", visible: false },
  { key: "venue finder", visible: false },
  { key: "content creator", visible: true },
  { key: "photographer", visible: true },
  { key: "interviewer", visible: true },
];

const NON_VISIBLE_SUB_ROLE_KEYS = new Set(
  DEFAULT_SUB_ROLES.filter((s) => !s.visible).map((s) => s.key.toLowerCase())
);

export function isFixedPersonRole(value: string): boolean {
  const t = value.trim().toLowerCase();
  return FIXED_PERSON_ROLES.some((r) => r.toLowerCase() === t);
}

export function subRoleIsVisible(key: string, subRoles: PersonSubRole[]): boolean {
  const match = subRoles.find((s) => s.key.toLowerCase() === key.trim().toLowerCase());
  return match?.visible === true;
}

export function normalizeSubRoles(raw: unknown): PersonSubRole[] {
  if (!Array.isArray(raw)) return [...DEFAULT_SUB_ROLES];
  const out: PersonSubRole[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) {
      const key = item.trim();
      out.push({
        key,
        visible: !NON_VISIBLE_SUB_ROLE_KEYS.has(key.toLowerCase()),
      });
      continue;
    }
    if (item && typeof item === "object" && "key" in item) {
      const key = String((item as PersonSubRole).key || "").trim();
      if (!key) continue;
      out.push({
        key,
        visible: Boolean((item as PersonSubRole).visible),
      });
    }
  }
  return out.length ? out : [...DEFAULT_SUB_ROLES];
}

/** Local-only role assignment on a person (recommendations / extras). */
export interface PersonRoleAssignment {
  role: string;
  subRole?: string | null;
  status: RoleStatus;
}

export interface Person {
  id: string;
  username: string;
  /** Local-only — never published to static site */
  email: string | null;
  linkedin: string | null;
  /** Legacy field */
  role: string;
  title: string | null;
  /** Local-only */
  phone: string | null;
  /** Local-only admin notes */
  notes: string | null;
  companyId: string | null;
  companyName: string | null;
  /** Local-only role assignments (replaces tags) */
  roles: PersonRoleAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplateDraft {
  subject: string;
  body: string;
  /** Certification emails only — rendered into the attached PDF. */
  certificateText?: string;
}

export interface SmtpSettings {
  host: string;
  port: string;
  user: string;
  pass: string;
  from: string;
  notifyEmail: string;
}

export interface SiteSettings {
  /** Configurable sub-roles (MC, photographer, venue finder, …) */
  subRoles: PersonSubRole[];
  communityLinks: {
    whatsapp: string;
    discord: string;
    x: string;
    lumaCalendar: string;
  };
  smtp: SmtpSettings;
  emailTemplates: {
    sponsorshipRequest: EmailTemplateDraft;
    speakerInvite: EmailTemplateDraft;
    judgeInvite: EmailTemplateDraft;
    judgeSpeakerInvite: EmailTemplateDraft;
    judgeCertification: EmailTemplateDraft;
    speakerCertification: EmailTemplateDraft;
    judgeSpeakerCertification: EmailTemplateDraft;
  };
}

const EVENT_DETAILS_BLOCK = `Event details:
• Date: {{event_date}}
• Time: {{event_time}}
• Place: {{event_place}}
• Theme: {{theme}}
• Tracks: {{tracks}}
• Luma: {{luma_link}}
• Sponsors: {{sponsor_names}}
• Partners: {{partner_names}}`;

export const DEFAULT_EMAIL_TEMPLATES: SiteSettings["emailTemplates"] = {
  sponsorshipRequest: {
    subject: "Sponsorship opportunity — {{event_name}} | Crewbase Collective",
    body: `Hi {{person_name}},

I'm reaching out from Crewbase Collective about sponsoring {{event_name}}.

${EVENT_DETAILS_BLOCK}

We've attached our pitch deck with packages and past outcomes. Would love to explore a partnership — reply to this email anytime.

Best,
Crewbase Collective`,
  },
  speakerInvite: {
    subject: "Invitation to speak — {{event_name}}",
    body: `Hi {{person_name}},

We'd love to invite you to speak at {{event_name}} with Crewbase Collective.

${EVENT_DETAILS_BLOCK}

Your voice would mean a lot to our builders. Please reply if you're interested and we'll share timing and format.

Thank you,
Crewbase Collective`,
  },
  judgeInvite: {
    subject: "Invitation to judge — {{event_name}}",
    body: `Hi {{person_name}},

We'd love to invite you to judge at {{event_name}} with Crewbase Collective.

${EVENT_DETAILS_BLOCK}

Your experience would mean a lot to our builders. Please reply if you're interested and we'll share the judging brief.

Thank you,
Crewbase Collective`,
  },
  judgeSpeakerInvite: {
    subject: "Invitation to judge & speak — {{event_name}}",
    body: `Hi {{person_name}},

We'd love to invite you to both judge and speak at {{event_name}} with Crewbase Collective.

${EVENT_DETAILS_BLOCK}

Your experience would mean a lot to our builders. Please reply if you're interested and we'll share the full brief.

Thank you,
Crewbase Collective`,
  },
  judgeCertification: {
    subject: "Thank you for judging — {{event_name}}",
    body: `Hi {{person_name}},

Thank you for judging at {{event_name}} — your time and thoughtful feedback helped our builders ship better work. We've attached a certificate of appreciation for your contribution.

With gratitude,
Crewbase Collective`,
    certificateText: `Certificate of Appreciation

This certifies that {{person_name}} served as a judge at {{event_name}}{{event_date_clause}}.

Thank you for contributing expertise and thoughtful feedback to our builder community.

Crewbase Collective`,
  },
  speakerCertification: {
    subject: "Thank you for speaking — {{event_name}}",
    body: `Hi {{person_name}},

Thank you for speaking at {{event_name}} — your talk inspired our community. We've attached a certificate of appreciation for your contribution.

With gratitude,
Crewbase Collective`,
    certificateText: `Certificate of Appreciation

This certifies that {{person_name}} served as a speaker at {{event_name}}{{event_date_clause}}.

Thank you for sharing your insights with our builder community.

Crewbase Collective`,
  },
  judgeSpeakerCertification: {
    subject: "Thank you for judging & speaking — {{event_name}}",
    body: `Hi {{person_name}},

Thank you for judging and speaking at {{event_name}} — your time, feedback, and talk helped our builders grow. We've attached a certificate of appreciation for your contribution.

With gratitude,
Crewbase Collective`,
    certificateText: `Certificate of Appreciation

This certifies that {{person_name}} served as a judge and speaker at {{event_name}}{{event_date_clause}}.

Thank you for contributing expertise, feedback, and a talk to our builder community.

Crewbase Collective`,
  },
};

export const DEFAULT_SMTP_SETTINGS: SmtpSettings = {
  host: "",
  port: "587",
  user: "",
  pass: "",
  from: "Crewbase Collective <noreply@crewbasecollective.com>",
  notifyEmail: "",
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  subRoles: [...DEFAULT_SUB_ROLES],
  communityLinks: {
    whatsapp: "",
    discord: "https://discord.gg/3ptzZKgjud",
    x: "",
    lumaCalendar: "https://luma.com/calendar/cal-3A00RBKfF0vkoAd",
  },
  smtp: { ...DEFAULT_SMTP_SETTINGS },
  emailTemplates: {
    sponsorshipRequest: { ...DEFAULT_EMAIL_TEMPLATES.sponsorshipRequest },
    speakerInvite: { ...DEFAULT_EMAIL_TEMPLATES.speakerInvite },
    judgeInvite: { ...DEFAULT_EMAIL_TEMPLATES.judgeInvite },
    judgeSpeakerInvite: { ...DEFAULT_EMAIL_TEMPLATES.judgeSpeakerInvite },
    judgeCertification: { ...DEFAULT_EMAIL_TEMPLATES.judgeCertification },
    speakerCertification: { ...DEFAULT_EMAIL_TEMPLATES.speakerCertification },
    judgeSpeakerCertification: { ...DEFAULT_EMAIL_TEMPLATES.judgeSpeakerCertification },
  },
};

export interface Track {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export interface EventSponsorRep {
  userId: string;
  status: RoleStatus;
}

export interface EventSponsor {
  id: string;
  companyId: string;
  personId: string | null;
  status: RoleStatus;
  sortOrder: number;
  representatives: EventSponsorRep[];
}

export interface EventPartnerRep {
  userId: string;
  status: RoleStatus;
}

export interface EventPartner {
  id: string;
  companyId: string | null;
  customName: string | null;
  partnerType: PartnerType;
  customType: string | null;
  status: RoleStatus;
  sortOrder?: number;
  representatives: EventPartnerRep[];
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
  status: RoleStatus;
  sortOrder: number;
}

export interface EventJudge {
  id: string;
  userId: string;
  role: string | null;
  status: RoleStatus;
  sortOrder: number;
}

/** @deprecated Legacy — migrated into `associated` on normalize. */
export interface EventExternal {
  id: string;
  userId: string;
  role: string | null;
  status: RoleStatus;
  sortOrder: number;
}

/** Admin-only associated person — never published to the public site. */
export interface EventAssociated {
  id: string;
  userId: string;
  /** Sub-role key(s) from settings.subRoles (comma-separated when multiple). */
  role: string | null;
  status: RoleStatus;
  sortOrder: number;
}

export interface EventHost {
  id: string;
  userId: string;
  hostType: HostType;
  customType: string | null;
  role: string | null;
  status: RoleStatus;
  sortOrder: number;
}

/** Staff sub-role on an event (venue finder, MC, …). Public only when sub-role is visible. */
export interface EventStaffRole {
  id: string;
  userId: string;
  /** Sub-role key from settings.subRoles */
  roleKey: string;
  status: RoleStatus;
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
  lumaLinks: string[];
  eventbriteLinks: string[];
  /** @deprecated Legacy single link — use lumaLinks */
  lumaLink?: string | null;
  /** @deprecated Legacy single link — use eventbriteLinks */
  eventbriteLink?: string | null;
  groupLink: string | null;
  isPartnerEvent: boolean;
  /** Show on the public events page / home (single visibility flag) */
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
  /** @deprecated Migrated into associated — kept empty after normalize */
  externals?: EventExternal[];
  /** Admin-only associated people — never included in public JSON */
  associated: EventAssociated[];
  /** Local-only: venue finder, sponsor finder, marketing, custom roles */
  staffRoles: EventStaffRole[];
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

export function normalizeLinkList(
  links: string[] | undefined | null,
  legacy?: string | null
): string[] {
  const fromArray = (links ?? []).map((s) => s.trim()).filter(Boolean);
  if (fromArray.length) return fromArray;
  const single = legacy?.trim();
  return single ? [single] : [];
}

export function normalizeEventBasics(event: EventBasics): EventBasics {
  const lumaLinks = normalizeLinkList(event.lumaLinks, event.lumaLink);
  const eventbriteLinks = normalizeLinkList(event.eventbriteLinks, event.eventbriteLink);
  const {
    showOnEventsPage: _legacyShow,
    ...rest
  } = event as EventBasics & { showOnEventsPage?: boolean };
  return {
    ...rest,
    lumaLinks,
    eventbriteLinks,
    lumaLink: lumaLinks[0] ?? null,
    eventbriteLink: eventbriteLinks[0] ?? null,
    isPublished: rest.isPublished !== false,
  };
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
      lumaLinks: [],
      eventbriteLinks: [],
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
    associated: [],
    staffRoles: [],
    links: [],
    photos: [],
    liveState: null,
  };
}
