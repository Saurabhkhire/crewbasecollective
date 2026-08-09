import nodemailer from "nodemailer";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildRequestEmailHtml(
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

export async function sendNotificationEmail(options: {
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

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.NOTIFY_EMAIL
  );
}
