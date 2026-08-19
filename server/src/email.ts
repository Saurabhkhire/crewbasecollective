import nodemailer from "nodemailer";
import { getSiteSettings } from "./data/repository.js";
import { SMTP_PROVIDER_PRESETS, inferSmtpProvider, parseSmtpProvider } from "./data/types.js";
import { readBrandLogoBuffer } from "./pdfs.js";

interface EmailOptions {
  subject: string;
  html: string;
  text?: string;
}

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
  /** Inline CID for logos embedded in HTML (e.g. crewbase-logo). */
  cid?: string;
  contentDisposition?: "inline" | "attachment";
};

export const CREWBASE_LOGO_CID = "crewbase-logo";

export type ResolvedSmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  notifyEmail: string;
};

function envSmtpProvider(): "gmail" | "brevo" | null {
  return parseSmtpProvider(process.env.SMTP_PROVIDER);
}

function extractEmailAddress(value: string): string {
  const angle = value.match(/<([^>]+)>/);
  return (angle ? angle[1] : value).trim().toLowerCase();
}

function fromAddressForMailbox(from: string, user: string): string {
  const mailbox = user.trim();
  if (!mailbox) return from;
  if (extractEmailAddress(from) === mailbox.toLowerCase()) return from;
  const nameMatch = from.match(/^(.*)</);
  const name = (nameMatch ? nameMatch[1] : from).trim().replace(/^"|"$/g, "") ||
    "Crewbase Collective";
  if (!from.includes("<") && from.includes("@")) {
    return `Crewbase Collective <${mailbox}>`;
  }
  return `${name} <${mailbox}>`;
}

/** Settings SMTP first, then env fallbacks. Host/port come from Gmail or Brevo. */
export function resolveSmtpConfig(): ResolvedSmtpConfig {
  const smtp = getSiteSettings().smtp;
  const provider =
    parseSmtpProvider(smtp.provider) ||
    envSmtpProvider() ||
    inferSmtpProvider(smtp.host || process.env.SMTP_HOST);
  const preset = SMTP_PROVIDER_PRESETS[provider];
  const account =
    provider === "brevo"
      ? {
          user:
            smtp.brevo?.user ||
            process.env.BREVO_SMTP_USER ||
            process.env.SMTP_USER ||
            "",
          pass:
            smtp.brevo?.pass ||
            process.env.BREVO_SMTP_KEY ||
            process.env.SMTP_PASS ||
            "",
        }
      : {
          user:
            smtp.gmail?.user ||
            process.env.GMAIL_SMTP_USER ||
            process.env.SMTP_USER ||
            "",
          pass:
            smtp.gmail?.pass ||
            process.env.GMAIL_SMTP_PASS ||
            process.env.SMTP_PASS ||
            "",
        };
  const host = preset.host;
  const port = parseInt(preset.port, 10);
  const fromRaw =
    smtp.from ||
    process.env.SMTP_FROM ||
    "Crewbase Collective <events@crewbasecollective.com>";
  const from =
    provider === "gmail" ? fromAddressForMailbox(fromRaw, account.user) : fromRaw;
  const notifyEmail = smtp.notifyEmail || process.env.NOTIFY_EMAIL || "";
  return {
    host,
    port,
    user: account.user,
    pass: account.pass,
    from,
    notifyEmail,
  };
}

export function isSmtpConfigured(config = resolveSmtpConfig()): boolean {
  return Boolean(config.host && config.user && config.pass);
}

function getTransporter() {
  const config = resolveSmtpConfig();
  if (!isSmtpConfigured(config)) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    requireTLS: config.port === 587,
    auth: { user: config.user, pass: config.pass },
  });
}

export async function sendNotificationEmail(options: EmailOptions): Promise<boolean> {
  const config = resolveSmtpConfig();
  const result = await sendOutboundEmail({
    to: config.notifyEmail,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
  return result.ok;
}

export async function sendOutboundEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}): Promise<{ ok: boolean; error?: string }> {
  const transporter = getTransporter();
  const config = resolveSmtpConfig();
  if (!transporter) {
    console.log("[Email] SMTP not configured. Would send:", options.subject, "→", options.to);
    return {
      ok: false,
      error: "SMTP is not configured. Add Gmail or Brevo in CMS Settings (or server/.env).",
    };
  }
  if (!options.to) {
    return { ok: false, error: "Missing recipient email." };
  }
  try {
    await transporter.sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
        cid: a.cid,
        contentDisposition: a.contentDisposition || (a.cid ? "inline" : "attachment"),
      })),
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Email] Failed to send:", err);
    return { ok: false, error: message };
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Replace {{placeholders}} in a template string. Missing values become empty. */
export function applyEmailPlaceholders(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, key: string) => {
    const v = values[key.toLowerCase()];
    return v !== undefined ? v : "";
  });
}

export function brandLogoInlineAttachment(): EmailAttachment | null {
  const logo = readBrandLogoBuffer();
  if (!logo) return null;
  return {
    filename: logo.filename,
    content: logo.content,
    contentType: logo.contentType,
    cid: CREWBASE_LOGO_CID,
    contentDisposition: "inline",
  };
}

/** Plain-text body → HTML email, optionally with Crewbase logo footer. */
export function textBodyToHtml(
  body: string,
  options?: { includeLogo?: boolean }
): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = escapeHtml(block).replace(/\n/g, "<br/>");
      return `<p style="margin:0 0 14px;line-height:1.55;color:#111827">${lines}</p>`;
    })
    .join("");

  const logoFooter = options?.includeLogo
    ? `
      <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center">
        <img src="cid:${CREWBASE_LOGO_CID}" alt="Crewbase Collective" width="160" style="display:inline-block;max-width:160px;height:auto;border:0" />
        <p style="margin:10px 0 0;font-size:12px;color:#6b7280">Crewbase Collective</p>
      </div>`
    : "";

  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#111827">
      ${paragraphs}
      ${logoFooter}
    </div>
  `;
}

export function buildRequestEmailHtml(data: Record<string, string | string[] | undefined>): string {
  const rows = Object.entries(data)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([key, value]) => {
      const label = escapeHtml(key);
      const display = escapeHtml(Array.isArray(value) ? value.join(", ") : String(value));
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

export const EMAIL_PLACEHOLDERS = [
  { key: "person_name", label: "Person name" },
  { key: "event_name", label: "Event name" },
  { key: "event_date", label: "Event date" },
  { key: "event_date_clause", label: "Event date clause (on …)" },
  { key: "event_time", label: "Event time" },
  { key: "event_place", label: "Event place" },
  { key: "luma_link", label: "Luma page link" },
  { key: "sponsor_names", label: "All sponsor names" },
  { key: "partner_names", label: "All partner names" },
  { key: "theme", label: "Theme" },
  { key: "tracks", label: "Tracks" },
] as const;
