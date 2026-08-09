import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import dns from "node:dns";

// Avoid intermittent Undici "fetch failed" on Vercel when IPv6 is preferred
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  /* older Node */
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

    const url = (process.env.SUPABASE_URL || "").trim();
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    if (!url || !key) {
      console.error(
        "[Subscribe] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      );
      res.status(503).json({
        error:
          "Subscriptions are temporarily unavailable. Please try again later.",
      });
      return;
    }

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await supabase.from("subscribers").upsert(
      { email },
      { onConflict: "email", ignoreDuplicates: true }
    );

    if (error) {
      console.error(
        "[Subscribe] Supabase error:",
        error.message,
        error.code,
        error
      );
      if (error.code === "23505") {
        res.status(200).json({ success: true, stored: true });
        return;
      }
      res.status(500).json({
        error: "Could not save subscription. Please try again.",
      });
      return;
    }

    res.status(200).json({ success: true, stored: true });
  } catch (err) {
    console.error("[Subscribe]", err);
    res.status(500).json({
      error: "Could not save subscription. Please try again.",
    });
  }
}
