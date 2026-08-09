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
  mainRolesForPerson,
  subRolesForPerson,
  eventInvolvementsForPerson,
  involvementsForCompany,
  saveEventRecord,
  syncSponsorRepJudges,
  updateCompany,
  updateEventBasics,
  updatePerson,
  reorderEventCollection,
  type ReorderableCollection,
  getSiteSettings,
  saveSiteSettings,
  publicAdminSettings,
} from "./data/repository.js";
import {
  isCompetitionEvent,
  newId,
  normalizeRoleStatus,
  type EventType,
  type RoleStatus,
} from "./data/types.js";
import { isConfirmed } from "./data/normalize.js";
import { deleteImageByUrl, eventImageFolder, renumberEventGalleryFolder } from "./image-names.js";
import {
  handleImageUpload,
  handleListImages,
  handleLogoUpload,
  handleMultiImageUpload,
  handleResolveImage,
  logoUploadMiddleware,
  multiImageUpload,
  singleImageUpload,
} from "./local-upload.js";
import {
  applyEmailPlaceholders,
  textBodyToHtml,
  sendOutboundEmail,
  brandLogoInlineAttachment,
  EMAIL_PLACEHOLDERS,
} from "./email.js";
import {
  buildCertificatePdfFromText,
  getPitchDeckAttachment,
  hasUploadedPitchDeck,
  savePitchDeckPdf,
} from "./pdfs.js";
import multer from "multer";

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (file.mimetype !== "application/pdf" && !file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(new Error("Only PDF files are allowed"));
      return;
    }
    cb(null, true);
  },
});

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
cmsRouter.get("/resolve-image", handleResolveImage);
cmsRouter.get("/list-images", handleListImages);

// ─── Companies ───────────────────────────────────────────────────────────────

const companySchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  information: z.string().optional().nullable(),
});

cmsRouter.get("/companies", (_req, res) => {
  const events = listEventRecords();
  res.json(
    listCompanies()
      .map((c) => {
        const involvements = involvementsForCompany(c.id, events);
        const kinds = new Set(involvements.map((i) => i.kind));
        const partnerTypes = [
          ...new Set(
            involvements
              .filter((i) => i.kind === "partner" && i.partnerType)
              .map((i) => i.partnerType as string)
          ),
        ];
        const statuses = [...new Set(involvements.map((i) => i.status))];
        const representatives = new Map<
          string,
          {
            userId: string;
            username: string;
            linkedin: string | null;
            statuses: string[];
            events: {
              eventId: string;
              eventName: string;
              status: string;
              kind: string;
              partnerType: string | null;
              eventPublished: boolean;
            }[];
          }
        >();
        for (const inv of involvements) {
          for (const r of inv.representatives) {
            const existing = representatives.get(r.userId);
            const eventEntry = {
              eventId: inv.eventId,
              eventName: inv.eventName,
              status: r.status,
              kind: inv.kind,
              partnerType: inv.partnerType,
              eventPublished: inv.eventPublished,
            };
            if (existing) {
              if (!existing.statuses.includes(r.status)) existing.statuses.push(r.status);
              if (!existing.events.some((e) => e.eventId === inv.eventId && e.kind === inv.kind)) {
                existing.events.push(eventEntry);
              }
            } else {
              representatives.set(r.userId, {
                userId: r.userId,
                username: r.username,
                linkedin: r.linkedin,
                statuses: [r.status],
                events: [eventEntry],
              });
            }
          }
        }
        return {
          ...c,
          involvements,
          kinds: [...kinds],
          partnerTypes,
          statuses,
          representatives: [...representatives.values()].sort((a, b) =>
            a.username.localeCompare(b.username)
          ),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  );
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
    email: parsed.data.email?.trim() || null,
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
    email: parsed.data.email?.trim() || null,
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

const roleAssignmentSchema = z.object({
  role: z.string().min(1),
  subRole: z.string().optional().nullable(),
  status: z.enum(["confirmed", "maybe", "no_response"]),
});

const userSchema = z.object({
  username: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  linkedin: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  companyId: z.string().uuid().optional().nullable().or(z.literal("")),
  roles: z.array(roleAssignmentSchema).optional(),
});

cmsRouter.get("/people", (_req, res) => {
  const events = listEventRecords();
  res.json(
    listPeople()
      .map((p) => {
        const eventInvolvements = eventInvolvementsForPerson(p.id, events);
        const eventMainRoles = [
          ...new Set(eventInvolvements.flatMap((ev) => ev.roles.map((r) => r.mainRole))),
        ].sort((a, b) => a.localeCompare(b));
        return {
          ...p,
          mainRoles: mainRolesForPerson(p.id, events, p),
          subRoles: subRolesForPerson(p.id, events, p),
          eventMainRoles,
          eventInvolvements,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
});

cmsRouter.post("/people", (req, res) => {
  const parsed = userSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid person data — check name and email" });
    return;
  }
  const roles = (parsed.data.roles || []).map((r) => ({
    role: r.role.trim(),
    subRole: r.subRole?.trim() ? r.subRole.trim() : null,
    status: r.status,
  }));
  const row = createPerson({
    username: parsed.data.username.trim(),
    email: parsed.data.email?.trim() || null,
    linkedin: parsed.data.linkedin?.trim() || null,
    title: parsed.data.title?.trim() || null,
    phone: parsed.data.phone?.trim() || null,
    notes: parsed.data.notes?.trim() || null,
    companyName: parsed.data.companyName?.trim() || null,
    companyId: parsed.data.companyId?.trim() || null,
    roles,
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
  const roles = Array.isArray(parsed.data.roles)
    ? parsed.data.roles.map((r) => ({
        role: r.role.trim(),
        subRole: r.subRole?.trim() ? r.subRole.trim() : null,
        status: r.status,
      }))
    : undefined;
  const row = updatePerson(id, {
    username: parsed.data.username.trim(),
    email: parsed.data.email?.trim() || null,
    linkedin: parsed.data.linkedin?.trim() || null,
    title: parsed.data.title?.trim() || null,
    phone: parsed.data.phone?.trim() || null,
    notes: parsed.data.notes?.trim() || null,
    companyName: parsed.data.companyName?.trim() || null,
    companyId: parsed.data.companyId?.trim() || null,
    ...(roles !== undefined ? { roles } : {}),
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
  lumaLinks: z.array(z.string()).optional(),
  eventbriteLinks: z.array(z.string()).optional(),
  lumaLink: z.string().optional().nullable(),
  eventbriteLink: z.string().optional().nullable(),
  groupLink: z.string().optional().nullable(),
  isPartnerEvent: z.boolean().optional(),
  isPublished: z.boolean().optional(),
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
        const repsInput = Array.isArray(data.representatives)
          ? (data.representatives as { userId: string; status?: RoleStatus }[])
          : ((data.personIds as string[]) || []).map((userId: string) => ({
              userId,
              status: undefined as RoleStatus | undefined,
            }));
        const representatives = repsInput.map((r) => ({
          userId: r.userId,
          status: normalizeRoleStatus(r.status),
        }));
        const row = {
          id: newId(),
          companyId: data.companyId as string,
          personId: null as string | null,
          status: normalizeRoleStatus(data.status),
          sortOrder: record.sponsors.length,
          representatives,
        };
        record.sponsors.push(row);
        syncSponsorRepJudges(
          record,
          representatives.map((r) => r.userId),
          [],
          new Map(representatives.map((r) => [r.userId, r.status]))
        );
        saveEventRecord(record);
        rebuild();
        res.status(201).json(row);
        return;
      }
      case "partner": {
        const repsInput = Array.isArray(data.representatives)
          ? (data.representatives as { userId: string; status?: RoleStatus }[])
          : ((data.personIds as string[]) || []).map((userId: string) => ({
              userId,
              status: undefined as RoleStatus | undefined,
            }));
        const companyId = data.companyId || null;
        let customName = data.customName || null;
        if (!companyId && !customName && repsInput[0]?.userId) {
          const person = listPeople().find((p) => p.id === repsInput[0].userId);
          customName = person?.username || null;
        }
        const row = {
          id: newId(),
          companyId,
          customName,
          partnerType: data.partnerType,
          customType: data.customType || null,
          status: normalizeRoleStatus(data.status),
          sortOrder: record.partners.length,
          representatives: repsInput.map((r) => ({
            userId: r.userId,
            status: normalizeRoleStatus(r.status),
          })),
        };
        if (!companyId && row.representatives.length === 0) {
          res.status(400).json({ error: "Individual partners need at least one representative" });
          return;
        }
        if (!companyId && !row.customName) {
          res.status(400).json({ error: "Individual partners need a name or representative" });
          return;
        }
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
          status: normalizeRoleStatus(data.status),
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
          status: normalizeRoleStatus(data.status),
          sortOrder: record.judges.length,
        };
        record.judges.push(row);
        saveEventRecord(record);
        rebuild();
        res.status(201).json(row);
        return;
      }
      case "associated": {
        const row = {
          id: newId(),
          userId: data.userId,
          role: data.role?.trim() ? data.role.trim() : null,
          status: normalizeRoleStatus(data.status),
          sortOrder: (record.associated || []).length,
        };
        if (!record.associated) record.associated = [];
        record.associated.push(row);
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
          status: normalizeRoleStatus(data.status),
          sortOrder: record.hosts.length,
        };
        record.hosts.push(row);
        saveEventRecord(record);
        rebuild();
        res.status(201).json(row);
        return;
      }
      case "staff_role": {
        const row = {
          id: newId(),
          userId: data.userId,
          roleKey: data.roleKey,
          status: normalizeRoleStatus(data.status),
          sortOrder: record.staffRoles.length,
        };
        record.staffRoles.push(row);
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
      case "sync_gallery": {
        const folder = eventImageFolder(record.event.name);
        const urls = renumberEventGalleryFolder(folder);
        const old = [...record.photos].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        record.photos = urls.map((imageUrl, i) => ({
          id: old[i]?.id ?? newId(),
          imageUrl,
          caption: old[i]?.caption ?? null,
          sortOrder: i,
        }));
        saveEventRecord(record);
        rebuild();
        res.json({ success: true, urls, count: urls.length });
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
        const row = record.sponsors.find((s) => s.id === entityId);
        if (!row) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        const repsInput = Array.isArray(data.representatives)
          ? (data.representatives as { userId: string; status?: RoleStatus }[])
          : ((data.personIds as string[]) || []).map((userId: string) => ({
              userId,
              status: undefined as RoleStatus | undefined,
            }));
        const representatives = repsInput.map((r) => ({
          userId: r.userId,
          status: normalizeRoleStatus(r.status),
        }));
        const previous = [
          ...row.representatives.map((r) => r.userId),
          ...(row.personId ? [row.personId] : []),
        ];
        row.companyId = data.companyId;
        row.status = normalizeRoleStatus(data.status ?? row.status);
        row.representatives = representatives;
        row.personId = null;
        syncSponsorRepJudges(
          record,
          representatives.map((r) => r.userId),
          previous,
          new Map(representatives.map((r) => [r.userId, r.status]))
        );
        saveEventRecord(record);
        rebuild();
        res.json(row);
        return;
      }
      case "partner": {
        const row = record.partners.find((p) => p.id === entityId);
        if (!row) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        const repsInput = Array.isArray(data.representatives)
          ? (data.representatives as { userId: string; status?: RoleStatus }[])
          : ((data.personIds as string[]) || []).map((userId: string) => ({
              userId,
              status: undefined as RoleStatus | undefined,
            }));
        row.companyId = data.companyId || null;
        row.customName = data.customName !== undefined ? data.customName || null : row.customName;
        if (!row.companyId && !row.customName && repsInput[0]?.userId) {
          const person = listPeople().find((p) => p.id === repsInput[0].userId);
          row.customName = person?.username || null;
        }
        row.partnerType = data.partnerType;
        row.customType = data.customType || null;
        row.status = normalizeRoleStatus(data.status ?? row.status);
        row.representatives = repsInput.map((r) => ({
          userId: r.userId,
          status: normalizeRoleStatus(r.status),
        }));
        if (!row.companyId && row.representatives.length === 0) {
          res.status(400).json({ error: "Individual partners need at least one representative" });
          return;
        }
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
        row.status = normalizeRoleStatus(data.status ?? row.status);
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
        row.role = data.role !== undefined ? data.role || null : row.role;
        row.status = normalizeRoleStatus(data.status ?? row.status);
        saveEventRecord(record);
        rebuild();
        res.json(row);
        return;
      }
      case "associated": {
        if (!record.associated) record.associated = [];
        const row = record.associated.find((a) => a.id === entityId);
        if (!row) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        row.userId = data.userId;
        row.role = data.role !== undefined ? (data.role?.trim() ? data.role.trim() : null) : row.role;
        row.status = normalizeRoleStatus(data.status ?? row.status);
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
        row.status = normalizeRoleStatus(data.status ?? row.status);
        saveEventRecord(record);
        rebuild();
        res.json(row);
        return;
      }
      case "staff_role": {
        const row = record.staffRoles.find((r) => r.id === entityId);
        if (!row) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        row.userId = data.userId;
        row.roleKey = data.roleKey;
        row.status = normalizeRoleStatus(data.status ?? row.status);
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
      case "associated":
        record.associated = (record.associated || []).filter((a) => a.id !== entityId);
        break;
      case "host":
        record.hosts = record.hosts.filter((h) => h.id !== entityId);
        break;
      case "staff_role":
        record.staffRoles = record.staffRoles.filter((r) => r.id !== entityId);
        break;
      case "link":
        record.links = record.links.filter((l) => l.id !== entityId);
        break;
      case "photo": {
        const row = record.photos.find((p) => p.id === entityId);
        if (row?.imageUrl) {
          deleteImageByUrl(row.imageUrl);
        }
        record.photos = record.photos.filter((p) => p.id !== entityId);
        break;
      }
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

// ─── Site settings (tags + community links) — local CMS only ─────────────────

cmsRouter.get("/settings", (_req, res) => {
  res.json({
    ...publicAdminSettings(),
    emailPlaceholders: EMAIL_PLACEHOLDERS,
    hasPitchDeck: hasUploadedPitchDeck(),
  });
});

cmsRouter.put("/settings", (req, res) => {
  const body = req.body ?? {};
  const next = saveSiteSettings({
    subRoles: Array.isArray(body.subRoles) ? body.subRoles : undefined,
    communityLinks: body.communityLinks,
    emailTemplates: body.emailTemplates,
    smtp: body.smtp,
  });
  rebuild();
  res.json({
    ...publicAdminSettings(),
    emailPlaceholders: EMAIL_PLACEHOLDERS,
    hasPitchDeck: hasUploadedPitchDeck(),
    // ensure response reflects saved non-secret fields
    communityLinks: next.communityLinks,
    emailTemplates: next.emailTemplates,
  });
});

cmsRouter.post("/settings/pitch-deck", pdfUpload.single("file"), (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No PDF uploaded" });
      return;
    }
    savePitchDeckPdf(file.buffer);
    res.json({ success: true, hasPitchDeck: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Upload failed" });
  }
});

function formatEventTime(start: string | null, end: string | null): string {
  const parts = [start, end].filter(Boolean);
  return parts.length ? parts.join(" – ") : "";
}

function buildPlaceholderValues(
  personName: string,
  eventId: string | undefined
): Record<string, string> {
  const values: Record<string, string> = {
    person_name: personName,
    event_name: "",
    event_date: "",
    event_date_clause: "",
    event_time: "",
    event_place: "",
    luma_link: "",
    sponsor_names: "",
    partner_names: "",
    theme: "",
    tracks: "",
  };
  if (!eventId) return values;
  const record = getEventRecord(eventId);
  if (!record) return values;
  const companies = listCompanies();
  const companyById = new Map(companies.map((c) => [c.id, c]));
  const sponsors = record.sponsors
    .map((s) => companyById.get(s.companyId)?.name)
    .filter((n): n is string => Boolean(n));
  const partners = record.partners
    .map((p) => {
      if (p.companyId) return companyById.get(p.companyId)?.name || null;
      return p.customName || null;
    })
    .filter((n): n is string => Boolean(n));
  const luma =
    (record.event.lumaLinks && record.event.lumaLinks[0]) ||
    record.event.lumaLink ||
    "";
  values.event_name = record.event.name || "";
  values.event_date = [record.event.eventDate, record.event.endDate]
    .filter(Boolean)
    .join(" – ");
  values.event_date_clause = values.event_date ? ` on ${values.event_date}` : "";
  values.event_time = formatEventTime(record.event.startTime, record.event.endTime);
  values.event_place = record.event.location || "";
  values.luma_link = luma;
  values.sponsor_names = [...new Set(sponsors)].join(", ");
  values.partner_names = [...new Set(partners)].join(", ");
  values.theme = record.event.theme || "";
  values.tracks = record.tracks.map((t) => t.name).filter(Boolean).join(", ");
  return values;
}

type TemplateKey = keyof ReturnType<typeof getSiteSettings>["emailTemplates"];

const EMAIL_KIND_TO_TEMPLATE: Record<string, TemplateKey> = {
  sponsorship_request: "sponsorshipRequest",
  speaker_invite: "speakerInvite",
  judge_invite: "judgeInvite",
  judge_speaker_invite: "judgeSpeakerInvite",
  judge_certification: "judgeCertification",
  speaker_certification: "speakerCertification",
  judge_speaker_certification: "judgeSpeakerCertification",
};

const EVENT_REQUIRED_KINDS = new Set(Object.keys(EMAIL_KIND_TO_TEMPLATE));

const CERT_TEMPLATE_KEYS = new Set([
  "judgeCertification",
  "speakerCertification",
  "judgeSpeakerCertification",
]);

const INVITE_OR_CERT_KINDS = new Set([
  "speaker_invite",
  "judge_invite",
  "judge_speaker_invite",
  "judge_certification",
  "speaker_certification",
  "judge_speaker_certification",
]);

cmsRouter.post("/emails/send", async (req, res) => {
  try {
    const {
      personId,
      kind,
      eventId,
      toEmail,
      subject: subjectOverride,
      body: bodyOverride,
    } = req.body ?? {};

    const person = listPeople().find((p) => p.id === personId);
    if (!person) {
      res.status(404).json({ error: "Person not found" });
      return;
    }
    const to = (toEmail || person.email || "").trim();
    if (!to) {
      res.status(400).json({ error: "No email address — add one on the person or enter To:" });
      return;
    }

    const kindKey = String(kind || "");
    const settings = getSiteSettings();
    const placeholders = buildPlaceholderValues(person.username, eventId);

    if (EVENT_REQUIRED_KINDS.has(kindKey) && !eventId) {
      res.status(400).json({ error: "Select an event so placeholders can be filled" });
      return;
    }

    const JUDGE_SPEAKER_KINDS = new Set([
      "speaker_invite",
      "judge_invite",
      "judge_speaker_invite",
      "judge_certification",
      "speaker_certification",
      "judge_speaker_certification",
    ]);
    if (JUDGE_SPEAKER_KINDS.has(kindKey)) {
      const record = eventId ? getEventRecord(eventId) : null;
      if (!record || !isCompetitionEvent(record.event.type)) {
        res.status(400).json({
          error: "Judge and speaker emails are only for hackathons and pitch competitions",
        });
        return;
      }
    }

    let subject = "";
    let body = "";
    const attachments: {
      filename: string;
      content: Buffer;
      contentType?: string;
      cid?: string;
      contentDisposition?: "inline" | "attachment";
    }[] = [];

    const templateKey = EMAIL_KIND_TO_TEMPLATE[kindKey];
    if (templateKey) {
      const draft = settings.emailTemplates[templateKey];
      subject = applyEmailPlaceholders(draft.subject, placeholders);
      body = applyEmailPlaceholders(draft.body, placeholders);
      if (kindKey === "sponsorship_request") {
        attachments.push(await getPitchDeckAttachment());
      }
      if (CERT_TEMPLATE_KEYS.has(templateKey)) {
        const certText = applyEmailPlaceholders(
          draft.certificateText || "",
          placeholders
        );
        if (!certText.trim()) {
          res.status(400).json({
            error: "Certificate text is empty — edit it in Settings → Email drafts",
          });
          return;
        }
        const cert = await buildCertificatePdfFromText({ certificateText: certText });
        const label =
          kindKey === "speaker_certification"
            ? "Speaker"
            : kindKey === "judge_speaker_certification"
              ? "Judge-Speaker"
              : "Judge";
        attachments.push({
          filename: `${label}-Certificate-${person.username.replace(/[^\w.-]+/g, "-")}.pdf`,
          content: cert,
          contentType: "application/pdf",
        });
      }
    } else if (kindKey === "other") {
      subject = String(subjectOverride || "").trim();
      body = String(bodyOverride || "").trim();
      if (!subject || !body) {
        res.status(400).json({ error: "Subject and body are required for Other emails" });
        return;
      }
      subject = applyEmailPlaceholders(subject, placeholders);
      body = applyEmailPlaceholders(body, placeholders);
    } else {
      res.status(400).json({ error: "Unknown email kind" });
      return;
    }

    const includeLogo = INVITE_OR_CERT_KINDS.has(kindKey);
    if (includeLogo) {
      const logo = brandLogoInlineAttachment();
      if (logo) attachments.push(logo);
    }

    const sent = await sendOutboundEmail({
      to,
      subject,
      text: body,
      html: textBodyToHtml(body, { includeLogo }),
      attachments,
    });
    if (!sent) {
      res.status(500).json({
        error: "Could not send email — check SMTP settings in server/.env",
      });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** Preview placeholder substitution without sending. */
cmsRouter.post("/emails/preview", (req, res) => {
  try {
    const { personId, kind, eventId, subject, body } = req.body ?? {};
    const person = listPeople().find((p) => p.id === personId);
    if (!person) {
      res.status(404).json({ error: "Person not found" });
      return;
    }
    const settings = getSiteSettings();
    const placeholders = buildPlaceholderValues(person.username, eventId);
    const kindKey = String(kind || "");
    const templateKey = EMAIL_KIND_TO_TEMPLATE[kindKey];
    let subj = "";
    let text = "";
    let certificateText = "";
    if (templateKey) {
      const draft = settings.emailTemplates[templateKey];
      subj = draft.subject;
      text = draft.body;
      if (CERT_TEMPLATE_KEYS.has(templateKey)) {
        certificateText = draft.certificateText || "";
      }
    } else {
      subj = String(subject || "");
      text = String(body || "");
    }
    res.json({
      subject: applyEmailPlaceholders(subj, placeholders),
      body: applyEmailPlaceholders(text, placeholders),
      certificateText: certificateText
        ? applyEmailPlaceholders(certificateText, placeholders)
        : "",
      placeholders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
