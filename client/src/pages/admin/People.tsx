import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { api } from "@/lib/api";

interface Person {
  id: string;
  username: string;
  email: string | null;
  linkedin: string | null;
  title: string | null;
  phone: string | null;
  companyId: string | null;
  companyName: string | null;
  createdAt?: string;
}

const empty = {
  username: "",
  email: "",
  linkedin: "",
  title: "",
  phone: "",
  companyText: "",
};

export default function AdminPeople() {
  const [people, setPeople] = useState<Person[]>([]);
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
      const peopleRows = await api<Person[]>("/api/admin/people");
      setPeople(Array.isArray(peopleRows) ? peopleRows : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load people");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...people].sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      if (aTime !== bTime) return bTime - aTime;
      return a.username.localeCompare(b.username);
    });
    if (!q) return list;
    return list.filter(
      (p) =>
        p.username.toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        (p.title || "").toLowerCase().includes(q) ||
        (p.companyName || "").toLowerCase().includes(q)
    );
  }, [people, query]);

  const save = async () => {
    const username = form.username.trim();
    if (!username) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        username,
        email: form.email.trim() || "",
        linkedin: form.linkedin.trim() || "",
        title: form.title.trim() || "",
        phone: form.phone.trim() || "",
        companyName: form.companyText.trim() || null,
      };

      if (editId) {
        const updated = await api<Person>("/api/admin/people", {
          method: "PUT",
          body: JSON.stringify({ id: editId, ...payload }),
        });
        setPeople((prev) =>
          prev.map((p) => (p.id === editId ? { ...p, ...updated } : p))
        );
      } else {
        const created = await api<Person>("/api/admin/people", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setPeople((prev) => {
          if (prev.some((p) => p.id === created.id)) return prev;
          return [created, ...prev];
        });
      }

      setShowForm(false);
      setEditId(null);
      setForm(empty);
      setQuery("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save person");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this person?")) return;
    setError("");
    try {
      await api("/api/admin/people", { method: "DELETE", body: JSON.stringify({ id }) });
      setPeople((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete person");
    }
  };

  const startEdit = (p: Person) => {
    setEditId(p.id);
    setForm({
      username: p.username,
      email: p.email || "",
      linkedin: p.linkedin || "",
      title: p.title || "",
      phone: p.phone || "",
      companyText: p.companyName || "",
    });
    setShowForm(true);
    setError("");
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">People</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Contact directory. Roles come from event assignments (speaker, judge, host, etc.).
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
              <label className="label">Employer / company</label>
              <input
                className="input-field"
                placeholder="Optional — does not add a sponsor company"
                value={form.companyText}
                onChange={(e) => setForm({ ...form, companyText: e.target.value })}
              />
              <p className="mt-1 text-xs text-zinc-500">
                Free-text only. Add sponsor orgs under Admin → Companies.
              </p>
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
          placeholder="Search people..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-zinc-800/80 hover:bg-zinc-900/60">
                <td className="px-4 py-3 font-medium text-zinc-100">{p.username}</td>
                <td className="px-4 py-3 text-zinc-400">{p.email || "—"}</td>
                <td className="px-4 py-3 text-zinc-400">{p.title || "—"}</td>
                <td className="px-4 py-3 text-zinc-400">{p.companyName || "—"}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="mr-2 text-brand-400 hover:text-brand-300"
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
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  {query.trim()
                    ? "No people match your search."
                    : "No people yet — click Add Person."}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  Loading people...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!loading && (
        <p className="mt-3 text-xs text-zinc-500">
          {filtered.length} shown
          {query.trim() ? ` (of ${people.length})` : ""}
        </p>
      )}
    </div>
  );
}
