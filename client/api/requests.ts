import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { z } from "zod";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildRequestEmailHtml(
  data: Record<string, string | string[] | undefined>
): string {
  const rows = Object.entries(data)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([key, value]) => {
      const label = escapeHtml(key);
      const display = escapeHtml(
        Array.isArray(value) ? value.join(", ") : String(value)
      );
      return `<tr><td style="padding:8px 12px;font-weight:600;color:#374151;vertical-align:top">${label}</td><td style="padding:8px 12px;color:#111827">${display}</td></tr>`;
    })
    .join("");

  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#111a57;padding:24px;border-radius:8px 8px 0 0">
        <h1 style="color:white;margin:0;font-size:20px">Crewbase Collective</h1>
        <p style="color:#bcd4ff;margin:4px 0 0;font-size:14px">New Request Submission</p>
      </div>
      <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
        <table style="width:100%;border-collapse:collapse">${rows}</table>
      </div>
    </div>
  `;
}

async function sendNotificationEmail(options: {
  subject: string;
  html: string;
}): Promise<boolean> {
  const host = process.env.SMTP_HOST || "";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const from =
    process.env.SMTP_FROM ||
    "Crewbase Collective <noreply@crewbasecollective.com>";
  const to = process.env.NOTIFY_EMAIL || "";

  if (!host || !user || !pass || !to) {
    console.log("[Email] SMTP not configured. Would send:", options.subject);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from,
      to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return false;
  }
}

function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.NOTIFY_EMAIL
  );
}

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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const parsed = requestSchema.safeParse(body);
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
