import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { allowCors, handleOptions } from "../server-lib/http";
import {
  buildRequestEmailHtml,
  isSmtpConfigured,
  sendNotificationEmail,
} from "../server-lib/email";

async function loadEventsIndex(): Promise<{ id: string; name: string }[]> {
  const bases = [
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    "https://crewbasecollective.com",
  ].filter(Boolean);

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/data/events-index.json`);
      if (!res.ok) continue;
      const data = (await res.json()) as {
        events?: { id: string; name: string }[];
      };
      return data.events || [];
    } catch {
      /* try next */
    }
  }
  return [];
}

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
  partnershipType: z.enum([
    "venue",
    "ventures",
    "community",
    "media",
    "food",
    "other",
    "custom",
  ]),
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  allowCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const data = parsed.data;
    const eventIds = "eventIds" in data ? (data.eventIds ?? []) : [];
    const allEvents = await loadEventsIndex();
    const eventNames = allEvents
      .filter((e) => eventIds.includes(e.id))
      .map((e) => e.name);

    const emailData: Record<string, string | string[] | undefined> = {
      "Request Type": data.type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
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

    if (!sent && isSmtpConfigured()) {
      res.status(500).json({ error: "Could not send request email" });
      return;
    }

    if (!sent) {
      console.log("[Request] SMTP not configured. Payload:", {
        ...data,
        eventNames,
      });
    }

    res.status(201).json({ success: true, emailed: sent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}
