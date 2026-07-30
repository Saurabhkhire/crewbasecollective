import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2, Settings2 } from "lucide-react";
import { PasteImageField } from "@/components/admin/PasteImageField";
import { LinkListField } from "@/components/admin/LinkListField";
import { api } from "@/lib/api";
import { eventImageFolder, sanitizeImageBasename } from "@/lib/upload";
import { EVENT_TYPE_LABELS } from "@/lib/utils";
import LocationPicker from "@/components/LocationPicker";

interface EventRow {
  id: string;
  slug: string;
  name: string;
  type: string;
  eventDate: string;
  endDate: string | null;
  location: string | null;
  locationLat: string | null;
  locationLng: string | null;
  description: string | null;
  theme: string | null;
  dayLabel: string | null;
  startTime: string | null;
  endTime: string | null;
  coverImageUrl: string | null;
  coverPageUrl: string | null;
  lumaLink: string | null;
  eventbriteLink: string | null;
  groupLink: string | null;
  isPartnerEvent: boolean;
}

const EVENT_TYPES = [
  "hackathon",
  "pitch_competition",
  "workshop",
  "mixer",
  "dinner",
  "demo",
  "other",
];

const empty = {
  name: "",
  type: "hackathon",
  description: "",
  theme: "",
  eventDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  location: "",
  locationLat: "",
  locationLng: "",
  coverImageUrl: "",
  coverPageUrl: "",
  lumaLinks: [""] as string[],
  eventbriteLinks: [""] as string[],
  groupLink: "",
  isPartnerEvent: false,
};

export default function AdminEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const rows = await api<EventRow[]>("/api/admin/events");
      setEvents(Array.isArray(rows) ? rows : []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (!form.name.trim() || !form.eventDate) {
      setError("Name and date are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Always live on save — no draft/publish step
      const payload = {
        ...form,
        lumaLinks: form.lumaLinks.map((s) => s.trim()).filter(Boolean),
        eventbriteLinks: form.eventbriteLinks.map((s) => s.trim()).filter(Boolean),
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        endDate: form.endDate || null,
        locationLat: form.locationLat || null,
        locationLng: form.locationLng || null,
        isPublished: true,
      };
      const created = await api<EventRow>("/api/admin/events", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setEvents((prev) => [created, ...prev.filter((e) => e.id !== created.id)]);
      navigate(`/admin/events/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this event and all related data?")) return;
    setError("");
    try {
      await api("/api/admin/events", { method: "DELETE", body: JSON.stringify({ id }) });
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Events</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Save an event to publish it live. Open Manage to edit basics and all event details.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setForm(empty);
            setShowForm(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" /> Add Event
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {showForm && (
        <div className="card mt-6 space-y-4">
          <h2 className="font-semibold text-zinc-100">New Event</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Name *</label>
              <input
                className="input-field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Type *</label>
              <select
                className="input-field"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {EVENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Start Date *</label>
              <input
                type="date"
                className="input-field"
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">End Date (multi-day events)</label>
              <input
                type="date"
                className="input-field"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Theme</label>
              <input
                className="input-field"
                value={form.theme}
                onChange={(e) => setForm({ ...form, theme: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Start Time</label>
              <input
                type="time"
                className="input-field"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="label">End Time</label>
              <input
                type="time"
                className="input-field"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Location</label>
              <LocationPicker
                value={{
                  location: form.location,
                  locationLat: form.locationLat,
                  locationLng: form.locationLng,
                }}
                onChange={(next) => setForm({ ...form, ...next })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input-field"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <PasteImageField
                label="Cover Image"
                imageUrl={form.coverImageUrl}
                onImageUrl={(url) => setForm((prev) => ({ ...prev, coverImageUrl: url }))}
                folder={eventImageFolder(form.name)}
                naming="named"
                fileName="cover"
                syncFolders={["covers"]}
                syncNames={[sanitizeImageBasename(form.name)]}
                syncLabel="cover"
              />
            </div>
            <div className="sm:col-span-2">
              <LinkListField
                label="Luma links"
                placeholder="https://lu.ma/..."
                values={form.lumaLinks}
                onChange={(lumaLinks) => setForm({ ...form, lumaLinks })}
              />
            </div>
            <div className="sm:col-span-2">
              <LinkListField
                label="Eventbrite links"
                placeholder="https://www.eventbrite.com/..."
                values={form.eventbriteLinks}
                onChange={(eventbriteLinks) => setForm({ ...form, eventbriteLinks })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Join group link (Discord / WhatsApp)</label>
              <input
                className="input-field"
                placeholder="https://discord.gg/... or https://chat.whatsapp.com/..."
                value={form.groupLink}
                onChange={(e) => setForm({ ...form, groupLink: e.target.value })}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.isPartnerEvent}
                  onChange={(e) => setForm({ ...form, isPartnerEvent: e.target.checked })}
                />
                Partner Event
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save & configure details"}
            </button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id} className="border-b border-zinc-800/80 hover:bg-zinc-900/60">
                <td className="px-4 py-3 font-medium text-zinc-100">{ev.name}</td>
                <td className="px-4 py-3 text-zinc-300">{EVENT_TYPE_LABELS[ev.type]}</td>
                <td className="px-4 py-3 text-zinc-400">{ev.eventDate}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/admin/events/${ev.id}`}
                      className="btn-secondary !px-3 !py-1.5 text-xs"
                    >
                      <Settings2 className="mr-1 h-3.5 w-3.5" />
                      Manage
                    </Link>
                    <button onClick={() => remove(ev.id)} className="text-red-400" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  No events yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
