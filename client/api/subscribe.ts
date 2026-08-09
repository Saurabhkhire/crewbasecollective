import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { allowCors, handleOptions } from "../server-lib/http";
import { getSupabase } from "../server-lib/supabase";

const subscribeSchema = z.object({
  email: z.string().email(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  allowCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const parsed = subscribeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Valid email required" });
      return;
    }

    const email = parsed.data.email.trim().toLowerCase();
    const supabase = getSupabase();
    if (!supabase) {
      console.error(
        "[Subscribe] Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"
      );
      res.status(503).json({
        error:
          "Subscriptions are temporarily unavailable. Please try again later.",
      });
      return;
    }

    const { error } = await supabase.from("subscribers").upsert(
      { email },
      { onConflict: "email", ignoreDuplicates: true }
    );

    if (error) {
      console.error("[Subscribe] Supabase error:", error.message, error);
      if (error.code === "23505") {
        res.json({ success: true, stored: true });
        return;
      }
      res.status(500).json({
        error: "Could not save subscription. Please try again.",
      });
      return;
    }

    res.json({ success: true, stored: true });
  } catch (err) {
    console.error("[Subscribe]", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
