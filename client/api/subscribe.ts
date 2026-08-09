import type { VercelRequest, VercelResponse } from "@vercel/node";
import https from "node:https";

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cleanEnv(value: string | undefined): string {
  return (value || "").trim().replace(/^["']|["']$/g, "");
}

/** Upsert subscriber via Supabase REST (avoids undici fetch failures on Vercel). */
function upsertSubscriber(
  baseUrl: string,
  serviceKey: string,
  email: string
): Promise<{ ok: boolean; status: number; body: string }> {
  const endpoint = new URL("/rest/v1/subscribers", baseUrl);
  const payload = JSON.stringify({ email });

  return new Promise((resolve, reject) => {
    const req = https.request(
      endpoint,
      {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates,return=minimal",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({
            ok: (res.statusCode || 500) < 300,
            status: res.statusCode || 500,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

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
    const raw = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const email = String(raw?.email || "")
      .trim()
      .toLowerCase();

    if (!email || !isEmail(email)) {
      res.status(400).json({ error: "Valid email required" });
      return;
    }

    const url = cleanEnv(process.env.SUPABASE_URL);
    const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!url || !key || !url.startsWith("http")) {
      console.error("[Subscribe] Missing or invalid Supabase env");
      res.status(503).json({
        error:
          "Subscriptions are temporarily unavailable. Please try again later.",
      });
      return;
    }

    const result = await upsertSubscriber(url, key, email);
    if (!result.ok) {
      console.error("[Subscribe] Supabase REST error:", result.status, result.body);
      // Unique violation still counts as success for the visitor
      if (result.status === 409) {
        res.status(200).json({ success: true, stored: true });
        return;
      }
      res.status(500).json({
        error: "Could not save subscription. Please try again.",
        status: result.status,
        detail: result.body.slice(0, 300),
      });
      return;
    }

    res.status(200).json({ success: true, stored: true });
  } catch (err) {
    console.error("[Subscribe]", err);
    res.status(500).json({
      error: "Could not save subscription. Please try again.",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
