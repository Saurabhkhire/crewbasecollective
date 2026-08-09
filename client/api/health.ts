import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allowCors, handleOptions } from "../server-lib/http";

export default function handler(req: VercelRequest, res: VercelResponse) {
  allowCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  res.json({ ok: true, mode: "api" });
}
