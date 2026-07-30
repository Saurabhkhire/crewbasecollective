import fs from "node:fs";
import path from "node:path";
import { IMAGES_DIR } from "./data/repository.js";

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

export function sanitizeBasename(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return base || "image";
}

/** Gallery folder for an event — from event name, not URL slug (slug has a unique suffix). */
export function eventImageFolder(eventName: string): string {
  if (!eventName.trim()) return "events/misc";
  return `events/${sanitizeBasename(eventName)}`;
}

/**
 * Resolve an events/… folder path. Prefers name-based folder; falls back to stripping
 * slug uniquifier suffix when the suffixed folder does not exist on disk.
 */
export function resolveEventImageFolder(folder: string, eventName?: string): string {
  if (eventName?.trim()) return eventImageFolder(eventName);
  if (!folder.startsWith("events/")) return folder;

  const abs = path.join(IMAGES_DIR, folder);
  if (fs.existsSync(abs)) return folder;

  const slug = folder.slice("events/".length);
  const match = slug.match(/^(.+)-[a-z0-9]{5,12}$/i);
  if (match) {
    const candidate = `events/${match[1]}`;
    if (fs.existsSync(path.join(IMAGES_DIR, candidate))) return candidate;
  }
  return folder;
}

function isImageFile(filename: string): boolean {
  return IMAGE_EXTS.has(path.extname(filename).toLowerCase());
}

/** Find /images/... URL for a named file in a folder (any image extension). */
export function findNamedImageUrl(relativeDir: string, basename: string): string | null {
  const dir = path.join(IMAGES_DIR, relativeDir);
  if (!fs.existsSync(dir)) return null;
  const target = sanitizeBasename(basename);
  for (const file of fs.readdirSync(dir)) {
    if (!isImageFile(file)) continue;
    if (path.parse(file).name === target) {
      return `/images/${relativeDir}/${file}`.replace(/\\/g, "/");
    }
  }
  return null;
}

/** Search multiple folders and basenames (first match wins). */
export function resolveNamedImageUrls(folders: string[], names: string[]): string | null {
  const seenFolders = new Set<string>();
  for (const rawFolder of folders) {
    if (!rawFolder.trim()) continue;
    const folder = rawFolder.startsWith("events/")
      ? resolveEventImageFolder(rawFolder)
      : rawFolder;
    if (seenFolders.has(folder)) continue;
    seenFolders.add(folder);
    for (const name of names) {
      if (!name.trim()) continue;
      const url = findNamedImageUrl(folder, name);
      if (url) return url;
    }
  }
  return null;
}

/** List every image in a flat folder (covers, companies, etc.). */
export function listAllImageUrls(relativeDir: string): string[] {
  const dir = path.join(IMAGES_DIR, relativeDir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(isImageFile)
    .map((file) => `/images/${relativeDir}/${file}`.replace(/\\/g, "/"))
    .sort((a, b) => a.localeCompare(b));
}

/** Next numeric basename (1, 2, 3…) — scans event folder including subfolders. */
export function nextSequentialBasename(relativeDir: string): string {
  const root = path.join(IMAGES_DIR, relativeDir);
  fs.mkdirSync(root, { recursive: true });
  let max = 0;

  const walk = (rel: string) => {
    const abs = path.join(IMAGES_DIR, rel);
    if (!fs.existsSync(abs)) return;
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const childRel = path.join(rel, entry.name).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        walk(childRel);
        continue;
      }
      if (!isImageFile(entry.name)) continue;
      const stem = path.parse(entry.name).name.toLowerCase();
      if (stem === "cover" || stem === "cover-page") continue;
      const n = parseInt(path.parse(entry.name).name, 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }
  };
  walk(relativeDir);

  return String(max + 1);
}

const GALLERY_RESERVED_STEMS = new Set(["cover", "cover-page"]);

/**
 * Flatten gallery images in an event folder and rename to 1.ext, 2.ext, …
 * Skips cover / cover-page files. Returns public /images/… URLs in order.
 */
export function renumberEventGalleryFolder(relativeDir: string): string[] {
  const root = path.join(IMAGES_DIR, relativeDir);
  if (!fs.existsSync(root)) return [];

  type FileEntry = { abs: string; relFromRoot: string };
  const entries: FileEntry[] = [];

  const walk = (rel: string) => {
    const abs = path.join(IMAGES_DIR, rel);
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const childRel = path.join(rel, entry.name).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        walk(childRel);
        continue;
      }
      if (!isImageFile(entry.name)) continue;
      const stem = path.parse(entry.name).name.toLowerCase();
      if (GALLERY_RESERVED_STEMS.has(stem)) continue;
      entries.push({ abs: path.join(IMAGES_DIR, childRel), relFromRoot: childRel });
    }
  };
  walk(relativeDir);

  entries.sort((a, b) => {
    const numA = parseInt(path.parse(path.basename(a.relFromRoot)).name, 10);
    const numB = parseInt(path.parse(path.basename(b.relFromRoot)).name, 10);
    const aNum = !Number.isNaN(numA);
    const bNum = !Number.isNaN(numB);
    if (aNum && bNum && numA !== numB) return numA - numB;
    return a.relFromRoot.localeCompare(b.relFromRoot);
  });

  if (!entries.length) return [];

  const topDir = root;
  const token = Date.now().toString(36);
  const staged: { tempAbs: string; finalAbs: string; finalRel: string }[] = [];

  for (let i = 0; i < entries.length; i++) {
    let ext = path.extname(entries[i].relFromRoot).toLowerCase();
    if (ext === ".jpeg") ext = ".jpg";
    const tempAbs = path.join(topDir, `__renumber_${token}_${i}${ext}`);
    fs.renameSync(entries[i].abs, tempAbs);
    const finalName = `${i + 1}${ext}`;
    staged.push({
      tempAbs,
      finalAbs: path.join(topDir, finalName),
      finalRel: path.join(relativeDir, finalName).replace(/\\/g, "/"),
    });
  }

  for (const item of staged) {
    if (fs.existsSync(item.finalAbs)) {
      fs.unlinkSync(item.finalAbs);
    }
    fs.renameSync(item.tempAbs, item.finalAbs);
  }

  const pruneEmptyDirs = (dir: string) => {
    if (!fs.existsSync(dir) || dir === topDir) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) pruneEmptyDirs(path.join(dir, entry.name));
    }
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
    }
  };
  for (const entry of fs.readdirSync(topDir, { withFileTypes: true })) {
    if (entry.isDirectory()) pruneEmptyDirs(path.join(topDir, entry.name));
  }

  return staged.map((s) => `/images/${s.finalRel}`.replace(/\\/g, "/"));
}

/** List numbered gallery images in order (top-level folder only). */
export function listSequentialImageUrls(relativeDir: string): string[] {
  const dir = path.join(IMAGES_DIR, relativeDir);
  if (!fs.existsSync(dir)) return [];
  const numbered: { n: number; url: string }[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!isImageFile(file)) continue;
    const n = parseInt(path.parse(file).name, 10);
    if (Number.isNaN(n)) continue;
    numbered.push({
      n,
      url: `/images/${relativeDir}/${file}`.replace(/\\/g, "/"),
    });
  }
  numbered.sort((a, b) => a.n - b.n);
  return numbered.map((item) => item.url);
}

/** List all images under an event folder (includes subfolders like "New folder"). */
export function listEventGalleryImageUrls(relativeDir: string): string[] {
  const root = path.join(IMAGES_DIR, relativeDir);
  if (!fs.existsSync(root)) return [];

  const urls: string[] = [];
  const walk = (rel: string) => {
    const abs = path.join(IMAGES_DIR, rel);
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const childRel = path.join(rel, entry.name).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        walk(childRel);
        continue;
      }
      if (!isImageFile(entry.name)) continue;
      urls.push(`/images/${childRel}`);
    }
  };
  walk(relativeDir);

  urls.sort((a, b) => {
    const stemA = path.parse(path.basename(a)).name;
    const stemB = path.parse(path.basename(b)).name;
    const numA = parseInt(stemA, 10);
    const numB = parseInt(stemB, 10);
    const aIsNum = !Number.isNaN(numA);
    const bIsNum = !Number.isNaN(numB);
    if (aIsNum && bIsNum && numA !== numB) return numA - numB;
    return a.localeCompare(b);
  });
  return urls;
}

/** Remove other extensions with the same stem before saving a named file. */
export function removeSameStemFiles(relativeDir: string, stem: string) {
  const dir = path.join(IMAGES_DIR, relativeDir);
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    if (path.parse(file).name === stem) {
      fs.unlinkSync(path.join(dir, file));
    }
  }
}

/** Delete a file under data/images from its public /images/... URL. */
export function deleteImageByUrl(publicUrl: string | null | undefined): boolean {
  if (!publicUrl || !publicUrl.startsWith("/images/")) return false;
  const rel = publicUrl.slice("/images/".length);
  const abs = path.join(IMAGES_DIR, rel);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return false;
  fs.unlinkSync(abs);
  return true;
}
