import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, RefreshCw, Pencil } from "lucide-react";
import { SortableList } from "@/components/admin/SortableList";
import { PasteImageField } from "@/components/admin/PasteImageField";
import { LinkListField } from "@/components/admin/LinkListField";
import { eventImageFolder, sanitizeImageBasename } from "@/lib/upload";
import { normalizeEventLinks } from "@/lib/event-links";
import { api } from "@/lib/api";
import { EVENT_TYPE_LABELS, isCompetitionEvent } from "@/lib/utils";
import LocationPicker from "@/components/LocationPicker";

type Tab =
  | "basics"
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

interface EventData {
  id: string;
  slug: string;
  name: string;
  type: string;
  eventDate: string;
  endDate: string | null;
  dayLabel: string | null;
  description: string | null;
  theme: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  locationLat: string | null;
  locationLng: string | null;
  coverImageUrl: string | null;
  coverPageUrl: string | null;
  lumaLinks?: string[];
  eventbriteLinks?: string[];
  lumaLink: string | null;
  eventbriteLink: string | null;
  groupLink: string | null;
  isPartnerEvent: boolean;
}

type Item = { id: string; [key: string]: unknown };

interface SubData {
  imageFolder?: string;
  tracks: Item[];
  sponsors: Item[];
  partners: Item[];
  prizes: Item[];
  schedule: Item[];
  speakers: Item[];
  judges: Item[];
  hosts: Item[];
  links: Item[];
  photos: Item[];
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

const entityMap: Record<Exclude<Tab, "basics">, string> = {
  tracks: "track",
  sponsors: "sponsor",
  partners: "partner",
  prizes: "prize",
  schedule: "schedule",
  speakers: "speaker",
  judges: "judge",
  hosts: "host",
  links: "link",
  photos: "photo",
};

const TAB_HELP: Record<Tab, string> = {
  basics: "Edit name, type, date, times, location, cover, registration and group links.",
  tracks: "Hackathon / pitch tracks — name and description.",
  sponsors: "Select a company and representatives. Drag to reorder. Reps stay in sync with Judges.",
  partners: "Select a company and partner type. Logo and description come from Companies.",
  prizes: "Select the sponsor first, edit the default prize name, placement and amount.",
  schedule: "Set default minutes. For multi-day events, start and end can be on different days. New slots chain from the previous end.",
  speakers: "Set default minutes. For multi-day events, start and end can be on different days. New speakers chain from the previous end.",
  judges: "Select judges (hackathon / pitch only). Drag to reorder.",
  hosts: "Select a person, host type, and optional sub-role. Drag to reorder.",
  links: "Extra external links shown on the event page.",
  photos: "Drag the grip to reorder. Delete removes the file from the event folder too.",
};

/** All dates of the event (inclusive), for day selection on multi-day events. */
function eventDayOptions(event: EventData): string[] {
  const days: string[] = [];
  const start = new Date(`${event.eventDate}T12:00:00`);
  const end = event.endDate ? new Date(`${event.endDate}T12:00:00`) : start;
  for (let d = new Date(start); d <= end && days.length < 14; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
  }
  return days.length > 0 ? days : [event.eventDate];
}

function dayOptionLabel(day: string): string {
  return new Date(`${day}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formStr(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function basicsFromEvent(event: EventData) {
  return {
    name: event.name || "",
    type: event.type || "hackathon",
    description: event.description || "",
    theme: event.theme || "",
    eventDate: event.eventDate || "",
    endDate: event.endDate || "",
    startTime: event.startTime || "",
    endTime: event.endTime || "",
    location: event.location || "",
    locationLat: event.locationLat || "",
    locationLng: event.locationLng || "",
    coverImageUrl: event.coverImageUrl || "",
    coverPageUrl: event.coverPageUrl || "",
    lumaLinks: normalizeEventLinks(event.lumaLinks, event.lumaLink),
    eventbriteLinks: normalizeEventLinks(event.eventbriteLinks, event.eventbriteLink),
    groupLink: event.groupLink || "",
    isPartnerEvent: event.isPartnerEvent ? "true" : "false",
  };
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function parseHm(hm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatHm(totalMinutes: number): string {
  const mins = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function minutesBetweenIso(startIso: string, endIso: string): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 15;
  return Math.max(1, Math.round(ms / 60000));
}

function addMinutesToIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString();
}

function timeInputFromIso(iso: unknown): string {
  if (!iso || typeof iso !== "string") return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toTimeString().slice(0, 5);
}

function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateInputFromValue(value: unknown): string {
  if (!value || typeof value !== "string") return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim().slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return localDateString(d);
}

function dayTimeToIso(day: string, hm: string): string {
  return new Date(`${day}T${hm}`).toISOString();
}

function addMinutesToDayHm(
  day: string,
  hm: string,
  minutes: number
): { day: string; hm: string } {
  const end = new Date(new Date(`${day}T${hm}`).getTime() + minutes * 60000);
  return { day: localDateString(end), hm: end.toTimeString().slice(0, 5) };
}

function dayOptionsWith(extra: string | undefined, eventDays: string[]): string[] {
  if (!extra || eventDays.includes(extra)) return eventDays;
  return [...eventDays, extra].sort();
}

function sortedTimedItems(
  items: Item[],
  _kind: "schedule" | "speakers",
  direction: "asc" | "desc" = "asc"
): Item[] {
  const copy = [...items];
  copy.sort((a, b) => {
    const aTime = new Date((a.startTime as string) || 0).getTime();
    const bTime = new Date((b.startTime as string) || 0).getTime();
    if (aTime !== bTime) return direction === "asc" ? aTime - bTime : bTime - aTime;
    const aOrder = Number(a.sortOrder ?? 0);
    const bOrder = Number(b.sortOrder ?? 0);
    return direction === "asc" ? aOrder - bOrder : bOrder - aOrder;
  });
  return copy;
}

function lastTimedItem(items: Item[], kind: "schedule" | "speakers"): Item | null {
  const list = sortedTimedItems(items, kind, "asc");
  return list.length > 0 ? list[list.length - 1] : null;
}

export default function AdminEventDetail() {
  const { id: eventId } = useParams<{ id: string }>();

  const [event, setEvent] = useState<EventData | null>(null);
  const [data, setData] = useState<SubData | null>(null);
  const [tab, setTab] = useState<Tab>("basics");
  const [companies, setCompanies] = useState<
    { id: string; name: string; information: string | null; logoUrl: string | null }[]
  >([]);
  const [people, setPeople] = useState<{ id: string; username: string }[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [basicsForm, setBasicsForm] = useState<Record<string, string | string[]>>({});
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [savingBasics, setSavingBasics] = useState(false);
  const [error, setError] = useState("");
  /** Default slot length in minutes for schedule/speakers chaining (may be empty). */
  const [defaultMinutes, setDefaultMinutes] = useState("");

  const isCompetition = event ? isCompetitionEvent(event.type) : false;
  const eventDisplayName = formStr(basicsForm.name).trim() || event?.name || "";
  const eventPhotoFolder = data?.imageFolder || eventImageFolder(eventDisplayName);

  const syncGalleryFromFolder = async () => {
    if (!eventId) return;
    setUploadingPhotos(true);
    setError("");
    try {
      const result = await api<{ count: number; urls: string[] }>(
        `/api/admin/events/${eventId}/detail`,
        {
          method: "POST",
          body: JSON.stringify({ entity: "sync_gallery", data: {} }),
        }
      );
      setForm({});
      await load();
      if (!result.count) {
        setError(`No gallery images found in data/images/${eventPhotoFolder}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gallery sync failed");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const addPhotoUrls = async (urls: string[]) => {
    if (!eventId || urls.length === 0) return;
    setUploadingPhotos(true);
    setError("");
    try {
      const existing = new Set((data?.photos || []).map((p) => p.imageUrl as string));
      const caption = form.caption || "";
      let added = 0;
      for (const imageUrl of urls) {
        if (existing.has(imageUrl)) continue;
        await api(`/api/admin/events/${eventId}/detail`, {
          method: "POST",
          body: JSON.stringify({ entity: "photo", data: { imageUrl, caption } }),
        });
        added++;
      }
      setForm({});
      await load();
      if (added === 0) {
        setError("No new images to add — they may already be in the gallery.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const load = useCallback(async () => {
    if (!eventId) return;
    const [allEvents, subData, companyRows, peopleRows] = await Promise.all([
      api<EventData[]>("/api/admin/events"),
      api<SubData>(`/api/admin/events/${eventId}/detail`),
      api<{ id: string; name: string; information: string | null; logoUrl: string | null }[]>(
        "/api/admin/companies"
      ),
      api<{ id: string; username: string }[]>("/api/admin/people"),
    ]);
    const found = allEvents.find((e) => e.id === eventId) || null;
    setEvent(found);
    if (found) setBasicsForm(basicsFromEvent(found));
    setData(subData);
    setCompanies(companyRows);
    setPeople(peopleRows.map((u) => ({ id: u.id, username: u.username })));
  }, [eventId]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  // Keep company / people dropdowns fresh on related tabs
  useEffect(() => {
    if (tab === "sponsors" || tab === "partners" || tab === "prizes") {
      api<{ id: string; name: string; information: string | null; logoUrl: string | null }[]>(
        "/api/admin/companies"
      )
        .then((rows) => setCompanies(Array.isArray(rows) ? rows : []))
        .catch(() => {});
    }
    if (tab === "speakers" || tab === "judges" || tab === "hosts" || tab === "sponsors") {
      api<{ id: string; username: string }[]>("/api/admin/people")
        .then((rows) =>
          setPeople(
            Array.isArray(rows) ? rows.map((u) => ({ id: u.id, username: u.username })) : []
          )
        )
        .catch(() => {});
    }
  }, [tab]);

  const createCompanyQuick = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const created = await api<{
      id: string;
      name: string;
      information: string | null;
      logoUrl: string | null;
    }>("/api/admin/companies", {
      method: "POST",
      body: JSON.stringify({ name: trimmed }),
    });
    setCompanies((prev) => {
      if (prev.some((c) => c.id === created.id)) return prev;
      return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
    });
    return created;
  };

  useEffect(() => {
    if (!event) return;
    const competition = isCompetitionEvent(event.type);
    const validTabs: Tab[] = competition
      ? ["basics", "tracks", "sponsors", "partners", "prizes", "schedule", "speakers", "judges", "hosts", "links", "photos"]
      : ["basics", "sponsors", "partners", "schedule", "speakers", "hosts", "links", "photos"];
    if (!validTabs.includes(tab)) {
      setTab(validTabs[0]);
    }
  }, [event, tab]);

  const saveBasics = async () => {
    if (!eventId) return;
    if (!formStr(basicsForm.name).trim() || !formStr(basicsForm.eventDate)) {
      setError("Name and date are required");
      return;
    }
    setSavingBasics(true);
    setError("");
    try {
      await api("/api/admin/events", {
        method: "PUT",
        body: JSON.stringify({
          id: eventId,
          name: basicsForm.name,
          type: basicsForm.type,
          description: basicsForm.description || "",
          theme: basicsForm.theme || "",
          eventDate: basicsForm.eventDate,
          endDate: basicsForm.endDate || null,
          startTime: basicsForm.startTime || null,
          endTime: basicsForm.endTime || null,
          location: basicsForm.location || "",
          locationLat: basicsForm.locationLat || null,
          locationLng: basicsForm.locationLng || null,
          coverImageUrl: basicsForm.coverImageUrl || "",
          coverPageUrl: basicsForm.coverPageUrl || "",
          lumaLinks: (basicsForm.lumaLinks as string[]).map((s) => s.trim()).filter(Boolean),
          eventbriteLinks: (basicsForm.eventbriteLinks as string[])
            .map((s) => s.trim())
            .filter(Boolean),
          groupLink: basicsForm.groupLink || "",
          isPartnerEvent: basicsForm.isPartnerEvent === "true",
          isPublished: true,
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save basics");
    } finally {
      setSavingBasics(false);
    }
  };

  const addEntity = async (entity: string, entityData: Record<string, unknown>) => {
    setError("");
    try {
      await api(`/api/admin/events/${eventId}/detail`, {
        method: "POST",
        body: JSON.stringify({ entity, data: entityData }),
      });
      setEditId(null);

      if (
        (entity === "schedule" || entity === "speaker") &&
        typeof entityData.startTime === "string" &&
        typeof entityData.endTime === "string"
      ) {
        const mins = minutesBetweenIso(entityData.startTime, entityData.endTime);
        const slotMins = defaultMinutes.trim() ? Number(defaultMinutes) : mins;
        if (!defaultMinutes.trim()) setDefaultMinutes(String(mins));
        const nextStartDay = dateInputFromValue(entityData.endTime);
        const nextStartHm = timeInputFromIso(entityData.endTime);
        const nextEnd =
          nextStartDay && nextStartHm && Number.isFinite(slotMins) && slotMins > 0
            ? addMinutesToDayHm(nextStartDay, nextStartHm, slotMins)
            : null;
        setForm({
          eventDay: nextStartDay,
          endDay: nextEnd?.day || nextStartDay,
          startTime: nextStartHm,
          endTime: nextEnd?.hm || "",
        });
        await load();
        return;
      }

      setForm({});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    }
  };

  const updateEntity = async (entity: string, entityId: string, entityData: Record<string, unknown>) => {
    setError("");
    try {
      await api(`/api/admin/events/${eventId}/detail`, {
        method: "PUT",
        body: JSON.stringify({ entity, entityId, data: entityData }),
      });
      setForm({});
      setEditId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const saveEntity = async (entity: string, entityData: Record<string, unknown>) => {
    if (editId) {
      const id = editId;
      if (
        (entity === "schedule" || entity === "speaker") &&
        data &&
        typeof entityData.startTime === "string" &&
        typeof entityData.endTime === "string"
      ) {
        setError("");
        try {
          await api(`/api/admin/events/${eventId}/detail`, {
            method: "PUT",
            body: JSON.stringify({ entity, entityId: id, data: entityData }),
          });
          const kind = entity === "schedule" ? "schedule" : "speakers";
          const items = sortedTimedItems(data[kind] || [], kind, "asc").map((item) =>
            item.id === id
              ? { ...item, startTime: entityData.startTime, endTime: entityData.endTime }
              : item
          );
          const idx = items.findIndex((item) => item.id === id);
          if (idx >= 0) await cascadeFollowing(kind, items, idx);
          setForm({});
          setEditId(null);
          await load();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to update");
        }
        return;
      }
      await updateEntity(entity, id, entityData);
    } else {
      await addEntity(entity, entityData);
    }
  };

  const cascadeFollowing = async (
    kind: "schedule" | "speakers",
    items: Item[],
    fromIndex: number
  ) => {
    const entity = kind === "schedule" ? "schedule" : "speaker";
    for (let i = fromIndex + 1; i < items.length; i++) {
      const prev = items[i - 1];
      const cur = items[i];
      const prevEnd = prev.endTime as string;
      const dur = minutesBetweenIso(cur.startTime as string, cur.endTime as string);
      const newStart = prevEnd;
      const newEnd = addMinutesToIso(newStart, dur);
      if (newStart === cur.startTime && newEnd === cur.endTime) continue;

      const payload =
        entity === "schedule"
          ? {
              topic: cur.topic,
              startTime: newStart,
              endTime: newEnd,
            }
          : {
              userId: cur.userId,
              eventDay: dateInputFromValue(newStart),
              topic: cur.topic,
              startTime: newStart,
              endTime: newEnd,
            };

      await api(`/api/admin/events/${eventId}/detail`, {
        method: "PUT",
        body: JSON.stringify({ entity, entityId: cur.id, data: payload }),
      });
      items[i] = { ...cur, startTime: newStart, endTime: newEnd };
    }
  };

  const patchTimedRow = async (
    kind: "schedule" | "speakers",
    itemId: string,
    patch: { startTime?: string; endTime?: string; minutes?: number }
  ) => {
    if (!data) return;
    const items = [...(data[kind] || [])].sort(
      (a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)
    );
    const index = items.findIndex((row) => row.id === itemId);
    const item = items[index];
    if (!item) return;

    const startIso = (patch.startTime || item.startTime) as string;
    let endIso = (patch.endTime || item.endTime) as string;
    if (patch.minutes != null && patch.minutes > 0) {
      endIso = addMinutesToIso(startIso, patch.minutes);
    }

    setError("");
    try {
      const entity = kind === "schedule" ? "schedule" : "speaker";
      const payload =
        entity === "schedule"
          ? { topic: item.topic, startTime: startIso, endTime: endIso }
          : {
              userId: item.userId,
              eventDay: dateInputFromValue(startIso),
              topic: item.topic,
              startTime: startIso,
              endTime: endIso,
            };
      await api(`/api/admin/events/${eventId}/detail`, {
        method: "PUT",
        body: JSON.stringify({ entity, entityId: item.id, data: payload }),
      });
      items[index] = { ...item, startTime: startIso, endTime: endIso };
      await cascadeFollowing(kind, items, index);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update times");
    }
  };

  const suggestNextSlotTimes = (kind: "schedule" | "speakers", _day: string) => {
    if (!data || editId) return;
    const last = lastTimedItem(data[kind] || [], kind);
    if (!last?.endTime) return;
    const mins = defaultMinutes.trim()
      ? Number(defaultMinutes)
      : minutesBetweenIso(last.startTime as string, last.endTime as string);
    if (!Number.isFinite(mins) || mins <= 0) return;
    if (!defaultMinutes.trim()) {
      setDefaultMinutes(
        String(minutesBetweenIso(last.startTime as string, last.endTime as string))
      );
    }
    const startDay = dateInputFromValue(last.endTime);
    const startHm = timeInputFromIso(last.endTime);
    if (!startDay || !startHm) return;
    const end = addMinutesToDayHm(startDay, startHm, mins);
    setForm((prev) => {
      if (prev.startTime || prev.endTime) return prev;
      return {
        ...prev,
        eventDay: startDay,
        endDay: end.day,
        startTime: startHm,
        endTime: end.hm,
      };
    });
  };

  const startEditItem = (item: Item) => {
    setEditId(item.id as string);
    setError("");
    if (tab === "tracks") {
      setForm({
        name: (item.name as string) || "",
        description: (item.description as string) || "",
      });
      return;
    }
    if (tab === "sponsors") {
      setForm({
        companyId: (item.companyId as string) || "",
        logoUrl: (item.companyLogo as string) || "",
        description: (item.companyInformation as string) || "",
        personIds: Array.isArray(item.representatives)
          ? (item.representatives as Item[])
              .map((r) => r.userId as string)
              .filter(Boolean)
              .join(",")
          : "",
      });
      return;
    }
    if (tab === "partners") {
      setForm({
        companyId: (item.companyId as string) || "",
        logoUrl: (item.companyLogo as string) || "",
        description: (item.companyInformation as string) || "",
        partnerType: (item.partnerType as string) || "",
        customType: (item.customType as string) || "",
      });
      return;
    }
    if (tab === "prizes") {
      setForm({
        companyId: (item.companyId as string) || "",
        sponsorId: (item.sponsorId as string) || "",
        prizeName: (item.prizeName as string) || "",
        placement: (item.placement as string) || "",
        customLabel: (item.customLabel as string) || "",
        amount: (item.amount as string) || "",
      });
      return;
    }
    if (tab === "schedule") {
      setForm({
        eventDay: dateInputFromValue(item.startTime) || event?.eventDate || "",
        endDay: dateInputFromValue(item.endTime) || dateInputFromValue(item.startTime) || "",
        startTime: timeInputFromIso(item.startTime),
        endTime: timeInputFromIso(item.endTime),
        topic: (item.topic as string) || "",
      });
      return;
    }
    if (tab === "speakers") {
      setForm({
        userId: (item.userId as string) || "",
        eventDay:
          dateInputFromValue(item.eventDay) ||
          dateInputFromValue(item.startTime) ||
          event?.eventDate ||
          "",
        endDay: dateInputFromValue(item.endTime) || dateInputFromValue(item.startTime) || "",
        startTime: timeInputFromIso(item.startTime),
        endTime: timeInputFromIso(item.endTime),
        topic: (item.topic as string) || "",
      });
      return;
    }
    if (tab === "judges") {
      setForm({ userId: (item.userId as string) || "" });
      return;
    }
    if (tab === "hosts") {
      setForm({
        userId: (item.userId as string) || "",
        hostType: item.customType ? "custom" : ((item.hostType as string) || "host"),
        customType: (item.customType as string) || "",
        role: (item.role as string) || "",
      });
      return;
    }
    if (tab === "links") {
      setForm({
        label: (item.label as string) || "",
        url: (item.url as string) || "",
      });
      return;
    }
    if (tab === "photos") {
      setForm({
        caption: (item.caption as string) || "",
      });
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({});
    setError("");
  };

  const deleteEntity = async (entity: string, entityId: string) => {
    const message =
      entity === "photo"
        ? "Delete this photo? It will be removed from the gallery and deleted from the event folder."
        : "Delete this item?";
    if (!confirm(message)) return;
    await api(`/api/admin/events/${eventId}/detail`, {
      method: "DELETE",
      body: JSON.stringify({ entity, entityId }),
    });
    load();
  };

  const reassignSpeakers = async () => {
    if (!confirm("Reassign speakers from current time? Speakers whose slot already ended will be skipped.")) return;
    await api(`/api/admin/events/${eventId}/detail`, {
      method: "POST",
      body: JSON.stringify({ entity: "reassign_speakers", data: {} }),
    });
    load();
  };

  const reorderItems = async (orderedIds: string[]) => {
    if (!eventId || tab === "basics") return;
    setError("");
    try {
      await api(`/api/admin/events/${eventId}/detail`, {
        method: "POST",
        body: JSON.stringify({
          entity: "reorder",
          data: { collection: tab, orderedIds },
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder");
    }
  };

  useEffect(() => {
    if (!event || !data || editId) return;
    if (tab !== "schedule" && tab !== "speakers") return;
    if (form.startTime || form.endTime) return;
    const day = form.eventDay || event.eventDate;
    suggestNextSlotTimes(tab === "schedule" ? "schedule" : "speakers", day);
    // Only when switching tabs / data loads — not on every form keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, data, event, editId]);

  if (!event || !data) {
    return <p className="py-12 text-center text-zinc-500">Loading...</p>;
  }

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "basics", label: "Basics", show: true },
    { key: "tracks", label: "Tracks", show: isCompetition },
    { key: "sponsors", label: "Sponsors", show: true },
    { key: "partners", label: "Partners", show: true },
    { key: "prizes", label: "Prizes", show: isCompetition },
    { key: "schedule", label: "Schedule", show: true },
    { key: "speakers", label: "Speakers", show: true },
    { key: "judges", label: "Judges", show: isCompetition },
    { key: "hosts", label: "Hosts / Volunteers", show: true },
    { key: "links", label: "Links", show: true },
    { key: "photos", label: "Photos", show: true },
  ];

  const visibleTabs = tabs.filter((t) => t.show);
  const eventSponsors = data.sponsors;
  const eventDays = eventDayOptions(event);
  const isMultiDay = eventDays.length > 1;

  const renderBasicsForm = () => (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name *">
          <input
            className="input-field"
            value={basicsForm.name || ""}
            onChange={(e) => setBasicsForm({ ...basicsForm, name: e.target.value })}
          />
        </Field>
        <Field label="Type *">
          <select
            className="input-field"
            value={basicsForm.type || "hackathon"}
            onChange={(e) => setBasicsForm({ ...basicsForm, type: e.target.value })}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start Date *">
          <input
            type="date"
            className="input-field"
            value={basicsForm.eventDate || ""}
            onChange={(e) => setBasicsForm({ ...basicsForm, eventDate: e.target.value })}
          />
        </Field>
        <Field label="End Date (multi-day events)">
          <input
            type="date"
            className="input-field"
            value={basicsForm.endDate || ""}
            onChange={(e) => setBasicsForm({ ...basicsForm, endDate: e.target.value })}
          />
        </Field>
        <Field label="Theme">
          <input
            className="input-field"
            value={basicsForm.theme || ""}
            onChange={(e) => setBasicsForm({ ...basicsForm, theme: e.target.value })}
          />
        </Field>
        <Field label="Start Time">
          <input
            type="time"
            className="input-field"
            value={basicsForm.startTime || ""}
            onChange={(e) => setBasicsForm({ ...basicsForm, startTime: e.target.value })}
          />
        </Field>
        <Field label="End Time">
          <input
            type="time"
            className="input-field"
            value={basicsForm.endTime || ""}
            onChange={(e) => setBasicsForm({ ...basicsForm, endTime: e.target.value })}
          />
        </Field>
        <Field label="Location" className="sm:col-span-2">
          <LocationPicker
            value={{
              location: formStr(basicsForm.location),
              locationLat: formStr(basicsForm.locationLat),
              locationLng: formStr(basicsForm.locationLng),
            }}
            onChange={(next) => setBasicsForm({ ...basicsForm, ...next })}
          />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <textarea
            className="input-field"
            rows={3}
            value={basicsForm.description || ""}
            onChange={(e) => setBasicsForm({ ...basicsForm, description: e.target.value })}
          />
        </Field>
        <Field label="Cover Image" className="sm:col-span-2">
          <PasteImageField
            label=""
            imageUrl={formStr(basicsForm.coverImageUrl) || null}
            onImageUrl={(url) => setBasicsForm((prev) => ({ ...prev, coverImageUrl: url }))}
            folder="covers"
            naming="named"
            fileName={eventDisplayName}
            syncFolders={[eventPhotoFolder]}
            syncNames={["cover", sanitizeImageBasename(eventDisplayName)]}
            syncLabel="cover"
            disabled={savingBasics}
          />
        </Field>
        <Field label="Luma links" className="sm:col-span-2">
          <LinkListField
            label=""
            placeholder="https://lu.ma/..."
            values={(basicsForm.lumaLinks as string[]) || [""]}
            onChange={(lumaLinks) => setBasicsForm({ ...basicsForm, lumaLinks })}
          />
        </Field>
        <Field label="Eventbrite links" className="sm:col-span-2">
          <LinkListField
            label=""
            placeholder="https://www.eventbrite.com/..."
            values={(basicsForm.eventbriteLinks as string[]) || [""]}
            onChange={(eventbriteLinks) => setBasicsForm({ ...basicsForm, eventbriteLinks })}
          />
        </Field>
        <Field label="Join group link (Discord / WhatsApp)" className="sm:col-span-2">
          <input
            className="input-field"
            placeholder="https://discord.gg/... or https://chat.whatsapp.com/..."
            value={basicsForm.groupLink || ""}
            onChange={(e) => setBasicsForm({ ...basicsForm, groupLink: e.target.value })}
          />
        </Field>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={basicsForm.isPartnerEvent === "true"}
              onChange={(e) =>
                setBasicsForm({
                  ...basicsForm,
                  isPartnerEvent: e.target.checked ? "true" : "false",
                })
              }
            />
            Partner Event
          </label>
        </div>
      </div>
      <button className="btn-primary" onClick={saveBasics} disabled={savingBasics}>
        {savingBasics ? "Saving..." : "Save basics"}
      </button>
    </div>
  );

  const editBanner = (label: string) =>
    editId ? (
      <p className="sm:col-span-full text-sm text-brand-400">
        Editing {label} —{" "}
        <button type="button" className="underline" onClick={cancelEdit}>
          Cancel
        </button>
      </p>
    ) : null;

  const actionLabel = (addLabel: string, saveLabel: string) =>
    editId ? saveLabel : addLabel;

  const renderAddForm = () => {
    if (tab === "basics") return renderBasicsForm();
    switch (tab) {
      case "tracks":
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {editBanner("track")}
            <Field label="Track name *">
              <input className="input-field" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Description">
              <input className="input-field" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <div className="flex items-end">
              <button className="btn-primary w-full" onClick={() => saveEntity("track", form)} disabled={!form.name}>
                <Plus className="mr-1 h-4 w-4" /> {actionLabel("Add track", "Save track")}
              </button>
            </div>
          </div>
        );
      case "sponsors":
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {editBanner("sponsor")}
            <Field label="Sponsor company *">
              <select
                className="input-field"
                value={form.companyId || ""}
                onChange={(e) => {
                  const company = companies.find((item) => item.id === e.target.value);
                  setForm({
                    ...form,
                    companyId: e.target.value,
                    description: company?.information || "",
                    logoUrl: company?.logoUrl || "",
                  });
                }}
              >
                <option value="">Select company...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="mt-2 flex gap-2">
                <input
                  className="input-field flex-1"
                  placeholder="Or type a new company name"
                  value={form.newCompanyName || ""}
                  onChange={(e) => setForm({ ...form, newCompanyName: e.target.value })}
                />
                <button
                  type="button"
                  className="btn-secondary shrink-0"
                  disabled={!form.newCompanyName?.trim()}
                  onClick={async () => {
                    try {
                      setError("");
                      const created = await createCompanyQuick(form.newCompanyName || "");
                      if (!created) return;
                      setForm({
                        ...form,
                        companyId: created.id,
                        description: created.information || "",
                        logoUrl: created.logoUrl || "",
                        newCompanyName: "",
                      });
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Failed to create company");
                    }
                  }}
                >
                  Create
                </button>
              </div>
              {form.companyId && (
                <div className="mt-2 flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2">
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      alt=""
                      className="h-12 w-12 rounded object-contain bg-zinc-950"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-zinc-800 text-xs text-zinc-500">
                      No logo
                    </div>
                  )}
                  <p className="text-xs text-zinc-400">
                    {form.description ||
                      "No description on this company yet — edit it under Admin → Companies."}
                  </p>
                </div>
              )}
            </Field>
            <Field label="Sponsor representatives">
              <select
                className="input-field"
                value=""
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) return;
                  const selected = (form.personIds || "").split(",").filter(Boolean);
                  if (!selected.includes(id)) {
                    setForm({ ...form, personIds: [...selected, id].join(",") });
                  }
                }}
              >
                <option value="">+ Add representative...</option>
                {people
                  .filter((p) => !(form.personIds || "").split(",").includes(p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.username}</option>
                  ))}
              </select>
              {(form.personIds || "").split(",").filter(Boolean).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(form.personIds || "")
                    .split(",")
                    .filter(Boolean)
                    .map((id) => {
                      const person = people.find((p) => p.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200"
                        >
                          {person?.username || "Unknown"}
                          <button
                            type="button"
                            className="text-zinc-500 hover:text-red-400"
                            onClick={() =>
                              setForm({
                                ...form,
                                personIds: (form.personIds || "")
                                  .split(",")
                                  .filter((x) => x && x !== id)
                                  .join(","),
                              })
                            }
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                </div>
              )}
            </Field>
            <div className="flex items-end">
              <button
                className="btn-primary w-full"
                onClick={() =>
                  saveEntity("sponsor", {
                    companyId: form.companyId,
                    personIds: (form.personIds || "").split(",").filter(Boolean),
                  })
                }
                disabled={!form.companyId}
              >
                <Plus className="mr-1 h-4 w-4" /> {actionLabel("Add sponsor", "Save sponsor")}
              </button>
            </div>
          </div>
        );
      case "partners":
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {editBanner("partner")}
            <Field label="Partner company *">
              <select
                className="input-field"
                value={form.companyId || ""}
                onChange={(e) => {
                  const company = companies.find((item) => item.id === e.target.value);
                  setForm({
                    ...form,
                    companyId: e.target.value,
                    description: company?.information || "",
                    logoUrl: company?.logoUrl || "",
                  });
                }}
              >
                <option value="">Select company...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="mt-2 flex gap-2">
                <input
                  className="input-field flex-1"
                  placeholder="Or type a new company name"
                  value={form.newCompanyName || ""}
                  onChange={(e) => setForm({ ...form, newCompanyName: e.target.value })}
                />
                <button
                  type="button"
                  className="btn-secondary shrink-0"
                  disabled={!form.newCompanyName?.trim()}
                  onClick={async () => {
                    try {
                      setError("");
                      const created = await createCompanyQuick(form.newCompanyName || "");
                      if (!created) return;
                      setForm({
                        ...form,
                        companyId: created.id,
                        description: created.information || "",
                        logoUrl: created.logoUrl || "",
                        newCompanyName: "",
                      });
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Failed to create company");
                    }
                  }}
                >
                  Create
                </button>
              </div>
              {form.companyId && (
                <div className="mt-2 flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2">
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      alt=""
                      className="h-12 w-12 rounded object-contain bg-zinc-950"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-zinc-800 text-xs text-zinc-500">
                      No logo
                    </div>
                  )}
                  <p className="text-xs text-zinc-400">
                    {form.description ||
                      "No description on this company yet — edit it under Admin → Companies."}
                  </p>
                </div>
              )}
            </Field>
            <Field label="Partner type *">
              <select className="input-field" value={form.partnerType || ""} onChange={(e) => setForm({ ...form, partnerType: e.target.value })}>
                <option value="">Select...</option>
                <option value="venue">Venue</option>
                <option value="technology">Technology</option>
                <option value="community">Community</option>
                <option value="media">Media</option>
                <option value="food">Food</option>
                <option value="other">Other</option>
                <option value="custom">Custom</option>
              </select>
            </Field>
            {form.partnerType === "custom" && (
              <Field label="Custom type">
                <input className="input-field" value={form.customType || ""} onChange={(e) => setForm({ ...form, customType: e.target.value })} />
              </Field>
            )}
            <div className="flex items-end">
              <button
                className="btn-primary w-full"
                onClick={() =>
                  saveEntity("partner", {
                    partnerType: form.partnerType,
                    customType: form.customType || null,
                    companyId: form.companyId,
                  })
                }
                disabled={!form.partnerType || !form.companyId}
              >
                <Plus className="mr-1 h-4 w-4" /> {actionLabel("Add partner", "Save partner")}
              </button>
            </div>
          </div>
        );
      case "prizes":
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {editBanner("prize")}
            <Field label="Sponsor company *">
              <select
                className="input-field"
                value={form.companyId || ""}
                onChange={(e) => {
                  const sponsor = eventSponsors.find(
                    (item) => item.companyId === e.target.value
                  );
                  setForm({
                    ...form,
                    companyId: e.target.value,
                    sponsorId: (sponsor?.id as string) || "",
                    prizeName:
                      editId && form.prizeName
                        ? form.prizeName
                        : sponsor
                          ? `Best use of ${sponsor.companyName as string}`
                          : "",
                  });
                }}
              >
                <option value="">Select an event sponsor...</option>
                {eventSponsors.map((sponsor) => (
                  <option key={sponsor.id as string} value={sponsor.companyId as string}>
                    {sponsor.companyName as string}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Prize name *">
              <input className="input-field" placeholder="e.g. Best Overall" value={form.prizeName || ""} onChange={(e) => setForm({ ...form, prizeName: e.target.value })} />
            </Field>
            <Field label="Placement *">
              <select className="input-field" value={form.placement || ""} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
                <option value="">Select...</option>
                <option value="first">1st Place</option>
                <option value="second">2nd Place</option>
                <option value="third">3rd Place</option>
                <option value="winning">Winning</option>
                <option value="custom">Custom</option>
              </select>
            </Field>
            {form.placement === "custom" && (
              <Field label="Custom label">
                <input className="input-field" value={form.customLabel || ""} onChange={(e) => setForm({ ...form, customLabel: e.target.value })} />
              </Field>
            )}
            <Field label="Amount / prize details">
              <input
                className="input-field"
                placeholder="e.g. $500 cash + $400 credits + swag"
                value={form.amount || ""}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
            <div className="flex items-end">
              <button
                className="btn-primary w-full"
                onClick={() =>
                  saveEntity("prize", {
                    prizeName: form.prizeName,
                    placement: form.placement,
                    customLabel: form.customLabel || null,
                    companyId: form.companyId,
                    sponsorId: form.sponsorId || null,
                    amount: form.amount || null,
                  })
                }
                disabled={!form.companyId || !form.prizeName || !form.placement}
              >
                <Plus className="mr-1 h-4 w-4" /> {actionLabel("Add prize", "Save prize")}
              </button>
            </div>
          </div>
        );
      case "schedule": {
        const startDay = form.eventDay || eventDays[0];
        const endDay = form.endDay || startDay;
        const endDayOptions = dayOptionsWith(endDay, eventDays);
        const applyStart = (startTime: string) => {
          const mins = defaultMinutes.trim() ? Number(defaultMinutes) : NaN;
          if (Number.isFinite(mins) && mins > 0 && startTime) {
            const end = addMinutesToDayHm(startDay, startTime, mins);
            setForm({ ...form, startTime, endDay: end.day, endTime: end.hm });
          } else {
            setForm({ ...form, startTime });
          }
        };
        return (
          <div className="space-y-4">
            {editBanner("schedule slot")}
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Default minutes">
                <input
                  type="number"
                  min={1}
                  className="input-field w-28"
                  placeholder="e.g. 15"
                  value={defaultMinutes}
                  onChange={(e) => setDefaultMinutes(e.target.value)}
                />
              </Field>
              <p className="pb-2 text-xs text-zinc-500">
                Used to chain the next slot. End can be on a later day for multi-day events.
              </p>
            </div>
            {!isMultiDay && (
              <p className="text-sm text-zinc-400">
                Day:{" "}
                <span className="font-medium text-zinc-200">{dayOptionLabel(eventDays[0])}</span>
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {isMultiDay && (
                <Field label="Start day *">
                  <select
                    className="input-field"
                    value={startDay}
                    onChange={(e) => {
                      const nextStart = e.target.value;
                      setForm({
                        ...form,
                        eventDay: nextStart,
                        endDay: form.endDay || nextStart,
                        startTime: "",
                        endTime: "",
                      });
                      setTimeout(() => suggestNextSlotTimes("schedule", nextStart), 0);
                    }}
                  >
                    {eventDays.map((day) => (
                      <option key={day} value={day}>{dayOptionLabel(day)}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Start time *">
                <input
                  type="time"
                  className="input-field"
                  value={form.startTime || ""}
                  onChange={(e) => applyStart(e.target.value)}
                />
              </Field>
              {isMultiDay && (
                <Field label="End day *">
                  <select
                    className="input-field"
                    value={endDay}
                    onChange={(e) => setForm({ ...form, endDay: e.target.value })}
                  >
                    {endDayOptions.map((day) => (
                      <option key={day} value={day}>{dayOptionLabel(day)}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="End time *">
                <input
                  type="time"
                  className="input-field"
                  value={form.endTime || ""}
                  onChange={(e) => {
                    const endTime = e.target.value;
                    const startIso = dayTimeToIso(startDay, form.startTime || "00:00");
                    const endIso = dayTimeToIso(endDay, endTime);
                    if (!defaultMinutes.trim() && form.startTime) {
                      const mins = minutesBetweenIso(startIso, endIso);
                      if (mins > 0) setDefaultMinutes(String(mins));
                    }
                    setForm({ ...form, endTime });
                  }}
                />
              </Field>
              <Field label="Topic *" className="sm:col-span-2">
                <input className="input-field" value={form.topic || ""} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
              </Field>
              <div className="flex items-end">
                <button
                  className="btn-primary w-full"
                  onClick={() =>
                    saveEntity("schedule", {
                      startTime: dayTimeToIso(startDay, form.startTime || ""),
                      endTime: dayTimeToIso(endDay, form.endTime || ""),
                      topic: form.topic,
                    })
                  }
                  disabled={!startDay || !endDay || !form.startTime || !form.endTime || !form.topic}
                >
                  <Plus className="mr-1 h-4 w-4" /> {actionLabel("Add slot", "Save slot")}
                </button>
              </div>
            </div>
          </div>
        );
      }
      case "speakers": {
        const startDay = form.eventDay || eventDays[0];
        const endDay = form.endDay || startDay;
        const endDayOptions = dayOptionsWith(endDay, eventDays);
        const applyStart = (startTime: string) => {
          const mins = defaultMinutes.trim() ? Number(defaultMinutes) : NaN;
          if (Number.isFinite(mins) && mins > 0 && startTime) {
            const end = addMinutesToDayHm(startDay, startTime, mins);
            setForm({ ...form, startTime, endDay: end.day, endTime: end.hm });
          } else {
            setForm({ ...form, startTime });
          }
        };
        return (
          <div className="space-y-3">
            {editBanner("speaker")}
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Default minutes">
                <input
                  type="number"
                  min={1}
                  className="input-field w-28"
                  placeholder="e.g. 15"
                  value={defaultMinutes}
                  onChange={(e) => setDefaultMinutes(e.target.value)}
                />
              </Field>
              <p className="pb-2 text-xs text-zinc-500">
                Used to chain the next speaker. End can be on a later day for multi-day events.
              </p>
            </div>
            {!isMultiDay && (
              <p className="text-sm text-zinc-400">
                Day:{" "}
                <span className="font-medium text-zinc-200">{dayOptionLabel(eventDays[0])}</span>
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
              {isMultiDay && (
                <Field label="Start day *">
                  <select
                    className="input-field"
                    value={startDay}
                    onChange={(e) => {
                      const nextStart = e.target.value;
                      setForm({
                        ...form,
                        eventDay: nextStart,
                        endDay: form.endDay || nextStart,
                        startTime: "",
                        endTime: "",
                      });
                      setTimeout(() => suggestNextSlotTimes("speakers", nextStart), 0);
                    }}
                  >
                    {eventDays.map((day) => (
                      <option key={day} value={day}>{dayOptionLabel(day)}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Start time *">
                <input
                  type="time"
                  className="input-field"
                  value={form.startTime || ""}
                  onChange={(e) => applyStart(e.target.value)}
                />
              </Field>
              {isMultiDay && (
                <Field label="End day *">
                  <select
                    className="input-field"
                    value={endDay}
                    onChange={(e) => setForm({ ...form, endDay: e.target.value })}
                  >
                    {endDayOptions.map((day) => (
                      <option key={day} value={day}>{dayOptionLabel(day)}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="End time *">
                <input
                  type="time"
                  className="input-field"
                  value={form.endTime || ""}
                  onChange={(e) => {
                    const endTime = e.target.value;
                    if (!defaultMinutes.trim() && form.startTime) {
                      const mins = minutesBetweenIso(
                        dayTimeToIso(startDay, form.startTime),
                        dayTimeToIso(endDay, endTime)
                      );
                      if (mins > 0) setDefaultMinutes(String(mins));
                    }
                    setForm({ ...form, endTime });
                  }}
                />
              </Field>
              <Field label="Topic *">
                <input className="input-field" value={form.topic || ""} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
              </Field>
              <Field label="Speaker *">
                <select className="input-field" value={form.userId || ""} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                  <option value="">Select from People...</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>{p.username}</option>
                  ))}
                </select>
              </Field>
              <div className="flex items-end">
                <button
                  className="btn-primary w-full"
                  onClick={() =>
                    saveEntity("speaker", {
                      userId: form.userId,
                      eventDay: startDay,
                      startTime: dayTimeToIso(startDay, form.startTime || ""),
                      endTime: dayTimeToIso(endDay, form.endTime || ""),
                      topic: form.topic,
                    })
                  }
                  disabled={!startDay || !endDay || !form.startTime || !form.endTime || !form.topic || !form.userId}
                >
                  <Plus className="mr-1 h-4 w-4" /> {actionLabel("Add speaker", "Save speaker")}
                </button>
              </div>
            </div>
            <button className="btn-secondary text-sm" onClick={reassignSpeakers}>
              <RefreshCw className="mr-1 inline h-3.5 w-3.5" /> Reassign from current time (skip past speakers)
            </button>
          </div>
        );
      }
      case "judges":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {editBanner("judge")}
            <Field label="Person *">
              <select className="input-field" value={form.userId || ""} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                <option value="">Select from People...</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>{p.username}</option>
                ))}
              </select>
            </Field>
            <div className="flex items-end">
              <button className="btn-primary w-full" onClick={() => saveEntity("judge", { userId: form.userId })} disabled={!form.userId}>
                <Plus className="mr-1 h-4 w-4" /> {actionLabel("Add judge", "Save judge")}
              </button>
            </div>
          </div>
        );
      case "hosts":
        return (
          <div className="grid gap-3 sm:grid-cols-3">
            {editBanner("host")}
            <Field label="Person *">
              <select className="input-field" value={form.userId || ""} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                <option value="">Select from People...</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>{p.username}</option>
                ))}
              </select>
            </Field>
            <Field label="Type *">
              <select className="input-field" value={form.hostType || "host"} onChange={(e) => setForm({ ...form, hostType: e.target.value })}>
                <option value="host">Host</option>
                <option value="sponsor">Sponsor</option>
                <option value="venue_partner">Venue Partner</option>
                <option value="volunteer">Volunteer</option>
                <option value="custom">Custom</option>
              </select>
            </Field>
            {form.hostType === "custom" && (
              <Field label="Custom type *">
                <input className="input-field" value={form.customType || ""} onChange={(e) => setForm({ ...form, customType: e.target.value })} />
              </Field>
            )}
            <Field label="Sub role / extra">
              <input
                className="input-field"
                placeholder="e.g. Emcee, Registration lead"
                value={form.role || ""}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </Field>
            <div className="flex items-end">
              <button
                className="btn-primary w-full"
                onClick={() =>
                  saveEntity("host", {
                    userId: form.userId,
                    hostType: form.hostType || "host",
                    customType: form.customType || null,
                    role: form.role || null,
                  })
                }
                disabled={!form.userId || (form.hostType === "custom" && !form.customType)}
              >
                <Plus className="mr-1 h-4 w-4" /> {actionLabel("Add", "Save")}
              </button>
            </div>
          </div>
        );
      case "links":
        return (
          <div className="grid gap-3 sm:grid-cols-3">
            {editBanner("link")}
            <Field label="Label *">
              <input className="input-field" value={form.label || ""} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </Field>
            <Field label="URL *">
              <input className="input-field" value={form.url || ""} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </Field>
            <div className="flex items-end">
              <button className="btn-primary w-full" onClick={() => saveEntity("link", form)} disabled={!form.label || !form.url}>
                <Plus className="mr-1 h-4 w-4" /> {actionLabel("Add link", "Save link")}
              </button>
            </div>
          </div>
        );
      case "photos":
        return (
          <div className="space-y-3">
            {editBanner("photo caption")}
            {!editId && (
              <PasteImageField
                label="Event gallery"
                imageUrl={null}
                onImageUrl={() => {}}
                folder={eventPhotoFolder}
                naming="sequential"
                multiple
                disabled={uploadingPhotos}
                existingUrls={(data?.photos || []).map((p) => p.imageUrl as string)}
                onMultipleUrls={addPhotoUrls}
                onGallerySync={syncGalleryFromFolder}
              />
            )}
            <Field label={editId ? "Caption" : "Optional caption for next upload"}>
              <input className="input-field max-w-sm" value={form.caption || ""} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
            </Field>
            {editId && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => saveEntity("photo", { caption: form.caption || null })}
              >
                Save caption
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderList = () => {
    if (tab === "basics") return null;
    const rawItems = data[tab] || [];
    const items = [...rawItems].sort(
      (a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)
    );
    if (items.length === 0) {
      return <p className="py-6 text-sm text-zinc-500">Nothing added yet for this section.</p>;
    }

    const itemId = (item: Item) => item.id as string;

    return (
      <div>
        {tab === "photos" && items.length > 0 && (
          <p className="mb-3 text-sm text-zinc-500">
            Drag the grip handle to change order. Trash deletes the image file from{" "}
            <code className="text-zinc-400">data/images/{eventPhotoFolder}</code>.
          </p>
        )}
        <SortableList<Item>
          items={items}
          onReorder={reorderItems}
          renderItem={(item: Item, index) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 text-sm text-zinc-200">
                  {tab === "tracks" && (
                    <div>
                      <p className="font-medium text-zinc-100">{item.name as string}</p>
                      {!!item.description && <p className="mt-1 text-zinc-400">{item.description as string}</p>}
                    </div>
                  )}
                  {tab === "sponsors" && (
                    <div className="flex items-start gap-3">
                      {(item.companyLogo as string) ? (
                        <img
                          src={item.companyLogo as string}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded object-contain bg-zinc-950"
                        />
                      ) : null}
                      <div>
                        <p className="font-medium text-zinc-100">{item.companyName as string}</p>
                        {Array.isArray(item.representatives) &&
                          (item.representatives as Item[]).length > 0 && (
                            <p className="text-zinc-400">
                              Representatives:{" "}
                              {(item.representatives as Item[])
                                .map((representative) => representative.username as string)
                                .join(", ")}
                            </p>
                          )}
                        {!!(item.companyInformation as string) && (
                          <p className="mt-1 text-zinc-500">{item.companyInformation as string}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {tab === "partners" && (
                    <div className="flex items-start gap-3">
                      {(item.companyLogo as string) ? (
                        <img
                          src={item.companyLogo as string}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded object-contain bg-zinc-950"
                        />
                      ) : null}
                      <div>
                        <p className="capitalize">
                          {(item.partnerType as string)?.replace(/_/g, " ")}
                          {(item.customType as string) ? ` (${item.customType as string})` : ""}
                          {" — "}
                          {(item.companyName as string) ||
                            companies.find((c) => c.id === item.companyId)?.name ||
                            "Partner"}
                        </p>
                        {!!(item.companyInformation as string) && (
                          <p className="mt-1 text-zinc-500">{item.companyInformation as string}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {tab === "prizes" && (
                    <span>
                      <strong>{item.prizeName as string}</strong>
                      {" — "}
                      {item.placement as string}
                      {item.customLabel ? ` (${item.customLabel as string})` : ""}
                      {item.amount ? ` · ${item.amount}` : ""}
                    </span>
                  )}
                  {tab === "schedule" && (
                    <div className="w-full space-y-2">
                      <p className={`font-medium ${item.isSkipped ? "text-zinc-500 line-through" : ""}`}>
                        {item.topic as string}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {isMultiDay && (
                          <label className="flex items-center gap-1 text-zinc-400">
                            Start day
                            <select
                              className="input-field !w-auto !py-1 !text-xs"
                              value={dateInputFromValue(item.startTime) || eventDays[0]}
                              onChange={(e) => {
                                const mins = minutesBetweenIso(
                                  item.startTime as string,
                                  item.endTime as string
                                );
                                void patchTimedRow("schedule", itemId(item), {
                                  startTime: dayTimeToIso(
                                    e.target.value,
                                    timeInputFromIso(item.startTime)
                                  ),
                                  minutes: mins,
                                });
                              }}
                            >
                              {dayOptionsWith(dateInputFromValue(item.startTime), eventDays).map(
                                (day) => (
                                  <option key={day} value={day}>
                                    {dayOptionLabel(day)}
                                  </option>
                                )
                              )}
                            </select>
                          </label>
                        )}
                        <label className="flex items-center gap-1 text-zinc-400">
                          Start
                          <input
                            type="time"
                            className="input-field !w-auto !py-1 !text-xs"
                            value={timeInputFromIso(item.startTime)}
                            onChange={(e) => {
                              const day = dateInputFromValue(item.startTime) || eventDays[0];
                              const mins = minutesBetweenIso(
                                item.startTime as string,
                                item.endTime as string
                              );
                              void patchTimedRow("schedule", itemId(item), {
                                startTime: dayTimeToIso(day, e.target.value),
                                minutes: mins,
                              });
                            }}
                          />
                        </label>
                        {isMultiDay && (
                          <label className="flex items-center gap-1 text-zinc-400">
                            End day
                            <select
                              className="input-field !w-auto !py-1 !text-xs"
                              value={dateInputFromValue(item.endTime) || eventDays[0]}
                              onChange={(e) => {
                                void patchTimedRow("schedule", itemId(item), {
                                  endTime: dayTimeToIso(
                                    e.target.value,
                                    timeInputFromIso(item.endTime)
                                  ),
                                });
                              }}
                            >
                              {dayOptionsWith(dateInputFromValue(item.endTime), eventDays).map(
                                (day) => (
                                  <option key={day} value={day}>
                                    {dayOptionLabel(day)}
                                  </option>
                                )
                              )}
                            </select>
                          </label>
                        )}
                        <label className="flex items-center gap-1 text-zinc-400">
                          End
                          <input
                            type="time"
                            className="input-field !w-auto !py-1 !text-xs"
                            value={timeInputFromIso(item.endTime)}
                            onChange={(e) => {
                              const day = dateInputFromValue(item.endTime) ||
                                dateInputFromValue(item.startTime) ||
                                eventDays[0];
                              void patchTimedRow("schedule", itemId(item), {
                                endTime: dayTimeToIso(day, e.target.value),
                              });
                            }}
                          />
                        </label>
                        <label className="flex items-center gap-1 text-zinc-400">
                          Mins
                          <input
                            type="number"
                            min={1}
                            className="input-field !w-16 !py-1 !text-xs"
                            defaultValue={minutesBetweenIso(
                              item.startTime as string,
                              item.endTime as string
                            )}
                            key={`${item.id}-mins-${item.startTime}-${item.endTime}`}
                            onBlur={(e) => {
                              const mins = Number(e.target.value);
                              if (!Number.isFinite(mins) || mins <= 0) return;
                              void patchTimedRow("schedule", itemId(item), { minutes: mins });
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                  {tab === "speakers" && (
                    <div className="space-y-2">
                      <p className={`font-medium ${item.isSkipped ? "text-zinc-500 line-through" : ""}`}>
                        {item.username as string} — {item.topic as string}
                        {!!item.isSkipped && <span className="ml-2 text-xs no-underline">(skipped)</span>}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {isMultiDay && (
                          <label className="flex items-center gap-1 text-zinc-400">
                            Start day
                            <select
                              className="input-field !w-auto !py-1 !text-xs"
                              value={
                                dateInputFromValue(item.eventDay) ||
                                dateInputFromValue(item.startTime) ||
                                eventDays[0]
                              }
                              onChange={(e) => {
                                const mins = minutesBetweenIso(
                                  item.startTime as string,
                                  item.endTime as string
                                );
                                void patchTimedRow("speakers", itemId(item), {
                                  startTime: dayTimeToIso(
                                    e.target.value,
                                    timeInputFromIso(item.startTime)
                                  ),
                                  minutes: mins,
                                });
                              }}
                            >
                              {dayOptionsWith(
                                dateInputFromValue(item.startTime) ||
                                  dateInputFromValue(item.eventDay),
                                eventDays
                              ).map((day) => (
                                <option key={day} value={day}>
                                  {dayOptionLabel(day)}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                        <label className="flex items-center gap-1 text-zinc-400">
                          Start
                          <input
                            type="time"
                            className="input-field !w-auto !py-1 !text-xs"
                            value={timeInputFromIso(item.startTime)}
                            onChange={(e) => {
                              const day =
                                dateInputFromValue(item.eventDay) ||
                                dateInputFromValue(item.startTime) ||
                                eventDays[0];
                              const mins = minutesBetweenIso(
                                item.startTime as string,
                                item.endTime as string
                              );
                              void patchTimedRow("speakers", itemId(item), {
                                startTime: dayTimeToIso(day, e.target.value),
                                minutes: mins,
                              });
                            }}
                          />
                        </label>
                        {isMultiDay && (
                          <label className="flex items-center gap-1 text-zinc-400">
                            End day
                            <select
                              className="input-field !w-auto !py-1 !text-xs"
                              value={dateInputFromValue(item.endTime) || eventDays[0]}
                              onChange={(e) => {
                                void patchTimedRow("speakers", itemId(item), {
                                  endTime: dayTimeToIso(
                                    e.target.value,
                                    timeInputFromIso(item.endTime)
                                  ),
                                });
                              }}
                            >
                              {dayOptionsWith(dateInputFromValue(item.endTime), eventDays).map(
                                (day) => (
                                  <option key={day} value={day}>
                                    {dayOptionLabel(day)}
                                  </option>
                                )
                              )}
                            </select>
                          </label>
                        )}
                        <label className="flex items-center gap-1 text-zinc-400">
                          End
                          <input
                            type="time"
                            className="input-field !w-auto !py-1 !text-xs"
                            value={timeInputFromIso(item.endTime)}
                            onChange={(e) => {
                              const day =
                                dateInputFromValue(item.endTime) ||
                                dateInputFromValue(item.startTime) ||
                                eventDays[0];
                              void patchTimedRow("speakers", itemId(item), {
                                endTime: dayTimeToIso(day, e.target.value),
                              });
                            }}
                          />
                        </label>
                        <label className="flex items-center gap-1 text-zinc-400">
                          Mins
                          <input
                            type="number"
                            min={1}
                            className="input-field !w-16 !py-1 !text-xs"
                            defaultValue={minutesBetweenIso(
                              item.startTime as string,
                              item.endTime as string
                            )}
                            key={`${item.id}-mins-${item.startTime}-${item.endTime}`}
                            onBlur={(e) => {
                              const mins = Number(e.target.value);
                              if (!Number.isFinite(mins) || mins <= 0) return;
                              void patchTimedRow("speakers", itemId(item), { minutes: mins });
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                  {tab === "judges" && (
                    <span>{item.username as string}</span>
                  )}
                  {tab === "hosts" && (
                    <span>
                      {item.username as string} —{" "}
                      {(item.customType as string) ||
                        (item.hostType as string)?.replace(/_/g, " ")}
                      {(item.role as string) ? ` · ${item.role as string}` : ""}
                    </span>
                  )}
                  {tab === "links" && (
                    <a href={item.url as string} target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">
                      {item.label as string}
                    </a>
                  )}
                  {tab === "photos" && (
                    <div className="flex items-center gap-4">
                      {(item.imageUrl as string) && (
                        <img
                          src={item.imageUrl as string}
                          alt=""
                          className="h-24 w-36 shrink-0 rounded-lg border border-zinc-700 object-contain bg-zinc-950"
                        />
                      )}
                      <div>
                        <p className="font-medium text-zinc-100">{(item.caption as string) || `Photo ${index + 1}`}</p>
                        <p className="mt-1 text-xs text-zinc-500 break-all">{(item.imageUrl as string) || ""}</p>
                      </div>
                    </div>
                  )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => startEditItem(item)}
                className="text-brand-400 hover:text-brand-300"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => deleteEntity(entityMap[tab], item.id as string)}
                className="text-red-400 hover:text-red-300"
                title={tab === "photos" ? "Delete photo and remove file from folder" : "Delete"}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        />
      </div>
    );
  };

  return (
    <div>
      <Link to="/admin/events" className="inline-flex items-center gap-1 text-sm text-brand-400 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-zinc-100">{event.name}</h1>
      <p className="text-sm capitalize text-zinc-400">
        {event.type.replace(/_/g, " ")}
        {isCompetition
          ? " · Tracks, prizes & judges enabled"
          : " · Workshop/mixer style (no tracks / prizes / judges)"}
      </p>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-zinc-800">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key);
              setForm({});
              setEditId(null);
              setError("");
            }}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "border-b-2 border-brand-500 text-brand-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.label}
            {t.key !== "basics" && (
              <span className="ml-1 text-xs text-zinc-600">
                ({(data[t.key as keyof SubData] || []).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-zinc-500">{TAB_HELP[tab]}</p>
      {tab === "sponsors" && eventSponsors.length === 0 && companies.length === 0 && (
        <p className="mt-2 text-sm text-amber-400">Add sponsor companies under Admin → Companies first.</p>
      )}
      {(tab === "speakers" || tab === "judges" || tab === "hosts") && people.length === 0 && (
        <p className="mt-2 text-sm text-amber-400">Add people under Admin → People first.</p>
      )}

      <div className="card mt-4">{renderAddForm()}</div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <div className="mt-4">{renderList()}</div>
    </div>
  );
}
