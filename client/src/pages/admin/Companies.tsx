import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, ChevronDown } from "lucide-react";
import { PasteImageField } from "@/components/admin/PasteImageField";
import { MultiFilterSelect, matchesAnyFilter } from "@/components/admin/MultiFilterSelect";
import { api } from "@/lib/api";
import { PARTNER_TYPE_LABELS } from "@/lib/utils";

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

interface CompanyRepEvent {
  eventId: string;
  eventName: string;
  status: RoleStatus;
  kind: "sponsor" | "partner" | string;
  partnerType: string | null;
  eventPublished: boolean;
}

interface CompanyRep {
  userId: string;
  username: string;
  linkedin: string | null;
  events: CompanyRepEvent[] | string[];
}

interface CompanyInvolvement {
  kind: "sponsor" | "partner";
  partnerType: string | null;
  eventId: string;
  eventName: string;
  eventPublished: boolean;
  status: RoleStatus;
}

interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  linkedin: string | null;
  email: string | null;
  information: string | null;
  createdAt?: string;
  kinds?: ("sponsor" | "partner")[];
  partnerTypes?: string[];
  representatives?: CompanyRep[];
  involvements?: CompanyInvolvement[];
}

const empty = { name: "", logoUrl: "", website: "", linkedin: "", email: "", information: "" };

const TYPE_FILTER_OPTIONS = [
  { value: "sponsor", label: "Sponsor" },
  { value: "venue", label: "Venue partner" },
  { value: "ventures", label: "Ventures partner" },
  { value: "community", label: "Community partner" },
  { value: "media", label: "Media partner" },
  { value: "food", label: "Food partner" },
  { value: "other", label: "Other partner" },
  { value: "custom", label: "Custom partner" },
];

function normalizeRepEvents(events: CompanyRep["events"]): CompanyRepEvent[] {
  return (events || []).map((e) => {
    if (typeof e === "string") {
      return {
        eventId: e,
        eventName: e,
        status: "confirmed" as RoleStatus,
        kind: "sponsor",
        partnerType: null,
        eventPublished: true,
      };
    }
    return {
      ...e,
      status: (e.status === "maybe" || e.status === "no_response" ? e.status : "confirmed") as RoleStatus,
    };
  });
}

function RepresentativeRow({
  rep,
  companyKind,
}: {
  rep: CompanyRep;
  companyKind: "sponsor" | "partner" | "both";
}) {
  const [open, setOpen] = useState(false);
  const events = normalizeRepEvents(rep.events);
  const roleLabel =
    companyKind === "partner"
      ? "partner representative"
      : companyKind === "sponsor"
        ? "sponsor representative"
        : "representative";

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          {rep.linkedin ? (
            <a
              href={rep.linkedin}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand-400 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {rep.username}
            </a>
          ) : (
            <span className="font-medium text-zinc-200">{rep.username}</span>
          )}
          <span className="text-xs text-zinc-500">{roleLabel}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul className="space-y-1 border-t border-zinc-800/80 px-3 py-2 text-xs text-zinc-400">
          {events.length === 0 ? (
            <li>No events listed.</li>
          ) : (
            events.map((ev) => (
              <li
                key={`${ev.eventId}-${ev.kind}-${ev.partnerType || ""}`}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="text-zinc-300">{ev.eventName}</span>
                <span className="text-zinc-600">·</span>
                <span>
                  {ev.kind === "sponsor"
                    ? "Sponsor"
                    : PARTNER_TYPE_LABELS[ev.partnerType || ""] ||
                      `${ev.partnerType || "partner"} partner`}
                </span>
                {!ev.eventPublished && (
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase text-zinc-500">
                    unpublished
                  </span>
                )}
                <span className={`rounded-full px-1.5 py-0.5 ${STATUS_STYLES[ev.status]}`}>
                  {STATUS_LABELS[ev.status]}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<RoleStatus[]>([]);
  const [sponsorshipFilter, setSponsorshipFilter] = useState<
    "both" | "sponsored" | "not_sponsored"
  >("both");
  const [sponsorshipEventId, setSponsorshipEventId] = useState("");

  const load = async () => {
    setError("");
    try {
      const [rows, eventRows] = await Promise.all([
        api<Company[]>("/api/admin/companies"),
        api<{ id: string; name: string }[]>("/api/admin/events").catch(() => []),
      ]);
      setCompanies(Array.isArray(rows) ? rows : []);
      setEvents(
        Array.isArray(eventRows)
          ? [...eventRows].sort((a, b) => a.name.localeCompare(b.name))
          : []
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const eventOptions = useMemo(() => {
    if (events.length > 0) {
      return events.map((ev) => ({ id: ev.id, name: ev.name }));
    }
    const map = new Map<string, string>();
    for (const c of companies) {
      for (const inv of c.involvements || []) {
        if (inv.eventId) map.set(inv.eventId, inv.eventName || inv.eventId);
      }
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [companies, events]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...companies].sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      if (aTime !== bTime) return bTime - aTime;
      return a.name.localeCompare(b.name);
    });

    const hasSponsored = (c: Company) =>
      (c.involvements || []).some(
        (inv) =>
          inv.kind === "sponsor" &&
          (!sponsorshipEventId || inv.eventId === sponsorshipEventId)
      );

    return list
      .map((c) => {
        let involvements = c.involvements || [];
        let representatives = c.representatives || [];

        if (statusFilter.length > 0) {
          involvements = involvements.filter((inv) => statusFilter.includes(inv.status));
          representatives = representatives
            .map((rep) => {
              const events = normalizeRepEvents(rep.events).filter((ev) =>
                statusFilter.includes(ev.status)
              );
              return { ...rep, events };
            })
            .filter((rep) => normalizeRepEvents(rep.events).length > 0);
        }

        return { ...c, involvements, representatives };
      })
      .filter((c) => {
        if (typeFilter.length > 0) {
          const companyTypes = [
            ...((c.kinds || []).includes("sponsor") ? ["sponsor"] : []),
            ...(c.partnerTypes || []),
          ];
          if (!matchesAnyFilter(typeFilter, companyTypes)) return false;
        }
        if (statusFilter.length > 0) {
          const hasMatch =
            (c.involvements || []).length > 0 || (c.representatives || []).length > 0;
          if (!hasMatch) return false;
        }
        if (sponsorshipFilter === "sponsored" && !hasSponsored(c)) return false;
        if (sponsorshipFilter === "not_sponsored" && hasSponsored(c)) return false;
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          (c.website || "").toLowerCase().includes(q) ||
          (c.information || "").toLowerCase().includes(q) ||
          (c.representatives || []).some((r) => r.username.toLowerCase().includes(q))
        );
      });
  }, [companies, query, typeFilter, statusFilter, sponsorshipFilter, sponsorshipEventId]);

  const save = async () => {
    const name = form.name.trim();
    if (!name) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name,
        logoUrl: form.logoUrl.trim() || null,
        website: form.website.trim() || null,
        linkedin: form.linkedin.trim() || null,
        email: form.email.trim() || null,
        information: form.information.trim() || null,
      };
      if (editId) {
        await api<Company>("/api/admin/companies", {
          method: "PUT",
          body: JSON.stringify({ id: editId, ...payload }),
        });
      } else {
        await api<Company>("/api/admin/companies", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false);
      setEditId(null);
      setForm(empty);
      setQuery("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save company");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this sponsor company?")) return;
    setError("");
    try {
      await api("/api/admin/companies", { method: "DELETE", body: JSON.stringify({ id }) });
      setCompanies((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete company");
    }
  };

  const startEdit = (c: Company) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      logoUrl: c.logoUrl || "",
      website: c.website || "",
      linkedin: c.linkedin || "",
      email: c.email || "",
      information: c.information || "",
    });
    setShowForm(true);
    setError("");
  };

  const typeBadges = (c: Company) => {
    const badges: string[] = [];
    if ((c.kinds || []).includes("sponsor")) badges.push("Sponsor");
    for (const t of c.partnerTypes || []) {
      badges.push(PARTNER_TYPE_LABELS[t] || `${t} partner`);
    }
    return badges;
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Sponsors & Partners</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Catalog for organizations. Status is per event (shown under Events / each
            representative&apos;s events). Only confirmed roles on published events appear publicly.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setEditId(null);
            setForm(empty);
            setShowForm(true);
            setError("");
          }}
        >
          <Plus className="mr-1 h-4 w-4" /> Add Company
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {showForm && (
        <div className="card mt-6 space-y-4">
          <h2 className="font-semibold text-zinc-100">{editId ? "Edit" : "New"} Company</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Name *</label>
              <input
                className="input-field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </div>
            <div>
              <label className="label">Website</label>
              <input
                className="input-field"
                placeholder="https://..."
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>
            <div>
              <label className="label">LinkedIn</label>
              <input
                className="input-field"
                placeholder="https://linkedin.com/company/..."
                value={form.linkedin}
                onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
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
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input-field"
                rows={3}
                value={form.information}
                onChange={(e) => setForm({ ...form, information: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <PasteImageField
                label="Logo"
                imageUrl={form.logoUrl}
                onImageUrl={(url) => setForm((prev) => ({ ...prev, logoUrl: url }))}
                folder="companies"
                naming="named"
                fileName={form.name}
                syncLabel="logo"
                previewClassName="h-14 w-14 rounded-lg border border-zinc-700 object-contain bg-zinc-900"
              />
              <input
                className="input-field mt-3 max-w-md"
                placeholder="Or paste logo URL"
                value={form.logoUrl.startsWith("data:") ? "" : form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => void save()}
              disabled={!form.name.trim() || saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowForm(false);
                setEditId(null);
                setForm(empty);
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
            placeholder="Search companies or representatives..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <MultiFilterSelect
          label="Filter by type"
          emptyLabel="All types"
          options={TYPE_FILTER_OPTIONS}
          selected={typeFilter}
          onChange={setTypeFilter}
        />
        <MultiFilterSelect
          label="Filter by status"
          emptyLabel="All statuses"
          minWidthClassName="min-w-[160px]"
          options={(["confirmed", "maybe", "no_response"] as RoleStatus[]).map((s) => ({
            value: s,
            label: STATUS_LABELS[s],
          }))}
          selected={statusFilter}
          onChange={(next) => setStatusFilter(next as RoleStatus[])}
        />
        <div className="min-w-[180px]">
          <label className="label">Event (sponsorship)</label>
          <select
            className="input-field"
            value={sponsorshipEventId}
            onChange={(e) => setSponsorshipEventId(e.target.value)}
          >
            <option value="">Any event</option>
            {eventOptions.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="label">Sponsorship</label>
          <select
            className="input-field"
            value={sponsorshipFilter}
            onChange={(e) =>
              setSponsorshipFilter(
                e.target.value as "both" | "sponsored" | "not_sponsored"
              )
            }
          >
            <option value="both">Both</option>
            <option value="sponsored">Sponsored</option>
            <option value="not_sponsored">Did not sponsor</option>
          </select>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {filtered.map((c) => {
          const badges = typeBadges(c);
          const reps = c.representatives || [];
          const involvements = c.involvements || [];
          return (
            <div key={c.id} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  {c.logoUrl ? (
                    <img
                      src={c.logoUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded object-contain bg-zinc-900"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-zinc-800 text-xs text-zinc-500">
                      —
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-100">{c.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {badges.length === 0 && (
                        <span className="text-xs text-zinc-600">Not on any event yet</span>
                      )}
                      {badges.map((b) => (
                        <span
                          key={b}
                          className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                    {c.website && (
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs text-brand-400 hover:underline"
                      >
                        {c.website}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    className="text-brand-400 hover:text-brand-300"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(c.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {involvements.length > 0 && (
                <div className="mt-3 border-t border-zinc-800/80 pt-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Events
                  </p>
                  <div className="divide-y divide-zinc-800/80">
                  {involvements.map((inv) => (
                    <div
                      key={`${inv.kind}-${inv.eventId}-${inv.partnerType || ""}`}
                      className="flex flex-wrap items-center gap-2 py-2 text-sm text-zinc-300 first:pt-1 last:pb-0"
                    >
                      <span>
                        {inv.kind === "sponsor"
                          ? "Sponsor"
                          : PARTNER_TYPE_LABELS[inv.partnerType || ""] ||
                            `${inv.partnerType} partner`}
                      </span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-400">{inv.eventName}</span>
                      {!inv.eventPublished && (
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase text-zinc-500">
                          unpublished
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[inv.status]}`}>
                        {STATUS_LABELS[inv.status]}
                      </span>
                    </div>
                  ))}
                  </div>
                </div>
              )}

              {reps.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-zinc-800/80 pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Representatives
                  </p>
                  {reps.map((rep) => (
                    <RepresentativeRow
                      key={rep.userId}
                      rep={rep}
                      companyKind={
                        (c.kinds || []).includes("sponsor") && (c.kinds || []).includes("partner")
                          ? "both"
                          : (c.kinds || []).includes("partner")
                            ? "partner"
                            : "sponsor"
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {!loading && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">
            {query.trim() ||
            typeFilter.length ||
            statusFilter.length ||
            sponsorshipFilter !== "both" ||
            sponsorshipEventId
              ? "No companies match your filters."
              : "No sponsor companies yet — click Add Company."}
          </p>
        )}
        {loading && <p className="py-8 text-center text-sm text-zinc-500">Loading companies...</p>}
      </div>
      {!loading && (
        <p className="mt-3 text-xs text-zinc-500">
          {filtered.length} shown
          {query.trim() ||
          typeFilter.length ||
          statusFilter.length ||
          sponsorshipFilter !== "both" ||
          sponsorshipEventId
            ? ` (of ${companies.length})`
            : ""}
        </p>
      )}
    </div>
  );
}
