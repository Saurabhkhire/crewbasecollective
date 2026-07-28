import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  type CompaniesFile,
  type Company,
  type EventRecord,
  type EventSponsor,
  type EventType,
  type PeopleFile,
  type Person,
  dayLabelFromDate,
  emptyEvent,
  isCompetitionEvent,
  newId,
  nowIso,
  slugify,
} from "./types.js";

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

function eventPath(id: string) {
  return path.join(EVENTS_DIR, `${id}.json`);
}

// ─── Companies ───────────────────────────────────────────────────────────────

export function listCompanies(): Company[] {
  ensureDirs();
  return readJson<CompaniesFile>(companiesPath(), { companies: [] }).companies;
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
  return readJson<PeopleFile>(peoplePath(), { people: [] }).people;
}

export function savePeople(people: Person[]) {
  ensureDirs();
  writeJson(peoplePath(), { people });
}

export function createPerson(
  input: Omit<Person, "id" | "createdAt" | "updatedAt" | "role" | "companyId"> & {
    companyName?: string | null;
  }
): Person {
  const people = listPeople();
  const company = resolveExistingCompanyName(input.companyName);
  const ts = nowIso();
  const row: Person = {
    id: newId(),
    username: input.username,
    email: input.email ?? null,
    linkedin: input.linkedin ?? null,
    role: "participant",
    title: input.title ?? null,
    phone: input.phone ?? null,
    companyId: company.companyId,
    companyName: company.companyName,
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
  let companyId = patch.companyId ?? people[idx].companyId;
  let companyName = patch.companyName !== undefined ? patch.companyName : people[idx].companyName;
  if (patch.companyName !== undefined) {
    const resolved = resolveExistingCompanyName(patch.companyName);
    companyId = resolved.companyId;
    companyName = resolved.companyName;
  }
  people[idx] = {
    ...people[idx],
    ...patch,
    id,
    companyId,
    companyName,
    updatedAt: nowIso(),
  };
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

// ─── Events ──────────────────────────────────────────────────────────────────

export function listEventRecords(): EventRecord[] {
  ensureDirs();
  if (!fs.existsSync(EVENTS_DIR)) return [];
  return fs
    .readdirSync(EVENTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson<EventRecord>(path.join(EVENTS_DIR, f), null as unknown as EventRecord))
    .filter(Boolean)
    .sort((a, b) => (a.event.eventDate < b.event.eventDate ? 1 : -1));
}

export function getEventRecord(id: string): EventRecord | null {
  const file = eventPath(id);
  if (!fs.existsSync(file)) return null;
  return readJson<EventRecord>(file, null as unknown as EventRecord);
}

export function saveEventRecord(record: EventRecord) {
  ensureDirs();
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
    lumaLink: (input.lumaLink as string) ?? null,
    eventbriteLink: (input.eventbriteLink as string) ?? null,
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
  next.isPublished = true;
  record.event = next;
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

export function syncSponsorRepJudges(record: EventRecord, added: string[], removedCandidates: string[]) {
  if (!isCompetitionEvent(record.event.type)) return;
  const stillReps = getSponsorRepUserIds(record.sponsors);
  const existing = new Set(record.judges.map((j) => j.userId));
  for (const userId of added) {
    if (!existing.has(userId)) {
      record.judges.push({ id: newId(), userId, role: null, sortOrder: record.judges.length });
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

  const sponsors = sortByOrder(record.sponsors).map((sponsor) => {
    const company = companies.get(sponsor.companyId);
    const reps = [
      ...(sponsor.representatives || []).map((r) => {
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

  const partners = sortByOrder(record.partners).map((p) => {
    const company = p.companyId ? companies.get(p.companyId) : null;
    return {
      partnerType: p.partnerType,
      customType: p.customType,
      companyName: company?.name || p.customName || null,
      companyWebsite: company?.website || null,
      companyLogo: company?.logoUrl || null,
      companyDescription: company?.information || null,
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
    .filter((s) => !s.isSkipped)
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
    ? sortByOrder(record.judges).map((j) => {
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

  const hosts = sortByOrder(record.hosts).map((h) => {
    const person = people.get(h.userId);
    return {
      username: person?.username || "Unknown",
      linkedin: person?.linkedin || null,
      hostType: h.hostType,
      customType: h.customType,
      role: h.role,
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
    links: record.links,
    photos: record.photos,
  };
}

function buildPeoplePublic() {
  const companies = companyMap();
  const events = listEventRecords().filter((e) => e.event.isPublished);

  return listPeople().map((person) => {
    const judged: { eventName: string; slug: string; eventDate: string }[] = [];
    const spoke: { eventName: string; slug: string; eventDate: string }[] = [];
    const sponsored: { eventName: string; slug: string; eventDate: string }[] = [];
    const hosted: { eventName: string; slug: string; eventDate: string }[] = [];
    const partnered: { eventName: string; slug: string; eventDate: string }[] = [];
    const volunteered: { eventName: string; slug: string; eventDate: string }[] = [];

    for (const record of events) {
      const ref = {
        eventName: record.event.name,
        slug: record.event.slug,
        eventDate: record.event.eventDate,
      };
      if (record.judges.some((j) => j.userId === person.id)) judged.push(ref);
      if (record.speakers.some((s) => s.userId === person.id)) spoke.push(ref);
      for (const item of record.schedule) {
        if (item.speakers?.some((s) => s.userId === person.id) && !spoke.some((s) => s.slug === ref.slug)) {
          spoke.push(ref);
        }
      }
      if (
        record.sponsors.some(
          (s) =>
            s.personId === person.id ||
            s.representatives?.some((r) => r.userId === person.id)
        )
      ) {
        sponsored.push(ref);
      }
      for (const h of record.hosts) {
        if (h.userId !== person.id) continue;
        if (h.hostType === "volunteer") volunteered.push(ref);
        else if (h.hostType === "venue_partner") partnered.push(ref);
        else hosted.push(ref);
      }
    }

    return {
      id: person.id,
      username: person.username,
      email: person.email,
      linkedin: person.linkedin,
      role: person.role,
      title: person.title,
      companyName: displayCompany(person, companies),
      judged,
      spoke,
      sponsored,
      hosted,
      partnered,
      volunteered,
    };
  });
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
  // clear old derived event files
  for (const f of fs.readdirSync(eventsOut)) {
    if (f.endsWith(".json")) fs.unlinkSync(path.join(eventsOut, f));
  }
  for (const record of published) {
    writeJson(path.join(eventsOut, `${record.event.slug}.json`), buildPublicEventDetail(record));
  }

  writeJson(path.join(PUBLIC_DATA_DIR, "sponsors.json"), {
    sponsors: listCompanies().map((c) => ({
      id: c.id,
      name: c.name,
      logoUrl: c.logoUrl,
      website: c.website,
      linkedin: c.linkedin,
      information: c.information,
    })),
  });

  writeJson(path.join(PUBLIC_DATA_DIR, "people.json"), {
    people: buildPeoplePublic(),
  });

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
      })),
      ...(sponsor.personId
        ? [
            {
              eventSponsorId: sponsor.id,
              userId: sponsor.personId,
              username: people.get(sponsor.personId)?.username || "Unknown",
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
      sortOrder: sponsor.sortOrder,
      companyName: company?.name || null,
      companyLogo: company?.logoUrl || null,
      companyInformation: company?.information || null,
      personName: sponsor.personId ? people.get(sponsor.personId)?.username || null : null,
      representatives: reps,
    };
  });

  const partners = sortByOrder(record.partners).map((p) => {
    const company = p.companyId ? companies.get(p.companyId) : null;
    return {
      ...p,
      eventId: record.event.id,
      createdAt: record.event.createdAt,
      companyName: company?.name || null,
      companyLogo: company?.logoUrl || null,
      companyInformation: company?.information || null,
    };
  });

  const speakers = sortByOrder(record.speakers).map((s) => ({
    ...s,
    username: people.get(s.userId)?.username || "Unknown",
  }));

  const judges = sortByOrder(record.judges).map((j) => ({
    ...j,
    username: people.get(j.userId)?.username || "Unknown",
  }));

  const hosts = sortByOrder(record.hosts).map((h) => ({
    ...h,
    username: people.get(h.userId)?.username || "Unknown",
  }));

  const schedule = sortByOrder(record.schedule).map((item) => ({
    ...item,
    speakers: (item.speakers || []).map((s) => ({
      ...s,
      username: people.get(s.userId)?.username || "Unknown",
    })),
  }));

  return {
    tracks: sortByOrder(record.tracks),
    sponsors,
    partners,
    prizes: sortByOrder(record.prizes),
    schedule,
    speakers,
    judges,
    hosts,
    links: sortByOrder(record.links),
    photos: sortByOrder(record.photos),
    liveState: record.liveState,
  };
}
