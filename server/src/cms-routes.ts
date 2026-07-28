import { Router } from "express";
import { z } from "zod";
import {
  adminEventDetail,
  buildDerivedData,
  createCompany,
  createEvent,
  createPerson,
  deleteCompany,
  deleteEvent,
  deletePerson,
  getEventRecord,
  listCompanies,
  listEventRecords,
  listPeople,
  saveEventRecord,
  syncSponsorRepJudges,
  updateCompany,
  updateEventBasics,
  updatePerson,
  reorderEventCollection,
  type ReorderableCollection,
} from "./data/repository.js";
import { isCompetitionEvent, newId, type EventType } from "./data/types.js";
import {
  handleImageUpload,
  handleLogoUpload,
  handleMultiImageUpload,
  logoUploadMiddleware,
  multiImageUpload,
  singleImageUpload,
} from "./local-upload.js";

export const cmsRouter = Router();

function rebuild() {
  try {
    buildDerivedData();
  } catch (err) {
    console.error("buildDerivedData failed:", err);
  }
}

cmsRouter.post("/upload-logo", logoUploadMiddleware, (req, res) => {
  handleLogoUpload(req, res).then(rebuild);
});
cmsRouter.post("/upload-image", singleImageUpload, (req, res) => {
  handleImageUpload(req, res).then(rebuild);
});
cmsRouter.post("/upload-images", multiImageUpload, (req, res) => {
  handleMultiImageUpload(req, res).then(rebuild);
});

// ─── Companies ───────────────────────────────────────────────────────────────

const companySchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  information: z.string().optional().nullable(),
});

cmsRouter.get("/companies", (_req, res) => {
  res.json(listCompanies().sort((a, b) => a.name.localeCompare(b.name)));
});

cmsRouter.post("/companies", (req, res) => {
  const parsed = companySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const row = createCompany({
    name: parsed.data.name.trim(),
    logoUrl: parsed.data.logoUrl?.trim() || null,
    website: parsed.data.website?.trim() || null,
    linkedin: parsed.data.linkedin?.trim() || null,
    information: parsed.data.information?.trim() || null,
  });
  rebuild();
  res.status(201).json(row);
});

cmsRouter.put("/companies", (req, res) => {
  const { id, ...data } = req.body ?? {};
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }
  const parsed = companySchema.safeParse(data);
  if (!parsed.success) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const row = updateCompany(id, {
    name: parsed.data.name.trim(),
    logoUrl: parsed.data.logoUrl?.trim() || null,
    website: parsed.data.website?.trim() || null,
    linkedin: parsed.data.linkedin?.trim() || null,
    information: parsed.data.information?.trim() || null,
  });
  if (!row) {
    res.status(404).json({ error: "Company not found" });
    return;
  }
  rebuild();
  res.json(row);
});

cmsRouter.delete("/companies", (req, res) => {
  const { id } = req.body ?? {};
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }
  deleteCompany(id);
  rebuild();
  res.json({ success: true });
});

// ─── People ──────────────────────────────────────────────────────────────────

const userSchema = z.object({
  username: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  linkedin: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
});

cmsRouter.get("/people", (_req, res) => {
  res.json(
    listPeople()
      .map((p) => ({ ...p }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
});

cmsRouter.post("/people", (req, res) => {
  const parsed = userSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid person data — check name and email" });
    return;
  }
  const row = createPerson({
    username: parsed.data.username.trim(),
    email: parsed.data.email?.trim() || null,
    linkedin: parsed.data.linkedin?.trim() || null,
    title: parsed.data.title?.trim() || null,
    phone: parsed.data.phone?.trim() || null,
    companyName: parsed.data.companyName?.trim() || null,
  });
  rebuild();
  res.status(201).json(row);
});

cmsRouter.put("/people", (req, res) => {
  const { id, ...data } = req.body ?? {};
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }
  const parsed = userSchema.safeParse(data);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid person data" });
    return;
  }
  const row = updatePerson(id, {
    username: parsed.data.username.trim(),
    email: parsed.data.email?.trim() || null,
    linkedin: parsed.data.linkedin?.trim() || null,
    title: parsed.data.title?.trim() || null,
    phone: parsed.data.phone?.trim() || null,
    companyName: parsed.data.companyName?.trim() || null,
  });
  if (!row) {
    res.status(404).json({ error: "Person not found" });
    return;
  }
  rebuild();
  res.json(row);
});

cmsRouter.delete("/people", (req, res) => {
  const { id } = req.body ?? {};
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }
  deletePerson(id);
  rebuild();
  res.json({ success: true });
});

// ─── Events ──────────────────────────────────────────────────────────────────

const eventSchema = z.object({
  name: z.string().min(1),
  type: z.enum([
    "hackathon",
    "pitch_competition",
    "workshop",
    "mixer",
    "dinner",
    "demo",
    "other",
  ]),
  eventDate: z.string().min(1),
  description: z.string().optional().nullable(),
  theme: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  locationLat: z.string().optional().nullable(),
  locationLng: z.string().optional().nullable(),
  coverImageUrl: z.string().optional().nullable(),
  coverPageUrl: z.string().optional().nullable(),
  lumaLink: z.string().optional().nullable(),
  eventbriteLink: z.string().optional().nullable(),
  groupLink: z.string().optional().nullable(),
  isPartnerEvent: z.boolean().optional(),
});

cmsRouter.get("/events", (_req, res) => {
  res.json(listEventRecords().map((r) => r.event));
});

cmsRouter.post("/events", (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const record = createEvent(parsed.data);
  rebuild();
  res.status(201).json(record.event);
});

cmsRouter.put("/events", (req, res) => {
  const { id, ...body } = req.body ?? {};
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }
  const parsed = eventSchema.partial().safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const record = updateEventBasics(id, parsed.data as Record<string, unknown>);
  if (!record) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  rebuild();
  res.json(record.event);
});

cmsRouter.delete("/events", (req, res) => {
  const { id } = req.body ?? {};
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }
  deleteEvent(id);
  rebuild();
  res.json({ success: true });
});

cmsRouter.get("/requests", (_req, res) => {
  // Request submissions are emailed only; no stored inbox.
  res.json([]);
});

// ─── Event detail ────────────────────────────────────────────────────────────

cmsRouter.get("/events/:id/detail", (req, res) => {
  const record = getEventRecord(req.params.id);
  if (!record) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.json(adminEventDetail(record));
});

cmsRouter.post("/events/:id/detail", (req, res) => {
  try {
    const record = getEventRecord(req.params.id);
    if (!record) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    const { entity, data } = req.body ?? {};

    switch (entity) {
      case "track": {
        const row = {
          id: newId(),
          name: data.name,
          description: data.description || null,
          sortOrder: record.tracks.length,
        };
        record.tracks.push(row);
        saveEventRecord(record);
        rebuild();
        res.status(201).json(row);
        return;
      }
      case "sponsor": {
        const { personIds = [], companyId } = data as {
          personIds?: string[];
          companyId: string;
        };
        const row = {
          id: newId(),
          companyId,
          personId: null as string | null,
          sortOrder: record.sponsors.length,
          representatives: personIds.map((userId) => ({ userId })),
        };
        record.sponsors.push(row);
        syncSponsorRepJudges(record, personIds, []);
        saveEventRecord(record);
        rebuild();
        res.status(201).json({ ...row, personIds });
        return;
      }
      case "partner": {
        const row = {
          id: newId(),
          companyId: data.companyId || null,
          customName: null,
          partnerType: data.partnerType,
          customType: data.customType || null,
          sortOrder: record.partners.length,
        };
        record.partners.push(row);
        saveEventRecord(record);
        rebuild();
        res.status(201).json(row);
        return;
      }
      case "prize": {
        const row = {
          id: newId(),
          trackId: data.trackId || null,
          sponsorId: data.sponsorId || null,
          companyId: data.companyId || null,
          placement: data.placement,
          customLabel: data.customLabel || null,
          prizeName: data.prizeName,
          amount: data.amount || null,
          currency: data.currency || null,
          sortOrder: record.prizes.length,
        };
        record.prizes.push(row);
        saveEventRecord(record);
        rebuild();
        res.status(201).json(row);
        return;
      }
      case "schedule": {
        const row = {
          id: newId(),
          startTime: new Date(data.startTime).toISOString(),
          endTime: new Date(data.endTime).toISOString(),
          topic: data.topic,
          sortOrder: record.schedule.length,
          isSkipped: false,
          speakers: [] as { id: string; userId: string; sortOrder: number }[],
        };
        record.schedule.push(row);
        saveEventRecord(record);
        rebuild();
        res.status(201).json(row);
        return;
      }
      case "schedule_speaker": {
        const item = record.schedule.find((s) => s.id === data.scheduleItemId);
        if (!item) {
          res.status(404).json({ error: "Schedule item not found" });
          return;
        }
        const row = {
          id: newId(),
          userId: data.userId,
          sortOrder: item.speakers.length,
        };
        item.speakers.push(row);
        saveEventRecord(record);
        rebuild();
        res.status(201).json(row);
        return;
      }
      case "speaker": {
        const row = {
          id: newId(),
          userId: data.userId,
          eventDay: data.eventDay || null,
          startTime: data.startTime ? new Date(data.startTime).toISOString() : null,
          endTime: data.endTime ? new Date(data.endTime).toISOString() : null,
          topic: data.topic || null,
          isSkipped: false,
          sortOrder: record.speakers.length,
        };
        record.speakers.push(row);
        saveEventRecord(record);
        rebuild();
        res.status(201).json(row);
        return;
      }
      case "judge": {
        const row = {
          id: newId(),
          userId: data.userId,
          role: data.role || null,
          sortOrder: record.judges.length,
        };
        record.judges.push(row);
        saveEventRecord(record);
        rebuild();
        res.status(201).json(row);
        return;
      }
      case "host": {
        const row = {
          id: newId(),
          userId: data.userId,
          hostType: (data.hostType === "custom" ? "other" : data.hostType) as
            | "host"
            | "sponsor"
            | "venue_partner"
            | "volunteer"
            | "other",
          customType: data.hostType === "custom" ? data.customType : null,
          role: data.role?.trim() ? data.role.trim() : null,
          sortOrder: record.hosts.length,
        };
        record.hosts.push(row);
        saveEventRecord(record);
        rebuild();
        res.status(201).json(row);
        return;
      }
      case "link": {
        const row = {
          id: newId(),
          label: data.label,
          url: data.url,
          sortOrder: record.links.length,
        };
        record.links.push(row);
        saveEventRecord(record);
        rebuild();
        res.status(201).json(row);
        return;
      }
      case "photo": {
        const row = {
          id: newId(),
          imageUrl: data.imageUrl,
          caption: data.caption || null,
          sortOrder: record.photos.length,
        };
        record.photos.push(row);
        saveEventRecord(record);
        rebuild();
        res.status(201).json(row);
        return;
      }
      case "reassign_speakers": {
        const now = new Date();
        for (const speaker of record.speakers) {
          speaker.isSkipped = speaker.endTime ? new Date(speaker.endTime) < now : false;
        }
        saveEventRecord(record);
        rebuild();
        res.json({ success: true, reassignedAt: now });
        return;
      }
      case "reassign_schedule": {
        const now = new Date();
        record.liveState = { liveReassignmentAt: now.toISOString() };
        for (const item of record.schedule) {
          item.isSkipped = new Date(item.endTime) < now;
        }
        saveEventRecord(record);
        rebuild();
        res.json({ success: true, reassignedAt: now });
        return;
      }
      case "reorder_schedule": {
        const { items } = data as { items: { id: string; sortOrder: number }[] };
        for (const item of items) {
          const row = record.schedule.find((s) => s.id === item.id);
          if (row) row.sortOrder = item.sortOrder;
        }
        saveEventRecord(record);
        rebuild();
        res.json({ success: true });
        return;
      }
      case "reorder": {
        const { collection, orderedIds } = data as {
          collection: ReorderableCollection;
          orderedIds: string[];
        };
        if (!collection || !Array.isArray(orderedIds)) {
          res.status(400).json({ error: "collection and orderedIds required" });
          return;
        }
        reorderEventCollection(record, collection, orderedIds);
        saveEventRecord(record);
        rebuild();
        res.json({ success: true });
        return;
      }
      default:
        res.status(400).json({ error: "Unknown entity" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

cmsRouter.put("/events/:id/detail", (req, res) => {
  try {
    const record = getEventRecord(req.params.id);
    if (!record) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    const { entity, entityId, data } = req.body ?? {};
    if (!entityId) {
      res.status(400).json({ error: "entityId required" });
      return;
    }

    switch (entity) {
      case "track": {
        const row = record.tracks.find((t) => t.id === entityId);
        if (!row) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        row.name = data.name;
        row.description = data.description || null;
        saveEventRecord(record);
        rebuild();
        res.json(row);
        return;
      }
      case "sponsor": {
        const { personIds = [], companyId } = data as {
          personIds?: string[];
          companyId: string;
        };
        const row = record.sponsors.find((s) => s.id === entityId);
        if (!row) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        const previous = [
          ...row.representatives.map((r) => r.userId),
          ...(row.personId ? [row.personId] : []),
        ];
        row.companyId = companyId;
        row.representatives = personIds.map((userId) => ({ userId }));
        row.personId = null;
        syncSponsorRepJudges(record, personIds, previous);
        saveEventRecord(record);
        rebuild();
        res.json({ ...row, personIds });
        return;
      }
      case "partner": {
        const row = record.partners.find((p) => p.id === entityId);
        if (!row) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        row.companyId = data.companyId;
        row.partnerType = data.partnerType;
        row.customType = data.customType || null;
        saveEventRecord(record);
        rebuild();
        res.json(row);
        return;
      }
      case "prize": {
        const row = record.prizes.find((p) => p.id === entityId);
        if (!row) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        Object.assign(row, {
          prizeName: data.prizeName,
          placement: data.placement,
          customLabel: data.customLabel || null,
          companyId: data.companyId || null,
          sponsorId: data.sponsorId || null,
          amount: data.amount || null,
        });
        saveEventRecord(record);
        rebuild();
        res.json(row);
        return;
      }
      case "schedule": {
        const row = record.schedule.find((s) => s.id === entityId);
        if (!row) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        row.topic = data.topic;
        row.startTime = new Date(data.startTime).toISOString();
        row.endTime = new Date(data.endTime).toISOString();
        saveEventRecord(record);
        rebuild();
        res.json(row);
        return;
      }
      case "speaker": {
        const row = record.speakers.find((s) => s.id === entityId);
        if (!row) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        row.userId = data.userId;
        row.eventDay = data.eventDay || null;
        row.topic = data.topic || null;
        row.startTime = data.startTime ? new Date(data.startTime).toISOString() : null;
        row.endTime = data.endTime ? new Date(data.endTime).toISOString() : null;
        saveEventRecord(record);
        rebuild();
        res.json(row);
        return;
      }
      case "judge": {
        const row = record.judges.find((j) => j.id === entityId);
        if (!row) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        row.userId = data.userId;
        saveEventRecord(record);
        rebuild();
        res.json(row);
        return;
      }
      case "host": {
        const row = record.hosts.find((h) => h.id === entityId);
        if (!row) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        row.userId = data.userId;
        row.hostType = data.hostType === "custom" ? "other" : data.hostType;
        row.customType = data.hostType === "custom" ? data.customType : null;
        row.role = data.role?.trim() ? data.role.trim() : null;
        saveEventRecord(record);
        rebuild();
        res.json(row);
        return;
      }
      case "link": {
        const row = record.links.find((l) => l.id === entityId);
        if (!row) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        row.label = data.label;
        row.url = data.url;
        saveEventRecord(record);
        rebuild();
        res.json(row);
        return;
      }
      case "photo": {
        const row = record.photos.find((p) => p.id === entityId);
        if (!row) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        row.caption = data.caption || null;
        saveEventRecord(record);
        rebuild();
        res.json(row);
        return;
      }
      default:
        res.status(400).json({ error: "Unknown entity" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

cmsRouter.delete("/events/:id/detail", (req, res) => {
  try {
    const record = getEventRecord(req.params.id);
    if (!record) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    const { entity, entityId } = req.body ?? {};

    switch (entity) {
      case "track":
        record.tracks = record.tracks.filter((t) => t.id !== entityId);
        break;
      case "sponsor": {
        const sponsor = record.sponsors.find((s) => s.id === entityId);
        const previous = sponsor
          ? [
              ...sponsor.representatives.map((r) => r.userId),
              ...(sponsor.personId ? [sponsor.personId] : []),
            ]
          : [];
        record.sponsors = record.sponsors.filter((s) => s.id !== entityId);
        if (isCompetitionEvent(record.event.type as EventType)) {
          syncSponsorRepJudges(record, [], previous);
        }
        break;
      }
      case "partner":
        record.partners = record.partners.filter((p) => p.id !== entityId);
        break;
      case "prize":
        record.prizes = record.prizes.filter((p) => p.id !== entityId);
        break;
      case "schedule":
        record.schedule = record.schedule.filter((s) => s.id !== entityId);
        break;
      case "speaker":
        record.speakers = record.speakers.filter((s) => s.id !== entityId);
        break;
      case "judge":
        record.judges = record.judges.filter((j) => j.id !== entityId);
        break;
      case "host":
        record.hosts = record.hosts.filter((h) => h.id !== entityId);
        break;
      case "link":
        record.links = record.links.filter((l) => l.id !== entityId);
        break;
      case "photo":
        record.photos = record.photos.filter((p) => p.id !== entityId);
        break;
      default:
        res.status(400).json({ error: "Unknown entity" });
        return;
    }
    saveEventRecord(record);
    rebuild();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
