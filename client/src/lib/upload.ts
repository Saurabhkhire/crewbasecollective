export type ImageNaming = "random" | "named" | "sequential";

type UploadOptions = {
  name?: string;
  naming?: ImageNaming;
};

/** Sanitize a display name for image filenames / folders (no URL slug suffix). */
export function sanitizeImageBasename(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return base || "image";
}

/** Event gallery folder under data/images — from event name, not URL slug. */
export function eventImageFolder(eventName: string): string {
  if (!eventName.trim()) return "events/misc";
  return `events/${sanitizeImageBasename(eventName)}`;
}

function uploadQuery(folder: string, opts?: UploadOptions): string {
  const params = new URLSearchParams({ folder });
  if (opts?.naming) params.set("naming", opts.naming);
  if (opts?.name) params.set("name", opts.name);
  return params.toString();
}

/** Upload a single image file; returns the stored URL. */
export async function uploadImage(
  file: File,
  folder = "images",
  opts?: UploadOptions
): Promise<string> {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`/api/admin/upload-image?${uploadQuery(folder, opts)}`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.error === "string" ? data.error : "Upload failed");
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

/** Upload multiple image files; returns stored URLs. */
export async function uploadImages(
  files: FileList | File[],
  folder = "photos",
  opts?: UploadOptions
): Promise<string[]> {
  const fd = new FormData();
  Array.from(files).forEach((f) => fd.append("images", f));
  const res = await fetch(`/api/admin/upload-images?${uploadQuery(folder, opts)}`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.error === "string" ? data.error : "Upload failed");
  }
  const data = (await res.json()) as { urls: string[] };
  return data.urls;
}

/** Upload company logo saved as companies/{company-name}.ext */
export async function uploadCompanyLogo(file: File, companyName: string): Promise<string> {
  const fd = new FormData();
  fd.append("logo", file);
  const params = new URLSearchParams({ name: companyName });
  const res = await fetch(`/api/admin/upload-logo?${params}`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.error === "string" ? data.error : "Upload failed");
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

/** Use an image already saved in data/images (searches primary folder/name plus extras). */
export async function resolveNamedImage(
  folder: string,
  name: string,
  opts?: { folders?: string[]; names?: string[] }
): Promise<string | null> {
  const params = new URLSearchParams({ folder, name });
  for (const f of opts?.folders ?? []) params.append("folders", f);
  for (const n of opts?.names ?? []) params.append("names", n);
  const res = await fetch(`/api/admin/resolve-image?${params}`, { credentials: "include" });
  if (res.status === 404) return null;
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.error === "string" ? data.error : "Could not resolve image");
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

/** List gallery images in events/{name}/ (not the URL slug with uniquifier suffix). */
export async function listFolderImages(folder: string): Promise<string[]> {
  const params = new URLSearchParams({ folder });
  const res = await fetch(`/api/admin/list-images?${params}`, { credentials: "include" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.error === "string" ? data.error : "Could not list images");
  }
  const data = (await res.json()) as { urls: string[] };
  return data.urls;
}

export function fileFromClipboardItem(item: DataTransferItem): File | null {
  if (item.kind !== "file") return null;
  const file = item.getAsFile();
  if (!file || !file.type.startsWith("image/")) return null;
  return file;
}
