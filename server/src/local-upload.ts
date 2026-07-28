import fs from "node:fs";
import path from "node:path";
import type { Request, Response } from "express";
import multer from "multer";
import { IMAGES_DIR } from "./data/repository.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
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
export const logoUploadMiddleware = upload.single("logo");

function extFrom(file: Express.Multer.File): string {
  const fromName = file.originalname.split(".").pop()?.toLowerCase();
  if (fromName && ["png", "jpg", "jpeg", "webp", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.mimetype.includes("png")) return "png";
  if (file.mimetype.includes("webp")) return "webp";
  if (file.mimetype.includes("gif")) return "gif";
  return "jpg";
}

export function saveLocalImage(
  file: Express.Multer.File,
  relativeDir: string,
  baseName?: string
): string {
  const ext = extFrom(file);
  const name = baseName || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const rel = path.join(relativeDir, `${name}.${ext}`).replace(/\\/g, "/");
  const abs = path.join(IMAGES_DIR, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, file.buffer);
  return `/images/${rel}`;
}

export async function handleLogoUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const url = saveLocalImage(req.file, "companies");
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Upload failed" });
  }
}

export async function handleImageUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const folder = typeof req.query.folder === "string" ? req.query.folder : "misc";
    const url = saveLocalImage(req.file, folder);
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Upload failed" });
  }
}

export async function handleMultiImageUpload(req: Request, res: Response) {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }
    const folder = typeof req.query.folder === "string" ? req.query.folder : "photos";
    const urls = files.map((file) => saveLocalImage(file, folder));
    res.json({ urls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Upload failed" });
  }
}
