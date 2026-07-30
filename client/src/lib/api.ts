export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { headers: optionHeaders, ...rest } = options;
  const res = await fetch(path, {
    credentials: "include",
    ...rest,
    headers: { "Content-Type": "application/json", ...optionHeaders },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = body.error;
    const message =
      typeof err === "string"
        ? err
        : err && typeof err === "object"
          ? "Request failed — check required fields"
          : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return res.json();
}

/** Load static JSON from /data (built from local CMS). */
export async function loadData<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "omit", cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`Could not load ${path} (${res.status})`);
  }
  return res.json() as Promise<T>;
}
