import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  type CompaniesFile,
  type Company,
  type EventRecord,
  type EventSponsor,
  type EventType,
  FIXED_PERSON_ROLES,
  type PeopleFile,
  type Person,
  type RoleStatus,
  type SiteSettings,
  type EmailTemplateDraft,
  type SmtpSettings,
  type SmtpAccount,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_EMAIL_TEMPLATES,
  DEFAULT_SMTP_SETTINGS,
  SMTP_PROVIDER_PRESETS,
  inferSmtpProvider,
  parseSmtpProvider,
  dayLabelFromDate,
  emptyEvent,
  isCompetitionEvent,
  newId,
  normalizeEventBasics,
  normalizeLinkList,
  normalizeSubRoles,
  nowIso,
  slugify,
  subRoleIsVisible,
} from "./types.js";
import { eventImageFolder } from "../image-names.js";
import { isConfirmed, normalizeEventRecord, normalizePersonRecord } from "./normalize.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "../../../");
export const DATA_DIR = path.join(ROOT, "data");
export const EVENTS_DIR = path.join(DATA_DIR, "events");
export const IMAGES_DIR = path.join(DATA_DIR, "images");
export const PUBLIC_DATA_DIR = path.join(ROOT, "client/public/data");
export const PUBLIC_IMAGES_DIR = path.join(ROOT, "client/public/images");

function sortByOrder<T extends { sortOrder?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export type ReorderableCollection =
  | "tracks"
  | "sponsors"
  | "partners"
  | "prizes"
  | "schedule"
  | "speakers"
  | "judges"
  | "hosts"
  | "associated"
  | "staffRoles"
  | "links"
  | "photos";

export function reorderEventCollection(
  record: EventRecord,
  collection: ReorderableCollection,
  orderedIds: string[]
): void {
  const key = collection as keyof Pick<
    EventRecord,
    | "tracks"
    | "sponsors"
    | "partners"
    | "prizes"
    | "schedule"
    | "speakers"
    | "judges"
    | "hosts"
    | "associated"
    | "staffRoles"
    | "links"
    | "photos"
  >;
  const arr = record[key] as { id: string; sortOrder?: number }[];
  const byId = new Map(arr.map((item) => [item.id, item]));
  const reordered: typeof arr = [];
  for (let i = 0; i < orderedIds.length; i++) {
    const item = byId.get(orderedIds[i]);
    if (!item) continue;
    item.sortOrder = i;
    reordered.push(item);
  }
  for (const item of arr) {
    if (!orderedIds.includes(item.id)) {
      item.sortOrder = reordered.length;
      reordered.push(item);
    }
  }
  (record[key] as typeof arr) = reordered;
}

function ensureDirs() {
  for (const dir of [
    DATA_DIR,
    EVENTS_DIR,
    path.join(IMAGES_DIR, "companies"),
    path.join(IMAGES_DIR, "events"),
    path.join(PUBLIC_DATA_DIR, "events"),
    PUBLIC_IMAGES_DIR,
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function companiesPath() {
  return path.join(DATA_DIR, "companies.json");
}

function peoplePath() {
  return path.join(DATA_DIR, "people.json");
}

function settingsPath() {
  return path.join(DATA_DIR, "settings.json");
}

function eventPath(id: string) {
  return path.join(EVENTS_DIR, `${id}.json`);
}

function normalizeCompany(c: Company): Company {
  return {
    ...c,
    linkedin: c.linkedin ?? null,
    email: c.email ?? null,
    information: c.information ?? null,
  };
}

function normalizePerson(p: Person): Person {
  return normalizePersonRecord(p);
}

// ─── Companies ───────────────────────────────────────────────────────────────

export function listCompanies(): Company[] {
  ensureDirs();
  return readJson<CompaniesFile>(companiesPath(), { companies: [] }).companies.map(normalizeCompany);
}

export function saveCompanies(companies: Company[]) {
  ensureDirs();
  writeJson(companiesPath(), { companies });
}

export function createCompany(input: Omit<Company, "id" | "createdAt" | "updatedAt">): Company {
  const companies = listCompanies();
  const ts = nowIso();
  const row: Company = { ...input, id: newId(), createdAt: ts, updatedAt: ts };
  companies.push(row);
  saveCompanies(companies);
  return row;
}

export function updateCompany(id: string, patch: Partial<Company>): Company | null {
  const companies = listCompanies();
  const idx = companies.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  companies[idx] = { ...companies[idx], ...patch, id, updatedAt: nowIso() };
  saveCompanies(companies);
  return companies[idx];
}

export function deleteCompany(id: string): boolean {
  const companies = listCompanies();
  const next = companies.filter((c) => c.id !== id);
  if (next.length === companies.length) return false;
  saveCompanies(next);
  return true;
}

export function resolveExistingCompanyName(companyName?: string | null): {
  companyId: string | null;
  companyName: string | null;
} {
  const name = companyName?.trim() || null;
  if (!name) return { companyId: null, companyName: null };
  const match = listCompanies().find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (match) return { companyId: match.id, companyName: match.name };
  return { companyId: null, companyName: name };
}

// ─── People ──────────────────────────────────────────────────────────────────

export function listPeople(): Person[] {
  ensureDirs();
  return readJson<PeopleFile>(peoplePath(), { people: [] }).people.map(normalizePerson);
}

export function savePeople(people: Person[]) {
  ensureDirs();
  writeJson(peoplePath(), { people });
}

export function createPerson(
  input: Omit<Person, "id" | "createdAt" | "updatedAt" | "role"> & {
    companyName?: string | null;
    companyId?: string | null;
    roles?: Person["roles"];
  }
): Person {
  const people = listPeople();
  let companyId = input.companyId ?? null;
  let companyName = input.companyName ?? null;
  if (companyId) {
    const match = listCompanies().find((c) => c.id === companyId);
    if (match) companyName = match.name;
  } else if (companyName) {
    const resolved = resolveExistingCompanyName(companyName);
    companyId = resolved.companyId;
    companyName = resolved.companyName;
  }
  const ts = nowIso();
  const row: Person = {
    id: newId(),
    username: input.username,
    email: input.email ?? null,
    linkedin: input.linkedin ?? null,
    role: "participant",
    title: input.title ?? null,
    phone: input.phone ?? null,
    notes: input.notes ?? null,
    companyId,
    companyName,
    roles: Array.isArray(input.roles) ? input.roles : [],
    createdAt: ts,
    updatedAt: ts,
  };
  people.push(row);
  savePeople(people);
  return row;
}

export function updatePerson(id: string, patch: Partial<Person>): Person | null {
  const people = listPeople();
  const idx = people.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  let companyId = patch.companyId !== undefined ? patch.companyId : people[idx].companyId;
  let companyName = patch.companyName !== undefined ? patch.companyName : people[idx].companyName;
  if (patch.companyId) {
    const match = listCompanies().find((c) => c.id === patch.companyId);
    if (match) {
      companyId = match.id;
      companyName = match.name;
    }
  } else if (patch.companyName !== undefined) {
    const resolved = resolveExistingCompanyName(patch.companyName);
    companyId = resolved.companyId;
    companyName = resolved.companyName;
  }
  people[idx] = normalizePersonRecord({
    ...people[idx],
    ...patch,
    id,
    companyId,
    companyName,
    roles: Array.isArray(patch.roles) ? patch.roles : people[idx].roles || [],
    updatedAt: nowIso(),
  });
  savePeople(people);
  return people[idx];
}

export function deletePerson(id: string): boolean {
  const people = listPeople();
  const next = people.filter((p) => p.id !== id);
  if (next.length === people.length) return false;
  savePeople(next);
  return true;
}

/** Main roles from event assignments + person directory roles. */
export function mainRolesForPerson(
  personId: string,
  events?: EventRecord[],
  personRecord?: Person | null
): string[] {
  const records = events ?? listEventRecords();
  const roles = new Set<string>();
  const person = personRecord ?? listPeople().find((p) => p.id === personId);
  for (const r of person?.roles || []) {
    if (r.role?.trim()) roles.add(r.role.trim());
  }
  for (const record of records) {
    if (record.judges.some((j) => j.userId === personId)) roles.add("judge");
    if (record.speakers.some((s) => s.userId === personId)) roles.add("speaker");
    for (const h of record.hosts) {
      if (h.userId !== personId) continue;
      if (h.hostType === "volunteer") roles.add("volunteer");
      else roles.add("host");
    }
    for (const s of record.sponsors) {
      if (s.personId === personId) roles.add("sponsor representative");
      else if (s.representatives?.some((r) => r.userId === personId)) {
        roles.add("sponsor representative");
      }
    }
    for (const p of record.partners) {
      if (p.representatives?.some((r) => r.userId === personId)) {
        roles.add("partner representative");
      }
    }
    if (record.associated?.some((a) => a.userId === personId)) roles.add("associated");
    if (record.staffRoles.some((sr) => sr.userId === personId)) roles.add("other");
  }
  return [...roles].sort((a, b) => a.localeCompare(b));
}

function splitSubRoleField(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Sub-roles from host/volunteer/associated/staff assignments + person directory roles. */
export function subRolesForPerson(
  personId: string,
  events?: EventRecord[],
  personRecord?: Person | null
): string[] {
  const records = events ?? listEventRecords();
  const roles = new Set<string>();
  const person = personRecord ?? listPeople().find((p) => p.id === personId);
  for (const r of person?.roles || []) {
    for (const s of splitSubRoleField(r.subRole)) roles.add(s);
  }
  for (const record of records) {
    for (const h of record.hosts) {
      if (h.userId !== personId) continue;
      for (const s of splitSubRoleField(h.role)) roles.add(s);
    }
    for (const a of record.associated || []) {
      if (a.userId !== personId) continue;
      for (const s of splitSubRoleField(a.role)) roles.add(s);
    }
    for (const sr of record.staffRoles) {
      if (sr.userId !== personId) continue;
      if (sr.roleKey?.trim()) roles.add(sr.roleKey.trim());
    }
  }
  return [...roles].sort((a, b) => a.localeCompare(b));
}

/** Assignment statuses for a person across events. */
export function statusesForPerson(personId: string, events?: EventRecord[]): RoleStatus[] {
  const records = events ?? listEventRecords();
  const statuses = new Set<RoleStatus>();
  for (const record of records) {
    for (const j of record.judges) {
      if (j.userId === personId) statuses.add(j.status);
    }
    for (const s of record.speakers) {
      if (s.userId === personId) statuses.add(s.status);
    }
    for (const h of record.hosts) {
      if (h.userId === personId) statuses.add(h.status);
    }
    for (const s of record.sponsors) {
      for (const r of s.representatives || []) {
        if (r.userId === personId) statuses.add(r.status);
      }
      if (s.personId === personId) statuses.add(s.status);
    }
    for (const p of record.partners) {
      for (const r of p.representatives || []) {
        if (r.userId === personId) statuses.add(r.status);
      }
    }
    for (const a of record.associated || []) {
      if (a.userId === personId) statuses.add(a.status);
    }
    for (const sr of record.staffRoles) {
      if (sr.userId === personId) statuses.add(sr.status);
    }
  }
  return [...statuses];
}

export type PersonEventRole = {
  mainRole: string;
  subRole: string | null;
  status: RoleStatus;
  companyName?: string | null;
};

export type PersonEventInvolvement = {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventPublished: boolean;
  roles: PersonEventRole[];
};

/** Per-event role/status breakdown for a person (admin People expand). */
export function eventInvolvementsForPerson(
  personId: string,
  events?: EventRecord[]
): PersonEventInvolvement[] {
  const records = events ?? listEventRecords();
  const companies = companyMap();
  const out: PersonEventInvolvement[] = [];

  for (const record of records) {
    const roles: PersonEventRole[] = [];

    for (const j of record.judges) {
      if (j.userId !== personId) continue;
      roles.push({ mainRole: "judge", subRole: null, status: j.status });
    }
    for (const s of record.speakers) {
      if (s.userId !== personId) continue;
      roles.push({ mainRole: "speaker", subRole: null, status: s.status });
    }
    for (const h of record.hosts) {
      if (h.userId !== personId) continue;
      roles.push({
        mainRole: h.hostType === "volunteer" ? "volunteer" : "host",
        subRole: h.role?.trim() || null,
        status: h.status,
      });
    }
    for (const a of record.associated || []) {
      if (a.userId !== personId) continue;
      roles.push({
        mainRole: "associated",
        subRole: a.role?.trim() || null,
        status: a.status,
      });
    }
    for (const s of record.sponsors) {
      const companyName = companies.get(s.companyId)?.name || null;
      if (s.personId === personId) {
        roles.push({
          mainRole: "sponsor representative",
          subRole: null,
          status: s.status,
          companyName,
        });
      }
      for (const r of s.representatives || []) {
        if (r.userId !== personId) continue;
        roles.push({
          mainRole: "sponsor representative",
          subRole: null,
          status: r.status,
          companyName,
        });
      }
    }
    for (const p of record.partners) {
      if (!(p.representatives || []).some((r) => r.userId === personId)) continue;
      const companyName =
        (p.companyId ? companies.get(p.companyId)?.name : null) || p.customName || null;
      for (const r of p.representatives || []) {
        if (r.userId !== personId) continue;
        roles.push({
          mainRole: "partner representative",
          subRole: null,
          status: r.status,
          companyName,
        });
      }
    }
    for (const sr of record.staffRoles) {
      if (sr.userId !== personId) continue;
      roles.push({
        mainRole: "other",
        subRole: sr.roleKey?.trim() || null,
        status: sr.status,
      });
    }

    if (roles.length === 0) continue;
    out.push({
      eventId: record.event.id,
      eventName: record.event.name,
      eventDate: record.event.eventDate,
      eventPublished: record.event.isPublished,
      roles,
    });
  }

  return out.sort((a, b) => b.eventDate.localeCompare(a.eventDate) || a.eventName.localeCompare(b.eventName));
}

export type CompanyRepSummary = {
  userId: string;
  username: string;
  linkedin: string | null;
  status: RoleStatus;
  eventName: string;
};

export type CompanyInvolvement = {
  kind: "sponsor" | "partner";
  partnerType: string | null;
  eventId: string;
  eventName: string;
  eventPublished: boolean;
  status: RoleStatus;
  representatives: CompanyRepSummary[];
};

/** Event involvements for a company (sponsors + partners), including unpublished. */
export function involvementsForCompany(
  companyId: string,
  events?: EventRecord[]
): CompanyInvolvement[] {
  const records = events ?? listEventRecords();
  const people = personMap();
  const out: CompanyInvolvement[] = [];

  for (const record of records) {
    for (const s of record.sponsors) {
      if (s.companyId !== companyId) continue;
      const reps = (s.representatives || []).map((r) => ({
        userId: r.userId,
        username: people.get(r.userId)?.username || "Unknown",
        linkedin: people.get(r.userId)?.linkedin || null,
        status: r.status,
        eventName: record.event.name,
      }));
      if (s.personId && !reps.some((r) => r.userId === s.personId)) {
        reps.push({
          userId: s.personId,
          username: people.get(s.personId)?.username || "Unknown",
          linkedin: people.get(s.personId)?.linkedin || null,
          status: s.status,
          eventName: record.event.name,
        });
      }
      out.push({
        kind: "sponsor",
        partnerType: null,
        eventId: record.event.id,
        eventName: record.event.name,
        eventPublished: record.event.isPublished,
        status: s.status,
        representatives: reps,
      });
    }
    for (const p of record.partners) {
      if (p.companyId !== companyId) continue;
      out.push({
        kind: "partner",
        partnerType: p.partnerType || "other",
        eventId: record.event.id,
        eventName: record.event.name,
        eventPublished: record.event.isPublished,
        status: p.status,
        representatives: (p.representatives || []).map((r) => ({
          userId: r.userId,
          username: people.get(r.userId)?.username || "Unknown",
          linkedin: people.get(r.userId)?.linkedin || null,
          status: r.status,
          eventName: record.event.name,
        })),
      });
    }
  }
  return out;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export function listEventRecords(): EventRecord[] {
  ensureDirs();
  if (!fs.existsSync(EVENTS_DIR)) return [];
  return fs
    .readdirSync(EVENTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const record = readJson<EventRecord>(path.join(EVENTS_DIR, f), null as unknown as EventRecord);
      if (!record) return record;
      record.event = normalizeEventBasics(record.event);
      return normalizeEventRecord(record);
    })
    .filter(Boolean)
    .sort((a, b) => (a.event.eventDate < b.event.eventDate ? 1 : -1));
}

export function getEventRecord(id: string): EventRecord | null {
  const file = eventPath(id);
  if (!fs.existsSync(file)) return null;
  const record = readJson<EventRecord>(file, null as unknown as EventRecord);
  if (!record) return null;
  record.event = normalizeEventBasics(record.event);
  return normalizeEventRecord(record);
}

export function saveEventRecord(record: EventRecord) {
  ensureDirs();
  record.event = normalizeEventBasics(record.event);
  record.event.updatedAt = nowIso();
  writeJson(eventPath(record.event.id), record);
}

export function createEvent(input: {
  name: string;
  type: EventType;
  eventDate: string;
  [key: string]: unknown;
}): EventRecord {
  const record = emptyEvent({
    name: input.name,
    type: input.type,
    eventDate: input.eventDate,
  });
  Object.assign(record.event, {
    description: (input.description as string) ?? null,
    theme: (input.theme as string) ?? null,
    endDate: (input.endDate as string) ?? null,
    startTime: (input.startTime as string) ?? null,
    endTime: (input.endTime as string) ?? null,
    location: (input.location as string) ?? null,
    locationLat: (input.locationLat as string) ?? null,
    locationLng: (input.locationLng as string) ?? null,
    coverImageUrl: (input.coverImageUrl as string) ?? null,
    coverPageUrl: (input.coverPageUrl as string) ?? null,
    lumaLinks: normalizeLinkList(
      input.lumaLinks as string[] | undefined,
      input.lumaLink as string | undefined
    ),
    eventbriteLinks: normalizeLinkList(
      input.eventbriteLinks as string[] | undefined,
      input.eventbriteLink as string | undefined
    ),
    groupLink: (input.groupLink as string) ?? null,
    isPartnerEvent: Boolean(input.isPartnerEvent),
    dayLabel: dayLabelFromDate(input.eventDate, (input.endDate as string) ?? null),
  });
  saveEventRecord(record);
  return record;
}

export function updateEventBasics(
  id: string,
  patch: Partial<EventRecord["event"]>
): EventRecord | null {
  const record = getEventRecord(id);
  if (!record) return null;
  const next = { ...record.event, ...patch, id };
  if (patch.name) next.slug = slugify(patch.name);
  if (patch.eventDate || patch.endDate !== undefined) {
    next.dayLabel = dayLabelFromDate(next.eventDate, next.endDate);
  }
  next.isPublished = patch.isPublished !== undefined ? Boolean(patch.isPublished) : next.isPublished;
  record.event = normalizeEventBasics(next);
  saveEventRecord(record);
  return record;
}

export function deleteEvent(id: string): boolean {
  const file = eventPath(id);
  if (!fs.existsSync(file)) return false;
  fs.unlinkSync(file);
  return true;
}

function getSponsorRepUserIds(sponsors: EventSponsor[]): Set<string> {
  const ids = new Set<string>();
  for (const sponsor of sponsors) {
    if (sponsor.personId) ids.add(sponsor.personId);
    for (const rep of sponsor.representatives || []) ids.add(rep.userId);
  }
  return ids;
}

export function syncSponsorRepJudges(
  record: EventRecord,
  added: string[],
  removedCandidates: string[],
  statusByUserId?: Map<string, RoleStatus>
) {
  if (!isCompetitionEvent(record.event.type)) return;
  const stillReps = getSponsorRepUserIds(record.sponsors);
  const existing = new Set(record.judges.map((j) => j.userId));
  for (const userId of added) {
    if (!existing.has(userId)) {
      record.judges.push({
        id: newId(),
        userId,
        role: null,
        status: statusByUserId?.get(userId) ?? "confirmed",
        sortOrder: record.judges.length,
      });
      existing.add(userId);
    }
  }
  for (const userId of removedCandidates) {
    if (!stillReps.has(userId)) {
      record.judges = record.judges.filter((j) => j.userId !== userId);
    }
  }
}

// ─── Build derived public data ───────────────────────────────────────────────

function personMap(): Map<string, Person> {
  return new Map(listPeople().map((p) => [p.id, p]));
}

function companyMap(): Map<string, Company> {
  return new Map(listCompanies().map((c) => [c.id, c]));
}

function displayCompany(person: Person, companies: Map<string, Company>): string | null {
  return person.companyName || (person.companyId ? companies.get(person.companyId)?.name ?? null : null);
}

export function buildPublicEventDetail(record: EventRecord) {
  const people = personMap();
  const companies = companyMap();
  const { event } = record;
  const settings = getSiteSettings();

  const sponsors = sortByOrder(record.sponsors.filter((s) => isConfirmed(s.status))).map((sponsor) => {
    const company = companies.get(sponsor.companyId);
    const reps = [
      ...(sponsor.representatives || [])
        .filter((r) => isConfirmed(r.status))
        .map((r) => {
          const person = people.get(r.userId);
          return person
            ? {
                username: person.username,
                linkedin: person.linkedin,
                role: person.title,
                companyName: displayCompany(person, companies) || company?.name || null,
              }
            : null;
        }),
      ...(sponsor.personId && people.get(sponsor.personId)
        ? [
            {
              username: people.get(sponsor.personId)!.username,
              linkedin: people.get(sponsor.personId)!.linkedin,
              role: people.get(sponsor.personId)!.title,
              companyName: company?.name || null,
            },
          ]
        : []),
    ].filter(Boolean) as {
      username: string;
      linkedin: string | null;
      role: string | null;
      companyName: string | null;
    }[];

    const seen = new Set<string>();
    const uniqueReps = reps.filter((r) => {
      const key = r.username.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      id: sponsor.id,
      companyName: company?.name || "Unknown",
      companyWebsite: company?.website || null,
      companyLogo: company?.logoUrl || null,
      companyDescription: company?.information || null,
      representatives: uniqueReps,
    };
  });

  const partners = sortByOrder(record.partners.filter((p) => isConfirmed(p.status))).map((p) => {
    const company = p.companyId ? companies.get(p.companyId) : null;
    const representatives = (p.representatives || [])
      .filter((r) => isConfirmed(r.status))
      .map((r) => {
        const person = people.get(r.userId);
        return person
          ? {
              username: person.username,
              linkedin: person.linkedin,
              role: person.title,
              companyName: displayCompany(person, companies) || company?.name || null,
            }
          : null;
      })
      .filter(Boolean) as {
      username: string;
      linkedin: string | null;
      role: string | null;
      companyName: string | null;
    }[];
    return {
      id: p.id,
      partnerType: p.partnerType,
      customType: p.customType,
      companyName: company?.name || p.customName || representatives[0]?.username || null,
      companyWebsite: company?.website || null,
      companyLogo: company?.logoUrl || null,
      companyDescription: company?.information || null,
      representatives,
    };
  });

  const prizes = isCompetitionEvent(event.type)
    ? sortByOrder(record.prizes).map((p) => ({
        placement: p.placement,
        customLabel: p.customLabel,
        prizeName: p.prizeName,
        amount: p.amount,
        currency: p.currency,
        companyName: p.companyId ? companies.get(p.companyId)?.name || null : null,
      }))
    : [];

  const schedule = record.schedule
    .filter((s) => !s.isSkipped)
    .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.sortOrder - b.sortOrder)
    .map((item) => ({
      id: item.id,
      startTime: item.startTime,
      endTime: item.endTime,
      topic: item.topic,
      speakers: (item.speakers || [])
        .map((s) => {
          const person = people.get(s.userId);
          return person ? { username: person.username, linkedin: person.linkedin } : null;
        })
        .filter(Boolean),
    }));

  const speakers = record.speakers
    .filter((s) => !s.isSkipped && isConfirmed(s.status))
    .sort(
      (a, b) =>
        (a.startTime || "").localeCompare(b.startTime || "") ||
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    )
    .map((s) => {
      const person = people.get(s.userId);
      return {
        username: person?.username || "Unknown",
        linkedin: person?.linkedin || null,
        eventDay: s.eventDay,
        startTime: s.startTime,
        endTime: s.endTime,
        topic: s.topic,
        title: person?.title || null,
        companyName: person ? displayCompany(person, companies) : null,
      };
    });

  const judges = isCompetitionEvent(event.type)
    ? sortByOrder(record.judges.filter((j) => isConfirmed(j.status))).map((j) => {
        const person = people.get(j.userId);
        return {
          username: person?.username || "Unknown",
          linkedin: person?.linkedin || null,
          role: j.role,
          title: person?.title || null,
          companyName: person ? displayCompany(person, companies) : null,
        };
      })
    : [];

  const confirmedHosts = sortByOrder(record.hosts.filter((h) => isConfirmed(h.status)));
  const toPublicHost = (h: (typeof confirmedHosts)[number]) => {
    const person = people.get(h.userId);
    const subRole = h.role?.trim() || null;
    return {
      username: person?.username || "Unknown",
      linkedin: person?.linkedin || null,
      hostType: h.hostType,
      customType: h.customType,
      role: subRole && subRoleIsVisible(subRole, settings.subRoles) ? subRole : null,
      title: person?.title || null,
      companyName: person ? displayCompany(person, companies) : null,
    };
  };
  const hosts = confirmedHosts.filter((h) => h.hostType !== "volunteer").map(toPublicHost);
  const volunteers = confirmedHosts.filter((h) => h.hostType === "volunteer").map(toPublicHost);

  const team = sortByOrder(record.staffRoles)
    .filter((s) => isConfirmed(s.status) && subRoleIsVisible(s.roleKey, settings.subRoles))
    .map((s) => {
      const person = people.get(s.userId);
      return {
        username: person?.username || "Unknown",
        linkedin: person?.linkedin || null,
        subRole: s.roleKey,
        title: person?.title || null,
        companyName: person ? displayCompany(person, companies) : null,
      };
    });

  return {
    event,
    tracks: isCompetitionEvent(event.type) ? record.tracks : [],
    sponsors,
    partners,
    prizes,
    schedule,
    speakers,
    judges,
    hosts,
    volunteers,
    team,
    links: record.links,
    photos: record.photos,
  };
}

type EventRef = {
  eventName: string;
  slug: string;
  eventDate: string;
  companyName?: string | null;
};

function buildPeoplePublic() {
  const companies = companyMap();
  const events = listEventRecords().filter((e) => e.event.isPublished);

  return listPeople()
    .map((person) => {
      const judged: EventRef[] = [];
      const spoke: EventRef[] = [];
      const sponsored: EventRef[] = [];
      const hosted: EventRef[] = [];
      const partnered: EventRef[] = [];
      const volunteered: EventRef[] = [];

      for (const record of events) {
        const ref: EventRef = {
          eventName: record.event.name,
          slug: record.event.slug,
          eventDate: record.event.eventDate,
        };
        if (record.judges.some((j) => j.userId === person.id && isConfirmed(j.status))) judged.push(ref);
        if (record.speakers.some((s) => s.userId === person.id && isConfirmed(s.status))) spoke.push(ref);
        for (const s of record.sponsors) {
          if (!isConfirmed(s.status)) continue;
          const isRep =
            s.personId === person.id ||
            s.representatives?.some((r) => r.userId === person.id && isConfirmed(r.status));
          if (!isRep) continue;
          const company = companies.get(s.companyId);
          sponsored.push({
            ...ref,
            companyName: company?.name || null,
          });
        }
        for (const p of record.partners) {
          if (!isConfirmed(p.status)) continue;
          const isRep = p.representatives?.some(
            (r) => r.userId === person.id && isConfirmed(r.status)
          );
          if (!isRep) continue;
          const company = p.companyId ? companies.get(p.companyId) : null;
          partnered.push({
            ...ref,
            companyName: company?.name || p.customName || null,
          });
        }
        for (const h of record.hosts) {
          if (h.userId !== person.id || !isConfirmed(h.status)) continue;
          if (h.hostType === "volunteer") volunteered.push(ref);
          else if (h.hostType === "venue_partner") partnered.push(ref);
          else hosted.push(ref);
        }
      }

      return {
        id: person.id,
        username: person.username,
        linkedin: person.linkedin,
        title: person.title,
        companyName: displayCompany(person, companies),
        judged,
        spoke,
        sponsored,
        hosted,
        partnered,
        volunteered,
      };
    })
    .filter(
      (p) =>
        p.judged.length > 0 ||
        p.spoke.length > 0 ||
        p.sponsored.length > 0 ||
        p.hosted.length > 0 ||
        p.partnered.length > 0 ||
        p.volunteered.length > 0
    );
}

function buildSponsorsPublic() {
  const events = listEventRecords().filter((e) => e.event.isPublished);
  const companies = companyMap();

  type PublicCompany = {
    id: string;
    name: string;
    logoUrl: string | null;
    website: string | null;
  };

  const sponsors = new Map<string, PublicCompany>();
  const partnersByType = new Map<string, Map<string, PublicCompany>>();

  const toPublic = (c: Company): PublicCompany => ({
    id: c.id,
    name: c.name,
    logoUrl: c.logoUrl,
    website: c.website,
  });

  for (const record of events) {
    for (const s of record.sponsors) {
      if (!isConfirmed(s.status)) continue;
      const c = companies.get(s.companyId);
      if (c) sponsors.set(c.id, toPublic(c));
    }
    for (const p of record.partners) {
      if (!isConfirmed(p.status) || !p.companyId) continue;
      const c = companies.get(p.companyId);
      if (!c) continue;
      const typeKey = p.partnerType || "other";
      if (!partnersByType.has(typeKey)) partnersByType.set(typeKey, new Map());
      partnersByType.get(typeKey)!.set(c.id, toPublic(c));
    }
  }

  const partnerTypeOrder = [
    "venue",
    "ventures",
    "community",
    "media",
    "food",
    "other",
    "custom",
  ];

  const partners = partnerTypeOrder
    .filter((type) => (partnersByType.get(type)?.size || 0) > 0)
    .map((type) => ({
      partnerType: type,
      companies: [...(partnersByType.get(type)?.values() || [])].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }));

  // Any unexpected types
  for (const [type, map] of partnersByType) {
    if (partnerTypeOrder.includes(type) || map.size === 0) continue;
    partners.push({
      partnerType: type,
      companies: [...map.values()].sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  return {
    sponsors: [...sponsors.values()].sort((a, b) => a.name.localeCompare(b.name)),
    partners,
    // Legacy keys for older clients
    venuePartners: partners.find((p) => p.partnerType === "venue")?.companies || [],
    communityPartners: partners
      .filter((p) => p.partnerType !== "venue")
      .flatMap((p) => p.companies),
  };
}

function normalizeEmailTemplates(
  raw: Partial<SiteSettings["emailTemplates"]> | undefined
): SiteSettings["emailTemplates"] {
  const certKeys = new Set([
    "judgeCertification",
    "speakerCertification",
    "judgeSpeakerCertification",
  ] as const);

  const pick = (
    key: keyof typeof DEFAULT_EMAIL_TEMPLATES,
    value: { subject?: string; body?: string; certificateText?: string } | undefined
  ): EmailTemplateDraft => {
    const def = DEFAULT_EMAIL_TEMPLATES[key];
    const draft: EmailTemplateDraft = {
      subject: (value?.subject ?? def.subject).trim() || def.subject,
      body: (value?.body ?? def.body).trim() || def.body,
    };
    if ((certKeys as Set<string>).has(key)) {
      draft.certificateText =
        (value?.certificateText ?? def.certificateText ?? "").trim() ||
        def.certificateText ||
        "";
    }
    return draft;
  };
  return {
    sponsorshipRequest: pick("sponsorshipRequest", raw?.sponsorshipRequest),
    speakerInvite: pick("speakerInvite", raw?.speakerInvite),
    judgeInvite: pick("judgeInvite", raw?.judgeInvite),
    judgeSpeakerInvite: pick("judgeSpeakerInvite", raw?.judgeSpeakerInvite),
    judgeCertification: pick("judgeCertification", raw?.judgeCertification),
    speakerCertification: pick("speakerCertification", raw?.speakerCertification),
    judgeSpeakerCertification: pick(
      "judgeSpeakerCertification",
      raw?.judgeSpeakerCertification
    ),
  };
}

function normalizeSmtpAccount(
  raw: Partial<SmtpAccount> | undefined,
  previous?: SmtpAccount
): SmtpAccount {
  const base = previous || { user: "", pass: "" };
  return {
    user: (raw?.user ?? base.user).trim(),
    pass: raw?.pass === undefined ? base.pass : String(raw.pass).trim(),
  };
}

function isLegacyZohoSmtp(raw?: Partial<SmtpSettings>): boolean {
  const provider = String(raw?.provider || "").toLowerCase();
  const host = String(raw?.host || "").toLowerCase();
  return provider === "zoho" || host.includes("zoho");
}

function envSmtpAccount(kind: "gmail" | "brevo"): SmtpAccount {
  if (kind === "brevo") {
    return {
      user: (process.env.BREVO_SMTP_USER || "").trim(),
      pass: (process.env.BREVO_SMTP_KEY || process.env.BREVO_SMTP_PASS || "").trim(),
    };
  }
  return {
    user: (process.env.GMAIL_SMTP_USER || "").trim(),
    pass: (process.env.GMAIL_SMTP_PASS || "").trim(),
  };
}

function fillEmptyAccount(account: SmtpAccount, fallback: SmtpAccount): SmtpAccount {
  return {
    user: account.user || fallback.user,
    pass: account.pass || fallback.pass,
  };
}

function normalizeSmtp(raw: Partial<SmtpSettings> | undefined, previous?: SmtpSettings): SmtpSettings {
  const base = previous || DEFAULT_SMTP_SETTINGS;
  const zohoLeftover = isLegacyZohoSmtp(raw) && !raw?.gmail && !raw?.brevo;
  const provider =
    parseSmtpProvider(raw?.provider) ||
    (zohoLeftover ? parseSmtpProvider(process.env.SMTP_PROVIDER) || "gmail" : null) ||
    inferSmtpProvider(raw?.host ?? base.host);

  const legacyUser = (raw?.user ?? "").trim();
  const legacyPass =
    raw?.pass === undefined ? undefined : String(raw.pass).trim();

  let gmail = normalizeSmtpAccount(raw?.gmail, base.gmail);
  let brevo = normalizeSmtpAccount(raw?.brevo, base.brevo);

  // Older single user/pass blob → the selected account (never copy Zoho leftovers).
  if (!zohoLeftover && !raw?.gmail && !raw?.brevo && (legacyUser || legacyPass !== undefined)) {
    const target = provider === "brevo" ? "brevo" : "gmail";
    const merged = {
      user: legacyUser || (target === "brevo" ? brevo.user : gmail.user),
      pass: legacyPass !== undefined ? legacyPass : (target === "brevo" ? brevo.pass : gmail.pass),
    };
    if (target === "brevo") brevo = merged;
    else gmail = merged;
  }

  const preset = SMTP_PROVIDER_PRESETS[provider];
  const active = provider === "brevo" ? brevo : gmail;
  return {
    provider,
    host: preset.host,
    port: preset.port,
    user: active.user,
    pass: active.pass,
    from:
      (raw?.from ?? base.from).trim() ||
      "Crewbase Collective <events@crewbasecollective.com>",
    notifyEmail: (raw?.notifyEmail ?? base.notifyEmail).trim(),
    gmail,
    brevo,
  };
}

/** Empty Settings fields pick up matching server/.env values (same names as the form). */
function smtpWithEnvFallbacks(smtp: SmtpSettings): SmtpSettings {
  const envProvider = parseSmtpProvider(process.env.SMTP_PROVIDER);
  const provider = parseSmtpProvider(smtp.provider) || envProvider || "gmail";
  const envActiveUser = (process.env.SMTP_USER || "").trim();
  const envActivePass = (process.env.SMTP_PASS || "").trim();
  const gmail = fillEmptyAccount(smtp.gmail, {
    ...envSmtpAccount("gmail"),
    ...(provider === "gmail" ? { user: envSmtpAccount("gmail").user || envActiveUser, pass: envSmtpAccount("gmail").pass || envActivePass } : {}),
  });
  const brevo = fillEmptyAccount(smtp.brevo, {
    ...envSmtpAccount("brevo"),
    ...(provider === "brevo" ? { user: envSmtpAccount("brevo").user || envActiveUser, pass: envSmtpAccount("brevo").pass || envActivePass } : {}),
  });
  const preset = SMTP_PROVIDER_PRESETS[provider];
  const active = provider === "brevo" ? brevo : gmail;
  return {
    provider,
    host: preset.host,
    port: preset.port,
    user: active.user,
    pass: active.pass,
    from: smtp.from || (process.env.SMTP_FROM || "").trim() || smtp.from,
    notifyEmail: smtp.notifyEmail || (process.env.NOTIFY_EMAIL || "").trim(),
    gmail,
    brevo,
  };
}

export function getSiteSettings(): SiteSettings {
  ensureDirs();
  const raw = readJson<
    Partial<SiteSettings> & { personRoles?: string[]; personTags?: string[] }
  >(settingsPath(), {});

  const communityLinks = {
    ...DEFAULT_SITE_SETTINGS.communityLinks,
    ...(raw.communityLinks || {}),
  };
  const emailTemplates = normalizeEmailTemplates(raw.emailTemplates);
  const smtp = smtpWithEnvFallbacks(normalizeSmtp(raw.smtp));

  if (Array.isArray(raw.subRoles) && raw.subRoles.length) {
    return {
      subRoles: normalizeSubRoles(raw.subRoles),
      communityLinks,
      smtp,
      emailTemplates,
    };
  }

  const legacy = Array.isArray(raw.personRoles)
    ? raw.personRoles
    : Array.isArray(raw.personTags)
      ? raw.personTags
      : [];
  const migratedSubRoles = legacy
    .map((item) => String(item).trim())
    .filter((key) => key && !isFixedPersonRole(key))
    .map((key) => ({
      key,
      visible: !NON_VISIBLE_SUB_ROLE_KEYS.has(key.toLowerCase()),
    }));

  return {
    subRoles: migratedSubRoles.length ? migratedSubRoles : [...DEFAULT_SITE_SETTINGS.subRoles],
    communityLinks,
    smtp,
    emailTemplates,
  };
}

function isFixedPersonRole(value: string): boolean {
  const t = value.trim().toLowerCase();
  return FIXED_PERSON_ROLES.some((r) => r.toLowerCase() === t);
}

const NON_VISIBLE_SUB_ROLE_KEYS = new Set(
  DEFAULT_SITE_SETTINGS.subRoles.filter((s) => !s.visible).map((s) => s.key.toLowerCase())
);

export function saveSiteSettings(patch: Partial<SiteSettings>): SiteSettings {
  const current = getSiteSettings();
  const next: SiteSettings = {
    subRoles: patch.subRoles ? normalizeSubRoles(patch.subRoles) : current.subRoles,
    communityLinks: {
      ...current.communityLinks,
      ...(patch.communityLinks || {}),
    },
    smtp: patch.smtp ? normalizeSmtp(patch.smtp, current.smtp) : current.smtp,
    emailTemplates: patch.emailTemplates
      ? normalizeEmailTemplates(patch.emailTemplates)
      : current.emailTemplates,
  };
  writeJson(settingsPath(), next);
  return next;
}

/** CMS-only settings payload. SMTP password is included so it can be viewed/edited locally. */
export function publicAdminSettings() {
  const settings = getSiteSettings();
  return {
    ...settings,
    smtp: {
      provider: settings.smtp.provider,
      host: settings.smtp.host,
      port: settings.smtp.port,
      user: settings.smtp.user,
      pass: settings.smtp.pass,
      from: settings.smtp.from,
      notifyEmail: settings.smtp.notifyEmail,
      gmail: settings.smtp.gmail,
      brevo: settings.smtp.brevo,
    },
    smtpPasswordSet: Boolean(settings.smtp.pass),
  };
}

function copyImagesToPublic() {
  ensureDirs();
  if (!fs.existsSync(IMAGES_DIR)) return;
  const copyRecursive = (src: string, dest: string) => {
    if (!fs.existsSync(src)) return;
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      for (const entry of fs.readdirSync(src)) {
        copyRecursive(path.join(src, entry), path.join(dest, entry));
      }
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  };
  copyRecursive(IMAGES_DIR, PUBLIC_IMAGES_DIR);
}

export function buildDerivedData() {
  ensureDirs();
  const events = listEventRecords();
  const published = events.filter((e) => e.event.isPublished);

  writeJson(path.join(PUBLIC_DATA_DIR, "events-index.json"), {
    events: published.map((r) => r.event),
  });

  const eventsOut = path.join(PUBLIC_DATA_DIR, "events");
  fs.mkdirSync(eventsOut, { recursive: true });
  for (const f of fs.readdirSync(eventsOut)) {
    if (f.endsWith(".json")) fs.unlinkSync(path.join(eventsOut, f));
  }
  for (const record of published) {
    writeJson(path.join(eventsOut, `${record.event.slug}.json`), buildPublicEventDetail(record));
  }

  writeJson(path.join(PUBLIC_DATA_DIR, "sponsors.json"), buildSponsorsPublic());

  writeJson(path.join(PUBLIC_DATA_DIR, "people.json"), {
    people: buildPeoplePublic(),
  });

  writeJson(path.join(PUBLIC_DATA_DIR, "community-links.json"), getSiteSettings().communityLinks);

  copyImagesToPublic();
}

export function adminEventDetail(record: EventRecord) {
  const people = personMap();
  const companies = companyMap();

  const sponsors = sortByOrder(record.sponsors).map((sponsor) => {
    const company = companies.get(sponsor.companyId);
    const reps = [
      ...(sponsor.representatives || []).map((r) => ({
        eventSponsorId: sponsor.id,
        userId: r.userId,
        username: people.get(r.userId)?.username || "Unknown",
        linkedin: people.get(r.userId)?.linkedin || null,
        status: r.status,
      })),
      ...(sponsor.personId
        ? [
            {
              eventSponsorId: sponsor.id,
              userId: sponsor.personId,
              username: people.get(sponsor.personId)?.username || "Unknown",
              linkedin: people.get(sponsor.personId)?.linkedin || null,
              status: "confirmed" as const,
            },
          ]
        : []),
    ].filter(
      (r, i, all) => all.findIndex((c) => c.userId === r.userId) === i
    );

    return {
      id: sponsor.id,
      companyId: sponsor.companyId,
      personId: sponsor.personId,
      status: sponsor.status,
      sortOrder: sponsor.sortOrder,
      companyName: company?.name || null,
      companyWebsite: company?.website || null,
      companyLogo: company?.logoUrl || null,
      companyInformation: company?.information || null,
      personName: sponsor.personId ? people.get(sponsor.personId)?.username || null : null,
      representatives: reps,
    };
  });

  const partners = sortByOrder(record.partners).map((p) => {
    const company = p.companyId ? companies.get(p.companyId) : null;
    const representatives = (p.representatives || []).map((r) => ({
      userId: r.userId,
      username: people.get(r.userId)?.username || "Unknown",
      linkedin: people.get(r.userId)?.linkedin || null,
      status: r.status,
    }));
    const fallbackName =
      p.customName ||
      representatives[0]?.username ||
      null;
    return {
      ...p,
      representatives,
      eventId: record.event.id,
      createdAt: record.event.createdAt,
      companyName: company?.name || fallbackName,
      companyWebsite: company?.website || null,
      companyLogo: company?.logoUrl || null,
      companyInformation: company?.information || null,
    };
  });

  const speakers = sortByOrder(record.speakers).map((s) => ({
    ...s,
    username: people.get(s.userId)?.username || "Unknown",
    linkedin: people.get(s.userId)?.linkedin || null,
  }));

  const judges = sortByOrder(record.judges).map((j) => ({
    ...j,
    username: people.get(j.userId)?.username || "Unknown",
    linkedin: people.get(j.userId)?.linkedin || null,
  }));

  const allHosts = sortByOrder(record.hosts).map((h) => ({
    ...h,
    username: people.get(h.userId)?.username || "Unknown",
    linkedin: people.get(h.userId)?.linkedin || null,
  }));
  const hosts = allHosts.filter((h) => h.hostType !== "volunteer");
  const volunteers = allHosts.filter((h) => h.hostType === "volunteer");

  const associated = sortByOrder(record.associated || []).map((a) => ({
    ...a,
    username: people.get(a.userId)?.username || "Unknown",
    linkedin: people.get(a.userId)?.linkedin || null,
  }));

  const staffRoles = sortByOrder(record.staffRoles).map((r) => ({
    ...r,
    username: people.get(r.userId)?.username || "Unknown",
    linkedin: people.get(r.userId)?.linkedin || null,
  }));

  const schedule = sortByOrder(record.schedule).map((item) => ({
    ...item,
    speakers: (item.speakers || []).map((s) => ({
      ...s,
      username: people.get(s.userId)?.username || "Unknown",
    })),
  }));

  return {
    imageFolder: eventImageFolder(record.event.name),
    tracks: sortByOrder(record.tracks),
    sponsors,
    partners,
    prizes: sortByOrder(record.prizes),
    schedule,
    speakers,
    judges,
    hosts,
    volunteers,
    associated,
    staffRoles,
    links: sortByOrder(record.links),
    photos: sortByOrder(record.photos),
    liveState: record.liveState,
  };
}
