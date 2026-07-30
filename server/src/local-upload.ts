import fs from "node:fs";
import path from "node:path";
import type { Request, Response } from "express";
import multer from "multer";
import { IMAGES_DIR } from "./data/repository.js";
import {
  listAllImageUrls,
  listEventGalleryImageUrls,
  listSequentialImageUrls,
  nextSequentialBasename,
  removeSameStemFiles,
  resolveEventImageFolder,
  resolveNamedImageUrls,
  sanitizeBasename,
} from "./image-names.js";

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

type NamingMode = "random" | "named" | "sequential";

function namingMode(req: Request): NamingMode {
  const raw = typeof req.query.naming === "string" ? req.query.naming : "random";
  if (raw === "named" || raw === "sequential") return raw;
  return "random";
}

function resolveBaseName(
  req: Request,
  relativeDir: string,
  naming: NamingMode,
  override?: string
): string | undefined {
  if (naming === "random") return undefined;
  if (naming === "sequential") return nextSequentialBasename(relativeDir);
  const rawName =
    override ||
    (typeof req.query.name === "string" ? req.query.name : "") ||
    (typeof req.body?.name === "string" ? req.body.name : "");
  const stem = sanitizeBasename(rawName);
  return stem || undefined;
}

function normalizeFolder(folder: string): string {
  return folder.startsWith("events/") ? resolveEventImageFolder(folder) : folder;
}

export function saveLocalImage(
  file: Express.Multer.File,
  relativeDir: string,
  baseName?: string
): string {
  const ext = extFrom(file);
  const name = baseName || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (baseName) {
    removeSameStemFiles(relativeDir, name);
  }
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
    const name =
      typeof req.query.name === "string"
        ? req.query.name
        : typeof req.body?.name === "string"
          ? req.body.name
          : "";
    const baseName = name ? sanitizeBasename(name) : undefined;
    const url = saveLocalImage(req.file, "companies", baseName);
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
    const folder = normalizeFolder(typeof req.query.folder === "string" ? req.query.folder : "misc");
    const naming = namingMode(req);
    const baseName = resolveBaseName(req, folder, naming);
    const url = saveLocalImage(req.file, folder, baseName);
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
    const folder = normalizeFolder(typeof req.query.folder === "string" ? req.query.folder : "photos");
    const naming = namingMode(req);
    const urls = files.map((file) => {
      const baseName =
        naming === "sequential"
          ? nextSequentialBasename(folder)
          : naming === "named"
            ? resolveBaseName(req, folder, naming)
            : undefined;
      return saveLocalImage(file, folder, baseName);
    });
    res.json({ urls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Upload failed" });
  }
}

export function handleResolveImage(req: Request, res: Response) {
  const folder = normalizeFolder(typeof req.query.folder === "string" ? req.query.folder : "");
  const name = typeof req.query.name === "string" ? req.query.name : "";
  const extraFolders = collectQueryValues(req.query.folders);
  const extraNames = collectQueryValues(req.query.names);
  const folders = [folder, ...extraFolders].filter(Boolean);
  const names = [name, ...extraNames].filter(Boolean);
  if (!folders.length || !names.length) {
    res.status(400).json({ error: "folder and name are required" });
    return;
  }
  const url = resolveNamedImageUrls(folders, names);
  if (!url) {
    res.status(404).json({ error: "Image not found in folder" });
    return;
  }
  res.json({ url });
}

function collectQueryValues(value: unknown): string[] {
  if (typeof value === "string") return value.split(",").map((s) => s.trim()).filter(Boolean);
  if (Array.isArray(value)) return value.flatMap((v) => collectQueryValues(v));
  return [];
}

export function handleListImages(req: Request, res: Response) {
  const folder = normalizeFolder(typeof req.query.folder === "string" ? req.query.folder : "");
  if (!folder) {
    res.status(400).json({ error: "folder is required" });
    return;
  }
  const urls = folder.startsWith("events/")
    ? listEventGalleryImageUrls(folder)
    : folder === "covers" || folder === "companies"
      ? listAllImageUrls(folder)
      : listSequentialImageUrls(folder);
  res.json({ urls });
}
