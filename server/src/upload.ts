import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Request, Response } from "express";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

export const singleImageUpload = upload.single("image");
export const multiImageUpload = upload.array("images", 20);
/** @deprecated use singleImageUpload — kept for logo field name compat */
export const logoUploadMiddleware = upload.single("logo");

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function storeImage(
  file: Express.Multer.File,
  folder: string
): Promise<string> {
  const supabase = getSupabase();
  if (supabase) {
    const ext = file.originalname.split(".").pop()?.toLowerCase() || "png";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("event-media").upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
    if (error) {
      // fallback to company-logos bucket for logos
      const { error: err2 } = await supabase.storage
        .from("company-logos")
        .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
      if (err2) throw new Error(err2.message);
      const { data } = supabase.storage.from("company-logos").getPublicUrl(path);
      return data.publicUrl;
    }
    const { data } = supabase.storage.from("event-media").getPublicUrl(path);
    return data.publicUrl;
  }

  return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
}

export async function handleLogoUpload(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const url = await storeImage(file, "logos");
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Upload failed" });
  }
}

export async function handleImageUpload(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const folder = typeof req.query.folder === "string" ? req.query.folder : "images";
    const url = await storeImage(file, folder);
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Upload failed" });
  }
}

export async function handleMultiImageUpload(req: Request, res: Response) {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }
    const folder = typeof req.query.folder === "string" ? req.query.folder : "photos";
    const urls: string[] = [];
    for (const file of files) {
      urls.push(await storeImage(file, folder));
    }
    res.json({ urls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Upload failed" });
  }
}
