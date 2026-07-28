import { Router } from "express";
import { z } from "zod";
import { getSupabase } from "../supabase.js";
import { buildRequestEmailHtml, sendNotificationEmail } from "../email.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const publicFormsRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEventsIndex(): { id: string; name: string }[] {
  const candidates = [
    path.resolve(__dirname, "../../../client/public/data/events-index.json"),
    path.resolve(process.cwd(), "client/public/data/events-index.json"),
    path.resolve(process.cwd(), "data/events-index.json"),
  ];
  for (const file of candidates) {
    try {
      if (!fs.existsSync(file)) continue;
      const data = JSON.parse(fs.readFileSync(file, "utf8")) as {
        events: { id: string; name: string }[];
      };
      return data.events || [];
    } catch {
      /* try next */
    }
  }
  return [];
}

const subscribeSchema = z.object({
  email: z.string().email(),
});

publicFormsRouter.post("/subscribe", async (req, res) => {
  try {
    const parsed = subscribeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Valid email required" });
      return;
    }
    const email = parsed.data.email.trim().toLowerCase();
    const supabase = getSupabase();
    if (!supabase) {
      console.log("[Subscribe] Supabase not configured. Would save:", email);
      res.json({ success: true, stored: false });
      return;
    }
    const { error } = await supabase.from("subscribers").upsert(
      { email },
      { onConflict: "email", ignoreDuplicates: true }
    );
    if (error) {
      console.error(error);
      res.status(500).json({ error: "Could not save subscription" });
      return;
    }
    res.json({ success: true, stored: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const sponsorshipSchema = z.object({
  type: z.literal("sponsorship"),
  name: z.string().min(1),
  email: z.string().email(),
  linkedin: z.string().optional(),
  comments: z.string().optional(),
  companyName: z.string().min(1),
  website: z.string().optional(),
  description: z.string().optional(),
  sponsorshipDetails: z.string().optional(),
  eventIds: z.array(z.string()).min(1),
});

const judgingSpeakingSchema = z.object({
  type: z.literal("judging_speaking"),
  name: z.string().min(1),
  email: z.string().email(),
  linkedin: z.string().optional(),
  comments: z.string().optional(),
  judgingSpeakingRole: z.enum(["judging", "speaking", "both"]),
  eventIds: z.array(z.string()).min(1),
});

const partnershipSchema = z.object({
  type: z.literal("partnership"),
  name: z.string().min(1),
  email: z.string().email(),
  linkedin: z.string().optional(),
  companyName: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  comments: z.string().optional(),
  partnershipType: z.enum(["venue", "technology", "community", "media", "food", "other", "custom"]),
  partnershipCustomType: z.string().optional(),
  eventIds: z.array(z.string()).min(1),
});

const memberHostSchema = z.object({
  type: z.literal("member_host"),
  name: z.string().min(1),
  email: z.string().email(),
  linkedin: z.string().optional(),
  comments: z.string().optional(),
  memberHostRole: z.enum(["member", "host"]),
  eventIds: z.array(z.string()).min(1),
});

const volunteerSchema = z.object({
  type: z.literal("volunteer"),
  name: z.string().min(1),
  email: z.string().email(),
  linkedin: z.string().optional(),
  comments: z.string().optional(),
  eventIds: z.array(z.string()).min(1),
});

const contactUsSchema = z.object({
  type: z.literal("contact_us"),
  name: z.string().min(1),
  email: z.string().email(),
  linkedin: z.string().optional(),
  comments: z.string().min(1),
  eventIds: z.array(z.string()).optional().default([]),
});

const requestSchema = z.discriminatedUnion("type", [
  sponsorshipSchema,
  judgingSpeakingSchema,
  partnershipSchema,
  memberHostSchema,
  volunteerSchema,
  contactUsSchema,
]);

publicFormsRouter.post("/requests", async (req, res) => {
  try {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const data = parsed.data;
    const eventIds = "eventIds" in data ? (data.eventIds ?? []) : [];
    const allEvents = loadEventsIndex();
    const eventNames = allEvents
      .filter((e) => eventIds.includes(e.id))
      .map((e) => e.name);

    const emailData: Record<string, string | string[] | undefined> = {
      "Request Type": data.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      Name: data.name,
      Email: data.email,
      LinkedIn: data.linkedin,
      Comments: data.comments,
      Events: eventNames.join(", ") || "—",
    };

    if (data.type === "sponsorship") {
      emailData["Company Name"] = data.companyName;
      emailData.Website = data.website;
      emailData.Description = data.description;
      emailData["Sponsorship Details"] = data.sponsorshipDetails;
    } else if (data.type === "judging_speaking") {
      emailData.Role = data.judgingSpeakingRole;
    } else if (data.type === "partnership") {
      emailData["Partnership Type"] = data.partnershipType;
      emailData["Company Name"] = data.companyName;
      emailData.Website = data.website;
    } else if (data.type === "member_host") {
      emailData.Role = data.memberHostRole;
    }

    const sent = await sendNotificationEmail({
      subject: `[Crewbase] New ${data.type.replace(/_/g, " ")} request from ${data.name}`,
      html: buildRequestEmailHtml(emailData),
    });

    if (!sent) {
      const smtpConfigured =
        process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.NOTIFY_EMAIL;
      if (smtpConfigured) {
        res.status(500).json({ error: "Could not send request email" });
        return;
      }
      console.log("[Request] SMTP not configured. Payload:", { ...data, eventNames });
    }

    res.status(201).json({ success: true, emailed: sent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
