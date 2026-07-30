/**
 * One-time migration: export Supabase Postgres content into data/ JSON + images.
 * Requires DATABASE_URL (and optionally SUPABASE_URL for downloading storage images).
 *
 * Usage: npx tsx server/src/scripts/export-to-json.ts
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { eventImageFolder } from "../image-names.js";
import { normalizeLinkList } from "../data/types.js";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  companies,
  users,
  events,
  tracks,
  eventSponsors,
  eventSponsorRepresentatives,
  eventPartners,
  prizes,
  scheduleItems,
  scheduleSpeakers,
  eventSpeakers,
  eventJudges,
  eventHosts,
  eventLinks,
  eventPhotos,
  scheduleLiveState,
} from "../db/schema.js";
import {
  DATA_DIR,
  EVENTS_DIR,
  IMAGES_DIR,
  buildDerivedData,
  saveCompanies,
  savePeople,
  saveEventRecord,
} from "../data/repository.js";
import type { EventRecord, Company, Person } from "../data/types.js";

async function downloadImage(url: string, destPath: string): Promise<string | null> {
  try {
    if (!url || url.startsWith("data:")) {
      if (url.startsWith("data:")) {
        const match = /^data:([^;]+);base64,(.+)$/.exec(url);
        if (!match) return null;
        const ext = match[1].includes("png")
          ? "png"
          : match[1].includes("webp")
            ? "webp"
            : match[1].includes("gif")
              ? "gif"
              : "jpg";
        const file = `${destPath}.${ext}`;
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, Buffer.from(match[2], "base64"));
        return `/images/${path.relative(IMAGES_DIR, file).replace(/\\/g, "/")}`;
      }
      return null;
    }
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("Failed to download", url, res.status);
      return url; // keep remote URL as fallback
    }
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : contentType.includes("gif")
          ? "gif"
          : "jpg";
    const file = `${destPath}.${ext}`;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(file, buf);
    return `/images/${path.relative(IMAGES_DIR, file).replace(/\\/g, "/")}`;
  } catch (err) {
    console.warn("Image download error", url, err);
    return url;
  }
}

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required for export");
    process.exit(1);
  }

  fs.mkdirSync(EVENTS_DIR, { recursive: true });
  fs.mkdirSync(path.join(IMAGES_DIR, "companies"), { recursive: true });
  fs.mkdirSync(path.join(IMAGES_DIR, "events"), { recursive: true });

  console.log("Exporting companies...");
  const companyRows = await db.select().from(companies);
  const exportedCompanies: Company[] = [];
  for (const c of companyRows) {
    let logoUrl = c.logoUrl;
    if (logoUrl) {
      logoUrl = await downloadImage(logoUrl, path.join(IMAGES_DIR, "companies", c.id));
    }
    exportedCompanies.push({
      id: c.id,
      name: c.name,
      logoUrl,
      website: c.website,
      linkedin: c.linkedin,
      information: c.information,
      createdAt: iso(c.createdAt)!,
      updatedAt: iso(c.updatedAt)!,
    });
  }
  saveCompanies(exportedCompanies);
  console.log(`  ${exportedCompanies.length} companies`);

  console.log("Exporting people...");
  const peopleRows = await db.select().from(users);
  const exportedPeople: Person[] = peopleRows.map((p) => ({
    id: p.id,
    username: p.username,
    email: p.email,
    linkedin: p.linkedin,
    role: p.role,
    title: p.title,
    phone: p.phone,
    companyId: p.companyId,
    companyName: p.companyName,
    createdAt: iso(p.createdAt)!,
    updatedAt: iso(p.updatedAt)!,
  }));
  savePeople(exportedPeople);
  console.log(`  ${exportedPeople.length} people`);

  console.log("Exporting events...");
  const eventRows = await db.select().from(events);
  for (const event of eventRows) {
    const slugDir = path.join(IMAGES_DIR, eventImageFolder(event.name));
    fs.mkdirSync(slugDir, { recursive: true });

    let coverImageUrl = event.coverImageUrl;
    if (coverImageUrl) {
      coverImageUrl = await downloadImage(coverImageUrl, path.join(slugDir, "cover"));
    }
    let coverPageUrl = event.coverPageUrl;
    if (coverPageUrl) {
      coverPageUrl = await downloadImage(coverPageUrl, path.join(slugDir, "cover-page"));
    }

    const [
      eventTracks,
      sponsorRows,
      partnerRows,
      prizeRows,
      scheduleRows,
      speakerRows,
      judgeRows,
      hostRows,
      linkRows,
      photoRows,
      liveRows,
    ] = await Promise.all([
      db.select().from(tracks).where(eq(tracks.eventId, event.id)),
      db.select().from(eventSponsors).where(eq(eventSponsors.eventId, event.id)),
      db.select().from(eventPartners).where(eq(eventPartners.eventId, event.id)),
      db.select().from(prizes).where(eq(prizes.eventId, event.id)),
      db.select().from(scheduleItems).where(eq(scheduleItems.eventId, event.id)),
      db.select().from(eventSpeakers).where(eq(eventSpeakers.eventId, event.id)),
      db.select().from(eventJudges).where(eq(eventJudges.eventId, event.id)),
      db.select().from(eventHosts).where(eq(eventHosts.eventId, event.id)),
      db.select().from(eventLinks).where(eq(eventLinks.eventId, event.id)),
      db.select().from(eventPhotos).where(eq(eventPhotos.eventId, event.id)),
      db.select().from(scheduleLiveState).where(eq(scheduleLiveState.eventId, event.id)),
    ]);

    const sponsors = [];
    for (const s of sponsorRows) {
      const reps = await db
        .select()
        .from(eventSponsorRepresentatives)
        .where(eq(eventSponsorRepresentatives.eventSponsorId, s.id));
      sponsors.push({
        id: s.id,
        companyId: s.companyId,
        personId: s.personId,
        sortOrder: s.sortOrder,
        representatives: reps.map((r) => ({ userId: r.userId })),
      });
    }

    const schedule = [];
    for (const item of scheduleRows) {
      const spk = await db
        .select()
        .from(scheduleSpeakers)
        .where(eq(scheduleSpeakers.scheduleItemId, item.id));
      schedule.push({
        id: item.id,
        startTime: iso(item.startTime)!,
        endTime: iso(item.endTime)!,
        topic: item.topic,
        sortOrder: item.sortOrder,
        isSkipped: item.isSkipped,
        speakers: spk.map((s) => ({
          id: s.id,
          userId: s.userId,
          sortOrder: s.sortOrder,
        })),
      });
    }

    const photos = [];
    for (const photo of photoRows) {
      let imageUrl = photo.imageUrl;
      if (imageUrl) {
        imageUrl =
          (await downloadImage(imageUrl, path.join(slugDir, "photos", photo.id))) || imageUrl;
      }
      photos.push({
        id: photo.id,
        imageUrl,
        caption: photo.caption,
        sortOrder: photo.sortOrder,
      });
    }

    const record: EventRecord = {
      event: {
        id: event.id,
        slug: event.slug,
        name: event.name,
        type: event.type,
        description: event.description,
        theme: event.theme,
        dayLabel: event.dayLabel,
        eventDate: String(event.eventDate),
        endDate: event.endDate ? String(event.endDate) : null,
        startTime: event.startTime ? String(event.startTime).slice(0, 8) : null,
        endTime: event.endTime ? String(event.endTime).slice(0, 8) : null,
        location: event.location,
        locationLat: event.locationLat ? String(event.locationLat) : null,
        locationLng: event.locationLng ? String(event.locationLng) : null,
        coverImageUrl,
        coverPageUrl,
        lumaLinks: normalizeLinkList(undefined, event.lumaLink),
        eventbriteLinks: normalizeLinkList(undefined, event.eventbriteLink),
        groupLink: event.groupLink,
        isPartnerEvent: event.isPartnerEvent,
        isPublished: event.isPublished,
        createdAt: iso(event.createdAt)!,
        updatedAt: iso(event.updatedAt)!,
      },
      tracks: eventTracks.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        sortOrder: t.sortOrder,
      })),
      sponsors,
      partners: partnerRows.map((p) => ({
        id: p.id,
        companyId: p.companyId,
        customName: p.customName,
        partnerType: p.partnerType,
        customType: p.customType,
      })),
      prizes: prizeRows.map((p) => ({
        id: p.id,
        trackId: p.trackId,
        sponsorId: p.sponsorId,
        companyId: p.companyId,
        placement: p.placement,
        customLabel: p.customLabel,
        prizeName: p.prizeName,
        amount: p.amount,
        currency: p.currency,
        sortOrder: p.sortOrder,
      })),
      schedule,
      speakers: speakerRows.map((s) => ({
        id: s.id,
        userId: s.userId,
        eventDay: s.eventDay ? String(s.eventDay) : null,
        startTime: iso(s.startTime),
        endTime: iso(s.endTime),
        topic: s.topic,
        isSkipped: s.isSkipped,
        sortOrder: s.sortOrder,
      })),
      judges: judgeRows.map((j) => ({
        id: j.id,
        userId: j.userId,
        role: j.role,
        sortOrder: j.sortOrder,
      })),
      hosts: hostRows.map((h) => ({
        id: h.id,
        userId: h.userId,
        hostType: h.hostType,
        customType: h.customType,
        role: h.role,
        sortOrder: h.sortOrder,
      })),
      links: linkRows.map((l) => ({
        id: l.id,
        label: l.label,
        url: l.url,
        sortOrder: l.sortOrder,
      })),
      photos,
      liveState: liveRows[0]
        ? { liveReassignmentAt: iso(liveRows[0].liveReassignmentAt) }
        : null,
    };

    saveEventRecord(record);
    console.log(`  ${event.slug}`);
  }

  console.log("Building derived public data...");
  buildDerivedData();
  console.log("Done. Data written to", DATA_DIR);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
