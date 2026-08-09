import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const ASSETS_DIR = path.join(ROOT, "data", "assets");
const PITCH_DECK_PATH = path.join(ASSETS_DIR, "pitch-deck.pdf");
const LOGO_CANDIDATES = [
  path.join(ROOT, "client", "public", "logo-full.png"),
  path.join(ROOT, "client", "public", "logo-mark.png"),
  path.join(ROOT, "client", "public", "logo.png"),
  path.join(ROOT, "dist", "logo-full.png"),
];

export function pitchDeckPath(): string {
  return PITCH_DECK_PATH;
}

export function ensureAssetsDir(): void {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

export function resolveBrandLogoPath(): string | null {
  for (const candidate of LOGO_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export function readBrandLogoBuffer(): { content: Buffer; filename: string; contentType: string } | null {
  const logoPath = resolveBrandLogoPath();
  if (!logoPath) return null;
  return {
    content: fs.readFileSync(logoPath),
    filename: path.basename(logoPath),
    contentType: "image/png",
  };
}

function bufferFromPdf(build: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 54 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    build(doc);
    doc.end();
  });
}

/**
 * Certificate PDF from editable certificate text (placeholders already applied).
 * Includes Crewbase logo when available.
 */
export async function buildCertificatePdfFromText(opts: {
  certificateText: string;
  filenameHint?: string;
}): Promise<Buffer> {
  const text = opts.certificateText.trim() || "Certificate of Appreciation";
  const logoPath = resolveBrandLogoPath();

  return bufferFromPdf((doc) => {
    doc
      .rect(36, 36, doc.page.width - 72, doc.page.height - 72)
      .lineWidth(2)
      .stroke("#0b1f33");

    let y = 72;
    if (logoPath) {
      try {
        const logoWidth = 140;
        const x = (doc.page.width - logoWidth) / 2;
        doc.image(logoPath, x, y, { width: logoWidth });
        y += 70;
      } catch {
        // continue without logo
      }
    }

    doc.y = Math.max(y, 120);
    doc
      .fontSize(12)
      .fillColor("#111827")
      .text(text, 72, doc.y, {
        align: "center",
        width: doc.page.width - 144,
        lineGap: 6,
      });
  });
}

/** @deprecated Prefer buildCertificatePdfFromText */
export async function buildAppreciationCertificatePdf(opts: {
  personName: string;
  eventName: string;
  eventDate: string;
  role: "judge" | "speaker" | "judge_and_speaker";
  certificateText?: string;
}): Promise<Buffer> {
  if (opts.certificateText?.trim()) {
    return buildCertificatePdfFromText({ certificateText: opts.certificateText });
  }
  const roleLine =
    opts.role === "speaker"
      ? "served as a speaker"
      : opts.role === "judge_and_speaker"
        ? "served as a judge and speaker"
        : "served as a judge";
  const contribution =
    opts.role === "speaker"
      ? "sharing insights with our builder community"
      : opts.role === "judge_and_speaker"
        ? "contributing expertise, feedback, and a talk to our builder community"
        : "contributing expertise and thoughtful feedback to our builder community";
  const text = [
    "Certificate of Appreciation",
    "",
    `This certifies that ${opts.personName || "Guest"} ${roleLine} at ${
      opts.eventName || "our event"
    }${opts.eventDate ? ` on ${opts.eventDate}` : ""}.`,
    "",
    `Thank you for ${contribution}.`,
    "",
    "Crewbase Collective",
  ].join("\n");
  return buildCertificatePdfFromText({ certificateText: text });
}

export async function buildJudgeCertificatePdf(opts: {
  personName: string;
  eventName: string;
  eventDate: string;
}): Promise<Buffer> {
  return buildAppreciationCertificatePdf({ ...opts, role: "judge" });
}

/** Fallback pitch deck if no uploaded PDF exists. */
export async function buildFallbackPitchDeckPdf(): Promise<Buffer> {
  return bufferFromPdf((doc) => {
    doc.fontSize(22).fillColor("#0b1f33").text("Crewbase Collective", { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(14).fillColor("#0b8490").text("Sponsorship Pitch Deck");
    doc.moveDown(1);
    doc
      .fontSize(11)
      .fillColor("#374151")
      .text(
        "We run hackathons, workshops, pitch competitions, and community events across the Bay Area — connecting builders, founders, and operators."
      );
    doc.moveDown(1);
    doc.fontSize(13).fillColor("#0b1f33").text("Why sponsor");
    doc.moveDown(0.4);
    doc
      .fontSize(11)
      .fillColor("#374151")
      .list([
        "Brand presence with high-intent builders and founders",
        "Recruiting and product feedback in the room",
        "Co-branded programming, talks, and prizes",
        "Community goodwill across recurring events",
      ]);
    doc.moveDown(1);
    doc.fontSize(13).fillColor("#0b1f33").text("Packages");
    doc.moveDown(0.4);
    doc
      .fontSize(11)
      .fillColor("#374151")
      .text(
        "Title · Gold · Silver · Community partner — custom packages available. Reply to this email for current rates and inventory."
      );
    doc.moveDown(1.5);
    doc.fontSize(10).fillColor("#6b7280").text("Replace this file by uploading a PDF in Admin → Settings.");
  });
}

/** Prefer uploaded pitch deck; otherwise generate a simple deck. */
export async function getPitchDeckAttachment(): Promise<{
  filename: string;
  content: Buffer;
  contentType: string;
}> {
  ensureAssetsDir();
  if (fs.existsSync(PITCH_DECK_PATH)) {
    return {
      filename: "Crewbase-Collective-Pitch-Deck.pdf",
      content: fs.readFileSync(PITCH_DECK_PATH),
      contentType: "application/pdf",
    };
  }
  return {
    filename: "Crewbase-Collective-Pitch-Deck.pdf",
    content: await buildFallbackPitchDeckPdf(),
    contentType: "application/pdf",
  };
}

export function savePitchDeckPdf(buffer: Buffer): string {
  ensureAssetsDir();
  fs.writeFileSync(PITCH_DECK_PATH, buffer);
  return PITCH_DECK_PATH;
}

export function hasUploadedPitchDeck(): boolean {
  return fs.existsSync(PITCH_DECK_PATH);
}
