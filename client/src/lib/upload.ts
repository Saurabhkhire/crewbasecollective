/** Upload a single image file; returns the stored URL (or data URL fallback). */
export async function uploadImage(file: File, folder = "images"): Promise<string> {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`/api/admin/upload-image?folder=${encodeURIComponent(folder)}`, {
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
export async function uploadImages(files: FileList | File[], folder = "photos"): Promise<string[]> {
  const fd = new FormData();
  Array.from(files).forEach((f) => fd.append("images", f));
  const res = await fetch(`/api/admin/upload-images?folder=${encodeURIComponent(folder)}`, {
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
