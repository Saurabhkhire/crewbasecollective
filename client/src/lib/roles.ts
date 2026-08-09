/** Fixed primary roles — not configurable in Settings. */
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

export interface PersonSubRole {
  key: string;
  visible: boolean;
}

export interface SiteRolesSettings {
  subRoles: PersonSubRole[];
}

/** Roles that can take configurable sub-roles on an event. */
export const MAIN_ROLES_WITH_SUB_ROLES = new Set(["host", "volunteer", "associated"]);

/** All main roles selectable when adding someone on an event People tab. */
export const EVENT_ADD_MAIN_ROLES = [...FIXED_PERSON_ROLES] as const;

export function isFixedPersonRole(value: string): boolean {
  const t = value.trim().toLowerCase();
  return FIXED_PERSON_ROLES.some((r) => r.toLowerCase() === t);
}

export function subRoleIsVisible(key: string, subRoles: PersonSubRole[]): boolean {
  const match = subRoles.find((s) => s.key.toLowerCase() === key.trim().toLowerCase());
  return match?.visible === true;
}

export function formatRoleAssignment(role: string, subRole?: string | null): string {
  if (subRole?.trim()) return `${role} · ${subRole}`;
  return role;
}

export function parseMultiJson(json: string | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String).map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export function stringifyMulti(values: string[]): string {
  return JSON.stringify([...new Set(values.map((v) => v.trim()).filter(Boolean))]);
}
