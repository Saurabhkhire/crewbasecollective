import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Mail, ChevronDown } from "lucide-react";
import { MultiFilterSelect, matchesAnyFilter } from "@/components/admin/MultiFilterSelect";
import { SendEmailModal } from "@/components/admin/SendEmailModal";
import { api } from "@/lib/api";
import { externalUrl } from "@/lib/utils";
import {
  EVENT_ADD_MAIN_ROLES,
  MAIN_ROLES_WITH_SUB_ROLES,
  type PersonSubRole,
  parseMultiJson,
  stringifyMulti,
} from "@/lib/roles";

type RoleStatus = "confirmed" | "maybe" | "no_response";

const STATUS_LABELS: Record<RoleStatus, string> = {
  confirmed: "Confirmed",
  maybe: "Maybe",
  no_response: "No response",
};

const STATUS_STYLES: Record<RoleStatus, string> = {
  confirmed: "bg-emerald-900/40 text-emerald-200",
  maybe: "bg-amber-900/40 text-amber-200",
  no_response: "bg-zinc-800 text-zinc-400",
};

interface PersonRoleAssignment {
  role: string;
  subRole?: string | null;
  status: RoleStatus;
}

interface PersonEventRole {
  mainRole: string;
  subRole: string | null;
  status: RoleStatus;
  companyName?: string | null;
}

interface PersonEventInvolvement {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventPublished: boolean;
  roles: PersonEventRole[];
}

interface Person {
  id: string;
  username: string;
  email: string | null;
  linkedin: string | null;
  title: string | null;
  phone: string | null;
  notes: string | null;
  companyId: string | null;
  companyName: string | null;
  roles?: PersonRoleAssignment[];
  mainRoles?: string[];
  subRoles?: string[];
  eventMainRoles?: string[];
  eventInvolvements?: PersonEventInvolvement[];
  createdAt?: string;
}

interface Company {
  id: string;
  name: string;
}

const emptyForm = {
  username: "",
  email: "",
  linkedin: "",
  title: "",
  phone: "",
  notes: "",
  companyId: "",
  companyText: "",
  rolesJson: "[]",
  addRolesJson: "[]",
  addSubRolesJson: "[]",
  addStatus: "confirmed" as RoleStatus,
};

function normalizeStatus(status: string | undefined): RoleStatus {
  return status === "maybe" || status === "no_response" ? status : "confirmed";
}

function parseRolesJson(json: string | undefined): PersonRoleAssignment[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((r) => ({
        role: String(r.role || "").trim(),
        subRole: r.subRole?.trim() ? String(r.subRole).trim() : null,
        status: normalizeStatus(r.status),
      }))
      .filter((r) => r.role);
  } catch {
    return [];
  }
}

export default function AdminPeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [subRoles, setSubRoles] = useState<PersonSubRole[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editEventMainRoles, setEditEventMainRoles] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [mainRoleFilter, setMainRoleFilter] = useState<string[]>([]);
  const [subRoleFilter, setSubRoleFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<RoleStatus[]>(["confirmed"]);
  const [emailPerson, setEmailPerson] = useState<Person | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = async () => {
    setError("");
    try {
      const [peopleRows, companyRows, settings] = await Promise.all([
        api<Person[]>("/api/admin/people"),
        api<Company[]>("/api/admin/companies"),
        api<{ subRoles: PersonSubRole[] }>("/api/admin/settings").catch(() => ({ subRoles: [] })),
      ]);
      setPeople(Array.isArray(peopleRows) ? peopleRows : []);
      setCompanies(Array.isArray(companyRows) ? companyRows : []);
      setSubRoles(Array.isArray(settings.subRoles) ? settings.subRoles : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load people");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const companyNameById = useMemo(
    () => new Map(companies.map((c) => [c.id, c.name])),
    [companies]
  );

  const allMainRoles = useMemo(() => {
    const set = new Set<string>();
    for (const p of people) {
      for (const r of p.mainRoles || []) set.add(r);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [people]);

  const allSubRoles = useMemo(() => {
    const set = new Set<string>();
    for (const p of people) {
      for (const r of p.subRoles || []) set.add(r);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [people]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...people].sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      if (aTime !== bTime) return bTime - aTime;
      return a.username.localeCompare(b.username);
    });
    const statusWanted = statusFilter.length > 0 ? statusFilter : null;

    return list
      .map((p) => {
        let involvements = p.eventInvolvements || [];
        let directoryRoles = p.roles || [];
        if (statusWanted) {
          involvements = involvements
            .map((ev) => ({
              ...ev,
              roles: ev.roles.filter((r) => statusWanted.includes(normalizeStatus(r.status))),
            }))
            .filter((ev) => ev.roles.length > 0);
          directoryRoles = directoryRoles.filter((r) =>
            statusWanted.includes(normalizeStatus(r.status))
          );
        }
        const mainRoles = [
          ...new Set([
            ...involvements.flatMap((ev) => ev.roles.map((r) => r.mainRole)),
            ...directoryRoles.map((r) => r.role),
          ]),
        ];
        const subRoleList = [
          ...new Set([
            ...involvements.flatMap((ev) =>
              ev.roles.map((r) => r.subRole).filter((s): s is string => Boolean(s))
            ),
            ...directoryRoles.flatMap((r) =>
              (r.subRole || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            ),
          ]),
        ];
        return {
          ...p,
          eventInvolvements: involvements,
          roles: directoryRoles,
          mainRoles,
          subRoles: subRoleList,
        };
      })
      .filter((p) => {
        if (statusWanted) {
          const hasMatch =
            (p.eventInvolvements || []).length > 0 || (p.roles || []).length > 0;
          if (!hasMatch) return false;
        }
        if (!matchesAnyFilter(mainRoleFilter, p.mainRoles || [])) return false;
        if (!matchesAnyFilter(subRoleFilter, p.subRoles || [])) return false;
        if (!q) return true;
        return (
          p.username.toLowerCase().includes(q) ||
          (p.email || "").toLowerCase().includes(q) ||
          (p.title || "").toLowerCase().includes(q) ||
          (p.companyName || "").toLowerCase().includes(q) ||
          (p.companyId ? companyNameById.get(p.companyId) || "" : "").toLowerCase().includes(q) ||
          (p.notes || "").toLowerCase().includes(q) ||
          (p.mainRoles || []).some((r) => r.toLowerCase().includes(q)) ||
          (p.subRoles || []).some((r) => r.toLowerCase().includes(q)) ||
          (p.eventInvolvements || []).some((ev) => ev.eventName.toLowerCase().includes(q))
        );
      });
  }, [people, query, mainRoleFilter, subRoleFilter, statusFilter, companyNameById]);

  const hasFilters = Boolean(
    query.trim() ||
      mainRoleFilter.length ||
      subRoleFilter.length ||
      statusFilter.length !== 1 ||
      statusFilter[0] !== "confirmed"
  );

  const displayCompany = (p: Person) => {
    if (p.companyId) return companyNameById.get(p.companyId) || p.companyName || "—";
    return p.companyName || "—";
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const directoryRoles = parseRolesJson(form.rolesJson);
  const addRoles = parseMultiJson(form.addRolesJson);
  const addSubs = parseMultiJson(form.addSubRolesJson);
  const lockedRoles = new Set([
    ...editEventMainRoles,
    ...directoryRoles.map((r) => r.role),
  ]);
  const availableRoles = EVENT_ADD_MAIN_ROLES.filter((r) => !lockedRoles.has(r));
  const addNeedsSubRoles = addRoles.some((r) => MAIN_ROLES_WITH_SUB_ROLES.has(r));

  const save = async () => {
    const username = form.username.trim();
    if (!username) {
      setError("Name is required");
      return;
    }
    if (addRoles.length > 0) {
      setError("Click “Add roles” to apply selected roles before saving, or clear the selection.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const companyId = form.companyId.trim();
      const payload = {
        username,
        email: form.email.trim() || "",
        linkedin: form.linkedin.trim() || "",
        title: form.title.trim() || "",
        phone: form.phone.trim() || "",
        notes: form.notes.trim() || "",
        companyId: companyId || "",
        companyName: companyId ? null : form.companyText.trim() || null,
        roles: directoryRoles,
      };

      if (editId) {
        await api<Person>("/api/admin/people", {
          method: "PUT",
          body: JSON.stringify({ id: editId, ...payload }),
        });
      } else {
        await api<Person>("/api/admin/people", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setShowForm(false);
      setEditId(null);
      setEditEventMainRoles([]);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save person");
    } finally {
      setSaving(false);
    }
  };

  const applyAddRoles = () => {
    if (addRoles.length === 0) return;
    const subJoined = addNeedsSubRoles ? addSubs.join(", ") || null : null;
    const next = [...directoryRoles];
    for (const role of addRoles) {
      if (lockedRoles.has(role) && directoryRoles.some((r) => r.role === role)) continue;
      if (editEventMainRoles.includes(role)) continue;
      if (next.some((r) => r.role === role)) continue;
      next.push({
        role,
        subRole: MAIN_ROLES_WITH_SUB_ROLES.has(role) ? subJoined : null,
        status: form.addStatus,
      });
    }
    setForm({
      ...form,
      rolesJson: JSON.stringify(next),
      addRolesJson: "[]",
      addSubRolesJson: "[]",
    });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this person?")) return;
    setError("");
    try {
      await api("/api/admin/people", { method: "DELETE", body: JSON.stringify({ id }) });
      setPeople((prev) => prev.filter((p) => p.id !== id));
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete person");
    }
  };

  const startEdit = (p: Person) => {
    setEditId(p.id);
    setEditEventMainRoles(p.eventMainRoles || []);
    setForm({
      username: p.username,
      email: p.email || "",
      linkedin: p.linkedin || "",
      title: p.title || "",
      phone: p.phone || "",
      notes: p.notes || "",
      companyId: p.companyId || "",
      companyText: p.companyId ? "" : p.companyName || "",
      rolesJson: JSON.stringify(p.roles || []),
      addRolesJson: "[]",
      addSubRolesJson: "[]",
      addStatus: "confirmed",
    });
    setShowForm(true);
    setError("");
  };

  const openNew = () => {
    setEditId(null);
    setEditEventMainRoles([]);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">People</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Contact directory plus optional directory roles. Event roles stay on each event.
            List defaults to confirmed only — change Status to see others. Public site shows
            confirmed roles on published events only.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" /> Add Person
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {showForm && (
        <div className="card mt-6 space-y-4">
          <h2 className="font-semibold text-zinc-100">{editId ? "Edit" : "New"} Person</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Name *</label>
              <input
                className="input-field"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoFocus
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">LinkedIn</label>
              <input
                className="input-field"
                value={form.linkedin}
                onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Job Title</label>
              <input
                className="input-field"
                placeholder="e.g. Founder, DevRel, Software Engineer"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input
                className="input-field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Company (sponsor org)</label>
              <select
                className="input-field"
                value={form.companyId}
                onChange={(e) =>
                  setForm({ ...form, companyId: e.target.value, companyText: "" })
                }
              >
                <option value="">— None / free text below —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {!form.companyId && (
              <div>
                <label className="label">Employer (free text)</label>
                <input
                  className="input-field"
                  placeholder="Optional — not linked to sponsor catalog"
                  value={form.companyText}
                  onChange={(e) => setForm({ ...form, companyText: e.target.value })}
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Admin-only notes — outreach, context, reminders…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          {editEventMainRoles.length > 0 && (
            <div>
              <p className="label">Roles from events (read-only)</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {editEventMainRoles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
                  >
                    {role}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Already assigned on an event — change those under Admin → Events.
              </p>
            </div>
          )}

          <div>
            <p className="label">Directory roles</p>
            {directoryRoles.length === 0 ? (
              <p className="mt-1 text-xs text-zinc-500">None yet — add roles below.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {directoryRoles.map((r) => (
                  <div
                    key={r.role}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-zinc-200">{r.role}</span>
                    {r.subRole ? <span className="text-zinc-400">· {r.subRole}</span> : null}
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                    <select
                      className="input-field !w-auto !py-1 !text-xs"
                      value={r.status}
                      onChange={(e) => {
                        const status = normalizeStatus(e.target.value);
                        setForm({
                          ...form,
                          rolesJson: JSON.stringify(
                            directoryRoles.map((x) =>
                              x.role === r.role ? { ...x, status } : x
                            )
                          ),
                        });
                      }}
                    >
                      {(Object.keys(STATUS_LABELS) as RoleStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="ml-auto text-zinc-500 hover:text-red-400"
                      onClick={() =>
                        setForm({
                          ...form,
                          rolesJson: JSON.stringify(
                            directoryRoles.filter((x) => x.role !== r.role)
                          ),
                        })
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 space-y-3">
            <p className="text-sm font-medium text-zinc-200">Add roles</p>
            <p className="text-xs text-zinc-500">
              Only roles this person does not already have (from events or directory). Host /
              volunteer / associated can take sub-roles.
            </p>
            {availableRoles.length === 0 ? (
              <p className="text-xs text-zinc-500">All main roles already assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableRoles.map((role) => {
                  const selected = addRoles.includes(role);
                  return (
                    <label
                      key={role}
                      className={`cursor-pointer rounded-full px-3 py-1.5 text-xs ${
                        selected
                          ? "bg-brand-700 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selected}
                        onChange={() => {
                          const next = selected
                            ? addRoles.filter((r) => r !== role)
                            : [...addRoles, role];
                          setForm({
                            ...form,
                            addRolesJson: stringifyMulti(next),
                            ...(!next.some((r) => MAIN_ROLES_WITH_SUB_ROLES.has(r))
                              ? { addSubRolesJson: "[]" }
                              : {}),
                          });
                        }}
                      />
                      {role}
                    </label>
                  );
                })}
              </div>
            )}
            {addNeedsSubRoles && (
              <div>
                <p className="mb-2 text-xs text-zinc-400">Sub-roles</p>
                <div className="flex flex-wrap gap-2">
                  {subRoles.map((sub) => {
                    const selected = addSubs.includes(sub.key);
                    return (
                      <label
                        key={sub.key}
                        className={`cursor-pointer rounded-full px-3 py-1.5 text-xs ${
                          selected
                            ? "bg-emerald-800 text-emerald-100"
                            : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={selected}
                          onChange={() => {
                            const next = selected
                              ? addSubs.filter((s) => s !== sub.key)
                              : [...addSubs, sub.key];
                            setForm({ ...form, addSubRolesJson: stringifyMulti(next) });
                          }}
                        />
                        {sub.key}
                        {!sub.visible ? " (admin only)" : ""}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="label">Status for new roles</label>
                <select
                  className="input-field"
                  value={form.addStatus}
                  onChange={(e) =>
                    setForm({ ...form, addStatus: normalizeStatus(e.target.value) })
                  }
                >
                  {(Object.keys(STATUS_LABELS) as RoleStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn-secondary"
                disabled={addRoles.length === 0}
                onClick={applyAddRoles}
              >
                Add roles
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => void save()}
              disabled={!form.username.trim() || saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowForm(false);
                setEditId(null);
                setEditEventMainRoles([]);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            className="input-field pl-9"
            placeholder="Search people or events..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <MultiFilterSelect
          label="Main role"
          emptyLabel="All main roles"
          options={allMainRoles.map((role) => ({ value: role, label: role }))}
          selected={mainRoleFilter}
          onChange={setMainRoleFilter}
        />
        <MultiFilterSelect
          label="Sub-role"
          emptyLabel="All sub-roles"
          minWidthClassName="min-w-[160px]"
          options={allSubRoles.map((role) => ({ value: role, label: role }))}
          selected={subRoleFilter}
          onChange={setSubRoleFilter}
        />
        <MultiFilterSelect
          label="Status"
          emptyLabel="All statuses"
          minWidthClassName="min-w-[150px]"
          options={(["confirmed", "maybe", "no_response"] as RoleStatus[]).map((s) => ({
            value: s,
            label: STATUS_LABELS[s],
          }))}
          selected={statusFilter}
          onChange={(next) => setStatusFilter(next as RoleStatus[])}
        />
      </div>

      <div className="mt-4 space-y-2">
        {filtered.map((p) => {
          const open = expandedIds.has(p.id);
          const involvements = p.eventInvolvements || [];
          const dirRoles = p.roles || [];
          return (
            <div key={p.id} className="rounded-xl border border-zinc-800 bg-zinc-950/40">
              <div className="flex flex-wrap items-start gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleExpanded(p.id)}
                  className="mt-0.5 rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                  aria-expanded={open}
                  title={open ? "Hide events" : "Show events"}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
                  />
                </button>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {(() => {
                      const href = externalUrl(p.linkedin);
                      return href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-brand-400 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {p.username}
                        </a>
                      ) : (
                        <p className="font-medium text-zinc-100">{p.username}</p>
                      );
                    })()}
                    <span className="text-sm text-zinc-500">{p.title || "—"}</span>
                    <span className="text-sm text-zinc-600">{displayCompany(p)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(p.mainRoles || []).length === 0 && (p.subRoles || []).length === 0 && (
                      <span className="text-xs text-zinc-600">No matching roles</span>
                    )}
                    {(p.mainRoles || []).map((role) => (
                      <span
                        key={role}
                        className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
                      >
                        {role}
                      </span>
                    ))}
                    {(p.subRoles || []).map((role) => (
                      <span
                        key={`sub-${role}`}
                        className="rounded-full bg-emerald-950/60 px-2 py-0.5 text-xs text-emerald-300"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailPerson(p)}
                    className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:border-brand-500 hover:text-brand-300"
                    title="Send email"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Send email
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="text-brand-400 hover:text-brand-300"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(p.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {open && (
                <div className="border-t border-zinc-800/80 px-4 py-3 pl-12 space-y-4">
                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Contact
                    </p>
                    <div className="space-y-1 text-sm text-zinc-300">
                      <p>
                        <span className="text-zinc-500">Email · </span>
                        {p.email ? (
                          <a
                            href={`mailto:${p.email}`}
                            className="text-brand-400 hover:underline"
                          >
                            {p.email}
                          </a>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </p>
                      <p>
                        <span className="text-zinc-500">Phone · </span>
                        {p.phone ? (
                          <a
                            href={`tel:${p.phone}`}
                            className="text-brand-400 hover:underline"
                          >
                            {p.phone}
                          </a>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </p>
                      {p.notes?.trim() ? (
                        <p className="whitespace-pre-wrap text-zinc-400">
                          <span className="text-zinc-500">Notes · </span>
                          {p.notes}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {dirRoles.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Directory roles
                      </p>
                      <ul className="space-y-1">
                        {dirRoles.map((r) => {
                          const status = normalizeStatus(r.status);
                          return (
                            <li
                              key={`dir-${r.role}`}
                              className="flex flex-wrap items-center gap-2 text-sm text-zinc-400"
                            >
                              <span className="text-zinc-300">{r.role}</span>
                              {r.subRole ? (
                                <>
                                  <span className="text-zinc-600">·</span>
                                  <span>{r.subRole}</span>
                                </>
                              ) : null}
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[status]}`}
                              >
                                {STATUS_LABELS[status]}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {involvements.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      {statusFilter.length
                        ? "No events match this status filter."
                        : "Not assigned to any events yet."}
                    </p>
                  ) : (
                    <ul className="divide-y divide-zinc-800">
                      {involvements.map((ev) => (
                        <li key={ev.eventId} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-medium text-zinc-200">{ev.eventName}</span>
                            {!ev.eventPublished && (
                              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase text-zinc-500">
                                unpublished
                              </span>
                            )}
                          </div>
                          <ul className="mt-1.5 space-y-1">
                            {ev.roles.map((role, idx) => {
                              const status = normalizeStatus(role.status);
                              return (
                                <li
                                  key={`${ev.eventId}-${role.mainRole}-${role.subRole || ""}-${idx}`}
                                  className="flex flex-wrap items-center gap-2 text-sm text-zinc-400"
                                >
                                  <span className="text-zinc-300">{role.mainRole}</span>
                                  {role.subRole ? (
                                    <>
                                      <span className="text-zinc-600">·</span>
                                      <span>{role.subRole}</span>
                                    </>
                                  ) : null}
                                  {role.companyName ? (
                                    <>
                                      <span className="text-zinc-600">·</span>
                                      <span className="text-zinc-500">{role.companyName}</span>
                                    </>
                                  ) : null}
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[status]}`}
                                  >
                                    {STATUS_LABELS[status]}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {!loading && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">
            {hasFilters || statusFilter.length
              ? "No people match your filters."
              : "No people yet — click Add Person."}
          </p>
        )}
        {loading && <p className="py-8 text-center text-sm text-zinc-500">Loading people...</p>}
      </div>
      {!loading && (
        <p className="mt-3 text-xs text-zinc-500">
          {filtered.length} shown
          {hasFilters || statusFilter.length ? ` (of ${people.length})` : ""}
        </p>
      )}

      {emailPerson && (
        <SendEmailModal person={emailPerson} onClose={() => setEmailPerson(null)} />
      )}
    </div>
  );
}
