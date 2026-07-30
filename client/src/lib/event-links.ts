/** Normalize Luma / Eventbrite links from array or legacy single-field JSON. */
export function normalizeEventLinks(
  links: string[] | undefined | null,
  legacy?: string | null
): string[] {
  const fromArray = (links ?? []).map((s) => s.trim()).filter(Boolean);
  if (fromArray.length) return fromArray;
  const single = legacy?.trim();
  return single ? [single] : [];
}
