/**
 * Normalize legacy event/person JSON so status, roles, and staffRoles always exist.
 */
import type {
  EventAssociated,
  EventExternal,
  EventHost,
  EventJudge,
  EventPartner,
  EventRecord,
  EventSpeaker,
  EventSponsor,
  EventStaffRole,
  Person,
  PersonRoleAssignment,
  RoleStatus,
} from "./types.js";
import { normalizeRoleStatus } from "./types.js";

function migrateTagsToRoles(person: Person & { tags?: string[] }): PersonRoleAssignment[] {
  if (Array.isArray(person.roles) && person.roles.length) {
    return person.roles.map((r) => ({
      role: String(r.role),
      subRole: r.subRole?.trim() ? String(r.subRole) : null,
      status: normalizeRoleStatus(r.status),
    }));
  }
  const tags = Array.isArray(person.tags) ? person.tags : [];
  return tags.map((role) => ({ role: String(role), subRole: null, status: "no_response" as RoleStatus }));
}

export function normalizePersonRecord(p: Person & { tags?: string[] }): Person {
  return {
    ...p,
    email: p.email ?? null,
    phone: p.phone ?? null,
    notes: p.notes ?? null,
    companyId: p.companyId ?? null,
    companyName: p.companyName ?? null,
    roles: migrateTagsToRoles(p),
  };
}

export function normalizeEventRecord(record: EventRecord): EventRecord {
  const sponsors: EventSponsor[] = (record.sponsors || []).map((s) => ({
    ...s,
    status: normalizeRoleStatus((s as EventSponsor).status),
    representatives: (s.representatives || []).map((r) => ({
      userId: r.userId,
      status: normalizeRoleStatus((r as { status?: RoleStatus }).status),
    })),
  }));

  const partners: EventPartner[] = (record.partners || []).map((p) => ({
    ...p,
    status: normalizeRoleStatus((p as EventPartner).status),
    representatives: ((p as EventPartner).representatives || []).map((r) => ({
      userId: r.userId,
      status: normalizeRoleStatus(r.status),
    })),
  }));

  const speakers: EventSpeaker[] = (record.speakers || []).map((s) => ({
    ...s,
    status: normalizeRoleStatus((s as EventSpeaker).status),
  }));

  const judges: EventJudge[] = (record.judges || []).map((j) => ({
    ...j,
    status: normalizeRoleStatus((j as EventJudge).status),
  }));

  const hosts: EventHost[] = (record.hosts || []).map((h) => ({
    ...h,
    status: normalizeRoleStatus((h as EventHost).status),
  }));

  const staffRoles: EventStaffRole[] = Array.isArray(record.staffRoles)
    ? record.staffRoles.map((r) => ({
        ...r,
        status: normalizeRoleStatus(r.status),
      }))
    : [];

  const legacyExternals: EventExternal[] = Array.isArray(record.externals)
    ? record.externals.map((e) => ({
        ...e,
        role: e.role?.trim() ? e.role.trim() : null,
        status: normalizeRoleStatus(e.status),
      }))
    : [];

  const associated: EventAssociated[] = Array.isArray(record.associated)
    ? record.associated.map((a) => ({
        ...a,
        role: a.role?.trim() ? a.role.trim() : null,
        status: normalizeRoleStatus(a.status),
      }))
    : [];

  // Migrate legacy `externals` → `associated`
  const seenUsers = new Set(associated.map((a) => a.userId));
  for (const e of legacyExternals) {
    if (seenUsers.has(e.userId)) continue;
    seenUsers.add(e.userId);
    associated.push({
      id: e.id,
      userId: e.userId,
      role: e.role,
      status: e.status,
      sortOrder: associated.length,
    });
  }

  return {
    ...record,
    sponsors,
    partners,
    speakers,
    judges,
    hosts,
    externals: [],
    associated,
    staffRoles,
  };
}

export function isConfirmed(status: RoleStatus | undefined | null): boolean {
  return normalizeRoleStatus(status) === "confirmed";
}
