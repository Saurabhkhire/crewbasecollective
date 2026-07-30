import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { PasteImageField } from "@/components/admin/PasteImageField";
import { api } from "@/lib/api";

interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  information: string | null;
  createdAt?: string;
}

const empty = { name: "", logoUrl: "", website: "", information: "" };

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = async () => {
    setError("");
    try {
      const rows = await api<Company[]>("/api/admin/companies");
      setCompanies(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...companies].sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      if (aTime !== bTime) return bTime - aTime;
      return a.name.localeCompare(b.name);
    });
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.website || "").toLowerCase().includes(q) ||
        (c.information || "").toLowerCase().includes(q)
    );
  }, [companies, query]);

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
        information: form.information.trim() || null,
      };
      if (editId) {
        const updated = await api<Company>("/api/admin/companies", {
          method: "PUT",
          body: JSON.stringify({ id: editId, ...payload }),
        });
        setCompanies((prev) =>
          prev.map((c) => (c.id === editId ? { ...c, ...updated } : c))
        );
      } else {
        const created = await api<Company>("/api/admin/companies", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setCompanies((prev) => {
          if (prev.some((c) => c.id === created.id)) return prev;
          return [created, ...prev];
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
      information: c.information || "",
    });
    setShowForm(true);
    setError("");
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Sponsor Companies</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Catalog for event sponsors and partners. Newest appear first.
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

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          className="input-field pl-9"
          placeholder="Search companies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Logo</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Website</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-zinc-800/80 hover:bg-zinc-900/60">
                <td className="px-4 py-3">
                  {c.logoUrl ? (
                    <img src={c.logoUrl} alt="" className="h-9 w-9 rounded object-contain" />
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-zinc-100">{c.name}</td>
                <td className="px-4 py-3 text-zinc-400">{c.website || "—"}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    className="mr-2 text-brand-400 hover:text-brand-300"
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
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  {query.trim()
                    ? "No companies match your search."
                    : "No sponsor companies yet — click Add Company."}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  Loading companies...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!loading && (
        <p className="mt-3 text-xs text-zinc-500">
          {filtered.length} shown
          {query.trim() ? ` (of ${companies.length})` : ""}
        </p>
      )}
    </div>
  );
}
