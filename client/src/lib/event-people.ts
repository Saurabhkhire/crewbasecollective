import { FIXED_PERSON_ROLES, MAIN_ROLES_WITH_SUB_ROLES } from "@/lib/roles";

export const EVENT_MAIN_ROLES = [...FIXED_PERSON_ROLES] as const;

export type EventPersonAssignment = {
  key: string;
  entity: string;
  entityId: string;
  mainRole: string;
  subRole: string | null;
  status: string;
  companyId?: string | null;
  companyName?: string | null;
};

/** One row per person — all their event roles aggregated. */
export type EventPersonGroup = {
  userId: string;
  username: string;
  linkedin?: string | null;
  mainRoles: string[];
  subRoles: string[];
  statuses: string[];
  assignments: EventPersonAssignment[];
};

type Item = { id: string; [key: string]: unknown };

interface EventPeopleData {
  sponsors: Item[];
  partners: Item[];
  speakers: Item[];
  judges: Item[];
  hosts: Item[];
  volunteers: Item[];
  associated?: Item[];
  staffRoles: Item[];
}

function splitSubRoles(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildEventPeopleRows(data: EventPeopleData): EventPersonAssignment[] {
  const rows: EventPersonAssignment[] = [];

  for (const j of data.judges) {
    rows.push({
      key: `judge-${j.id}`,
      entity: "judge",
      entityId: j.id as string,
      mainRole: "judge",
      subRole: null,
      status: (j.status as string) || "confirmed",
    });
  }

  for (const s of data.speakers) {
    rows.push({
      key: `speaker-${s.id}`,
      entity: "speaker",
      entityId: s.id as string,
      mainRole: "speaker",
      subRole: null,
      status: (s.status as string) || "confirmed",
    });
  }

  for (const h of data.hosts) {
    rows.push({
      key: `host-${h.id}`,
      entity: "host",
      entityId: h.id as string,
      mainRole: "host",
      subRole: (h.role as string) || null,
      status: (h.status as string) || "confirmed",
    });
  }

  for (const v of data.volunteers) {
    rows.push({
      key: `volunteer-${v.id}`,
      entity: "host",
      entityId: v.id as string,
      mainRole: "volunteer",
      subRole: (v.role as string) || null,
      status: (v.status as string) || "confirmed",
    });
  }

  for (const a of data.associated || []) {
    rows.push({
      key: `associated-${a.id}`,
      entity: "associated",
      entityId: a.id as string,
      mainRole: "associated",
      subRole: (a.role as string) || null,
      status: (a.status as string) || "confirmed",
    });
  }

  for (const sponsor of data.sponsors) {
    const reps = Array.isArray(sponsor.representatives) ? (sponsor.representatives as Item[]) : [];
    for (const rep of reps) {
      rows.push({
        key: `sponsor-rep-${sponsor.id}-${rep.userId}`,
        entity: "sponsor",
        entityId: sponsor.id as string,
        mainRole: "sponsor representative",
        subRole: null,
        status: (rep.status as string) || "confirmed",
        companyId: (sponsor.companyId as string) || null,
        companyName: (sponsor.companyName as string) || null,
      });
    }
  }

  for (const partner of data.partners) {
    const reps = Array.isArray(partner.representatives) ? (partner.representatives as Item[]) : [];
    for (const rep of reps) {
      rows.push({
        key: `partner-rep-${partner.id}-${rep.userId}`,
        entity: "partner",
        entityId: partner.id as string,
        mainRole: "partner representative",
        subRole: null,
        status: (rep.status as string) || "confirmed",
        companyId: (partner.companyId as string) || null,
        companyName: (partner.companyName as string) || (partner.customName as string) || null,
      });
    }
  }

  // Legacy staff rows — show as informational only (no sub-role UI going forward)
  for (const sr of data.staffRoles) {
    rows.push({
      key: `staff-${sr.id}`,
      entity: "staff_role",
      entityId: sr.id as string,
      mainRole: "other",
      subRole: (sr.roleKey as string) || null,
      status: (sr.status as string) || "confirmed",
    });
  }

  return rows;
}

export function buildEventPeopleGroups(
  data: EventPeopleData,
  people: { id: string; username: string; linkedin?: string | null }[]
): EventPersonGroup[] {
  const byUser = new Map<
    string,
    {
      userId: string;
      username: string;
      linkedin?: string | null;
      assignments: (EventPersonAssignment & { userId: string })[];
    }
  >();

  const ensure = (userId: string, username: string, linkedin?: string | null) => {
    let group = byUser.get(userId);
    if (!group) {
      const person = people.find((p) => p.id === userId);
      group = {
        userId,
        username: person?.username || username,
        linkedin: person?.linkedin ?? linkedin,
        assignments: [],
      };
      byUser.set(userId, group);
    }
    return group;
  };

  for (const j of data.judges) {
    const g = ensure(j.userId as string, (j.username as string) || "Unknown", j.linkedin as string);
    g.assignments.push({
      key: `judge-${j.id}`,
      entity: "judge",
      entityId: j.id as string,
      userId: j.userId as string,
      mainRole: "judge",
      subRole: null,
      status: (j.status as string) || "confirmed",
    });
  }

  for (const s of data.speakers) {
    const g = ensure(s.userId as string, (s.username as string) || "Unknown", s.linkedin as string);
    g.assignments.push({
      key: `speaker-${s.id}`,
      entity: "speaker",
      entityId: s.id as string,
      userId: s.userId as string,
      mainRole: "speaker",
      subRole: null,
      status: (s.status as string) || "confirmed",
    });
  }

  for (const h of data.hosts) {
    const g = ensure(h.userId as string, (h.username as string) || "Unknown", h.linkedin as string);
    g.assignments.push({
      key: `host-${h.id}`,
      entity: "host",
      entityId: h.id as string,
      userId: h.userId as string,
      mainRole: "host",
      subRole: (h.role as string) || null,
      status: (h.status as string) || "confirmed",
    });
  }

  for (const v of data.volunteers) {
    const g = ensure(v.userId as string, (v.username as string) || "Unknown", v.linkedin as string);
    g.assignments.push({
      key: `volunteer-${v.id}`,
      entity: "host",
      entityId: v.id as string,
      userId: v.userId as string,
      mainRole: "volunteer",
      subRole: (v.role as string) || null,
      status: (v.status as string) || "confirmed",
    });
  }

  for (const a of data.associated || []) {
    const g = ensure(a.userId as string, (a.username as string) || "Unknown", a.linkedin as string);
    g.assignments.push({
      key: `associated-${a.id}`,
      entity: "associated",
      entityId: a.id as string,
      userId: a.userId as string,
      mainRole: "associated",
      subRole: (a.role as string) || null,
      status: (a.status as string) || "confirmed",
    });
  }

  for (const sponsor of data.sponsors) {
    const reps = Array.isArray(sponsor.representatives) ? (sponsor.representatives as Item[]) : [];
    for (const rep of reps) {
      const g = ensure(
        rep.userId as string,
        (rep.username as string) || "Unknown",
        rep.linkedin as string
      );
      g.assignments.push({
        key: `sponsor-rep-${sponsor.id}-${rep.userId}`,
        entity: "sponsor",
        entityId: sponsor.id as string,
        userId: rep.userId as string,
        mainRole: "sponsor representative",
        subRole: null,
        status: (rep.status as string) || "confirmed",
        companyId: (sponsor.companyId as string) || null,
        companyName: (sponsor.companyName as string) || null,
      });
    }
  }

  for (const partner of data.partners) {
    const reps = Array.isArray(partner.representatives) ? (partner.representatives as Item[]) : [];
    for (const rep of reps) {
      const g = ensure(
        rep.userId as string,
        (rep.username as string) || "Unknown",
        rep.linkedin as string
      );
      g.assignments.push({
        key: `partner-rep-${partner.id}-${rep.userId}`,
        entity: "partner",
        entityId: partner.id as string,
        userId: rep.userId as string,
        mainRole: "partner representative",
        subRole: null,
        status: (rep.status as string) || "confirmed",
        companyId: (partner.companyId as string) || null,
        companyName: (partner.companyName as string) || (partner.customName as string) || null,
      });
    }
  }

  for (const sr of data.staffRoles) {
    const g = ensure(sr.userId as string, (sr.username as string) || "Unknown", sr.linkedin as string);
    g.assignments.push({
      key: `staff-${sr.id}`,
      entity: "staff_role",
      entityId: sr.id as string,
      userId: sr.userId as string,
      mainRole: "other",
      subRole: (sr.roleKey as string) || null,
      status: (sr.status as string) || "confirmed",
    });
  }

  return [...byUser.values()]
    .map((g) => {
      const mainRoles = [...new Set(g.assignments.map((a) => a.mainRole))];
      const subRoles = [
        ...new Set(
          g.assignments
            .filter((a) => MAIN_ROLES_WITH_SUB_ROLES.has(a.mainRole))
            .flatMap((a) => splitSubRoles(a.subRole))
        ),
      ];
      return {
        userId: g.userId,
        username: g.username,
        linkedin: g.linkedin,
        mainRoles,
        subRoles,
        statuses: [...new Set(g.assignments.map((a) => a.status))],
        assignments: g.assignments,
      };
    })
    .sort((a, b) => a.username.localeCompare(b.username));
}
