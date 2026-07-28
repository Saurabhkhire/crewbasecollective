import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  Trophy,
  Users,
  Mic,
  Gavel,
  Loader2,
  Handshake,
  type LucideIcon,
} from "lucide-react";
import { loadData } from "@/lib/api";
import {
  formatDate,
  formatTime,
  formatDayHeading,
  formatClockFromIso,
  localDateKeyFromIso,
  EVENT_TYPE_LABELS,
  PRIZE_PLACEMENT_LABELS,
  PARTNER_TYPE_LABELS,
  externalUrl,
} from "@/lib/utils";
import { mapsUrlForLocation } from "@/components/LocationPicker";
import { SponsorDisplay } from "@/components/SponsorDisplay";

interface EventDetail {
  event: {
    id: string;
    name: string;
    type: string;
    description: string | null;
    theme: string | null;
    eventDate: string;
    endDate: string | null;
    startTime: string | null;
    endTime: string | null;
    location: string | null;
    locationLat: string | null;
    locationLng: string | null;
    coverImageUrl: string | null;
    lumaLink: string | null;
    eventbriteLink: string | null;
    groupLink: string | null;
  };
  tracks: { id: string; name: string; description: string | null }[];
  sponsors: {
    id: string;
    companyName: string;
    companyWebsite: string | null;
    companyLogo: string | null;
    companyDescription: string | null;
    representatives: {
      username: string;
      linkedin: string | null;
      role?: string | null;
      companyName?: string | null;
    }[];
  }[];
  partners: {
    partnerType: string;
    customType: string | null;
    companyName: string | null;
    companyWebsite: string | null;
    companyLogo: string | null;
    companyDescription: string | null;
  }[];
  prizes: {
    placement: string;
    customLabel: string | null;
    prizeName: string;
    amount: string | null;
    currency: string | null;
    companyName: string | null;
  }[];
  schedule: {
    id: string;
    startTime: string;
    endTime: string;
    topic: string;
    speakers: { username: string; linkedin: string | null }[];
  }[];
  speakers: {
    username: string;
    linkedin: string | null;
    eventDay: string | null;
    startTime: string | null;
    endTime: string | null;
    topic: string | null;
    title?: string | null;
    companyName?: string | null;
  }[];
  judges: {
    username: string;
    linkedin: string | null;
    role: string | null;
    title?: string | null;
    companyName: string | null;
  }[];
  hosts: {
    username: string;
    linkedin: string | null;
    hostType: string;
    customType: string | null;
    role: string | null;
    title?: string | null;
    companyName?: string | null;
  }[];
  links: { id: string; label: string; url: string }[];
  photos: { id: string; imageUrl: string; caption: string | null }[];
}

function PersonLink({ name, linkedin }: { name: string; linkedin: string | null }) {
  const url = externalUrl(linkedin);
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-zinc-100 hover:text-white hover:underline"
      >
        {name}
      </a>
    );
  }
  return <span className="font-medium text-zinc-100">{name}</span>;
}

function roleAtCompany(role?: string | null, company?: string | null) {
  const r = role?.trim() || "";
  const c = company?.trim() || "";
  if (r && c) return `${r} @ ${c}`;
  if (r) return r;
  if (c) return c;
  return "";
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-100">
        {Icon && <Icon size={20} className="text-brand-500" />}
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function OrgBlock({
  name,
  website,
  logo,
  description,
  typeLabel,
}: {
  name: string | null;
  website: string | null;
  logo: string | null;
  description: string | null;
  typeLabel?: string | null;
}) {
  return (
    <div className="border-b border-[var(--border)] pb-6 last:border-0 last:pb-0">
      <SponsorDisplay
        name={name}
        website={website}
        logo={logo}
        description={description}
        typeLabel={typeLabel}
        compact
      />
    </div>
  );
}

function placementLabel(placement: string, customLabel: string | null): string {
  if (placement === "custom") return customLabel || "Prize";
  return PRIZE_PLACEMENT_LABELS[placement] || placement;
}

function placementRank(placement: string): number {
  const order: Record<string, number> = {
    first: 1,
    second: 2,
    third: 3,
    winning: 4,
    custom: 5,
  };
  return order[placement] ?? 99;
}

function groupPrizesBySponsor(
  prizes: EventDetail["prizes"]
): { sponsor: string; categories: { name: string; items: EventDetail["prizes"] }[] }[] {
  const bySponsor = new Map<string, EventDetail["prizes"]>();
  for (const prize of prizes) {
    const key = prize.companyName || "Prizes";
    const list = bySponsor.get(key) || [];
    list.push(prize);
    bySponsor.set(key, list);
  }

  return Array.from(bySponsor.entries()).map(([sponsor, items]) => {
    const byCategory = new Map<string, EventDetail["prizes"]>();
    for (const item of items) {
      const cat = item.prizeName || "Prize";
      const list = byCategory.get(cat) || [];
      list.push(item);
      byCategory.set(cat, list);
    }
    return {
      sponsor,
      categories: Array.from(byCategory.entries()).map(([name, catItems]) => ({
        name,
        items: [...catItems].sort(
          (a, b) => placementRank(a.placement) - placementRank(b.placement)
        ),
      })),
    };
  });
}

function groupByDay<T extends { startTime: string | null }>(
  items: T[]
): { dayKey: string; heading: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    if (!item.startTime) continue;
    const key = localDateKeyFromIso(item.startTime);
    const list = map.get(key) || [];
    list.push(item);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dayKey, dayItems]) => ({
      dayKey,
      heading: formatDayHeading(dayKey),
      items: dayItems,
    }));
}

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<EventDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    loadData<EventDetail>(`/data/events/${slug}.json`)
      .then(setData)
      .catch(() => setNotFound(true));
  }, [slug]);

  const prizeGroups = useMemo(
    () => (data ? groupPrizesBySponsor(data.prizes) : []),
    [data]
  );

  const scheduleByDay = useMemo(
    () => (data ? groupByDay(data.schedule) : []),
    [data]
  );

  const speakersByDay = useMemo(() => {
    if (!data) return [];
    const withTimes = data.speakers.filter((s) => s.startTime);
    const withoutTimes = data.speakers.filter((s) => !s.startTime);
    const days = withTimes.length > 0 ? groupByDay(withTimes) : [];
    if (withoutTimes.length > 0) {
      days.push({ dayKey: "other", heading: withTimes.length > 0 ? "Also speaking" : "", items: withoutTimes });
    }
    return days;
  }, [data]);

  const sponsorReps = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    const reps: {
      username: string;
      linkedin: string | null;
      role: string | null;
      companyName: string;
    }[] = [];
    for (const sponsor of data.sponsors) {
      for (const rep of sponsor.representatives) {
        const key = rep.username.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        reps.push({
          username: rep.username,
          linkedin: rep.linkedin,
          role: rep.role || null,
          companyName: rep.companyName || sponsor.companyName,
        });
      }
    }
    return reps;
  }, [data]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-zinc-100">Event not found</h1>
        <Link to="/events" className="mt-4 inline-block text-brand-500 hover:underline">
          &larr; Back to Events
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const { event, tracks, sponsors, partners, prizes, speakers, judges, hosts, links, photos } =
    data;

  const venuePartners = partners.filter((p) => p.partnerType === "venue");
  const otherPartners = partners.filter((p) => p.partnerType !== "venue");
  const regularHosts = hosts.filter((h) => h.hostType !== "volunteer");
  const volunteers = hosts.filter((h) => h.hostType === "volunteer");

  const dateLine =
    event.endDate && event.endDate !== event.eventDate
      ? `${formatDate(event.eventDate)} – ${formatDate(event.endDate)}`
      : formatDate(event.eventDate);

  const timeLine = event.startTime
    ? `${formatTime(event.startTime)}${event.endTime ? ` – ${formatTime(event.endTime)}` : ""}`
    : null;

  return (
    <div>
      {event.coverImageUrl && (
        <div className="relative mt-[86px] aspect-[21/9] max-h-[420px] w-full overflow-hidden bg-[var(--panel)]">
          <img
            src={event.coverImageUrl}
            alt={event.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className={`mx-auto w-[90%] max-w-3xl py-10 ${event.coverImageUrl ? "" : "pt-[130px]"}`}>
        <div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--cyan)]/10 px-3 py-1 text-xs font-semibold text-[var(--cyan)]">
          {EVENT_TYPE_LABELS[event.type] || event.type}
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {event.name}
        </h1>

        <div className="mt-5 space-y-2 text-sm text-[var(--muted)]">
          <p className="flex items-start gap-2">
            <Calendar size={16} className="mt-0.5 shrink-0 text-brand-500" />
            <span>{dateLine}</span>
          </p>
          {timeLine && (
            <p className="flex items-start gap-2">
              <Clock size={16} className="mt-0.5 shrink-0 text-brand-500" />
              <span>{timeLine}</span>
            </p>
          )}
          {event.location && (
            <p className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-brand-500" />
              {mapsUrlForLocation(event.location, event.locationLat, event.locationLng) ? (
                <a
                  href={mapsUrlForLocation(event.location, event.locationLat, event.locationLng)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-400 hover:underline"
                >
                  {event.location}
                </a>
              ) : (
                <span>{event.location}</span>
              )}
            </p>
          )}
        </div>

        {(event.lumaLink || event.eventbriteLink || event.groupLink) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {event.lumaLink && (
              <a
                href={event.lumaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Register on Luma <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            )}
            {event.eventbriteLink && (
              <a
                href={event.eventbriteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Eventbrite <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            )}
            {event.groupLink && (
              <a
                href={event.groupLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                {/discord/i.test(event.groupLink)
                  ? "Join Discord"
                  : /whatsapp|wa\.me|chat\.whatsapp/i.test(event.groupLink)
                    ? "Join WhatsApp"
                    : "Join group"}{" "}
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            )}
          </div>
        )}

        {event.description && (
          <div className="mt-8 border-t border-zinc-800 pt-8">
            <p className="whitespace-pre-wrap leading-relaxed text-zinc-300">{event.description}</p>
          </div>
        )}

        {event.theme && (
          <Section title="Theme">
            <p className="text-lg text-zinc-100">{event.theme}</p>
          </Section>
        )}

        {tracks.length > 0 && (
          <Section title="Tracks">
            <div className="space-y-6">
              {tracks.map((track) => (
                <div key={track.id} className="border-b border-zinc-800 pb-5 last:border-0 last:pb-0">
                  <h3 className="text-base font-semibold text-zinc-100">{track.name}</h3>
                  {track.description && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                      {track.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {sponsors.length > 0 && (
          <Section title="Sponsors" icon={Trophy}>
            <div className="grid gap-5 sm:grid-cols-2">
              {sponsors.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-[var(--border)] bg-[rgba(6,17,28,0.6)] p-5"
                >
                  <SponsorDisplay
                    name={s.companyName}
                    website={s.companyWebsite}
                    logo={s.companyLogo}
                    description={s.companyDescription}
                    compact
                  />
                </div>
              ))}
            </div>
          </Section>
        )}

        {venuePartners.length > 0 && (
          <Section title="Venue Partner">
            <div className="space-y-6">
              {venuePartners.map((p, i) => (
                <OrgBlock
                  key={i}
                  name={p.companyName}
                  website={p.companyWebsite}
                  logo={p.companyLogo}
                  description={p.companyDescription}
                />
              ))}
            </div>
          </Section>
        )}

        {otherPartners.length > 0 && (
          <Section title="Partners">
            <div className="space-y-6">
              {otherPartners.map((p, i) => (
                <OrgBlock
                  key={i}
                  name={p.companyName}
                  website={p.companyWebsite}
                  logo={p.companyLogo}
                  description={p.companyDescription}
                  typeLabel={
                    p.partnerType === "custom"
                      ? p.customType
                      : PARTNER_TYPE_LABELS[p.partnerType] || p.partnerType
                  }
                />
              ))}
            </div>
          </Section>
        )}

        {prizes.length > 0 && (
          <Section title="Prizes" icon={Trophy}>
            <div className="space-y-4">
              {prizeGroups.map((group) => (
                <div
                  key={group.sponsor}
                  className="rounded-xl border border-zinc-700 bg-zinc-900/95 p-5 shadow-lg shadow-black/25"
                >
                  {group.sponsor !== "Prizes" && (
                    <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
                      {group.sponsor}
                    </p>
                  )}
                  <div className="space-y-4">
                    {group.categories.map((cat) => (
                      <div key={cat.name}>
                        <h3 className="font-semibold text-zinc-50">{cat.name}</h3>
                        <ul className="mt-2 space-y-2">
                          {cat.items.map((p, i) => (
                            <li key={i} className="text-sm text-zinc-300">
                              <span className="font-medium text-zinc-100">
                                {placementLabel(p.placement, p.customLabel)}
                              </span>
                              {p.amount && (
                                <span className="text-zinc-400"> — {p.amount}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {scheduleByDay.length > 0 && (
          <Section title="Schedule" icon={Clock}>
            <div className="space-y-8">
              {scheduleByDay.map((day) => (
                <div key={day.dayKey}>
                  <h3 className="text-base font-semibold text-zinc-200">{day.heading}</h3>
                  <ul className="mt-3 space-y-0">
                    {day.items.map((item, index) => (
                      <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
                        {index < day.items.length - 1 && (
                          <span
                            className="absolute left-[5px] top-3 bottom-0 w-px bg-zinc-700"
                            aria-hidden
                          />
                        )}
                        <span className="relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-zinc-400">
                            {formatClockFromIso(item.startTime)}
                            {" – "}
                            {formatClockFromIso(item.endTime)}
                          </p>
                          <p className="mt-0.5 font-medium text-zinc-100">{item.topic}</p>
                          {item.speakers.length > 0 && (
                            <p className="mt-1 text-sm text-zinc-500">
                              {item.speakers.map((s, i) => (
                                <span key={i}>
                                  {i > 0 && ", "}
                                  <PersonLink name={s.username} linkedin={s.linkedin} />
                                </span>
                              ))}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )}

        {speakers.length > 0 && (
          <Section title="Speakers" icon={Mic}>
            <div className="space-y-8">
              {speakersByDay.map((day) => (
                <div key={day.dayKey || "speakers"}>
                  {day.heading && (
                    <h3 className="mb-3 text-base font-semibold text-zinc-200">{day.heading}</h3>
                  )}
                  <ul className="mt-3 space-y-0">
                    {day.items.map((s, index) => (
                      <li
                        key={`${s.username}-${s.startTime}-${index}`}
                        className="relative flex gap-3 pb-5 last:pb-0"
                      >
                        {index < day.items.length - 1 && (
                          <span
                            className="absolute left-[5px] top-3 bottom-0 w-px bg-zinc-700"
                            aria-hidden
                          />
                        )}
                        <span className="relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
                        <div className="min-w-0 flex-1">
                          {s.startTime && s.endTime && (
                            <p className="text-sm text-zinc-400">
                              {formatClockFromIso(s.startTime)}
                              {" – "}
                              {formatClockFromIso(s.endTime)}
                            </p>
                          )}
                          <p className="mt-0.5 text-zinc-200">
                            <PersonLink name={s.username} linkedin={s.linkedin} />
                            {s.topic ? (
                              <span className="text-zinc-400"> · {s.topic}</span>
                            ) : null}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )}

        {judges.length > 0 && (
          <Section title="Judges" icon={Gavel}>
            <ul className="space-y-3">
              {judges.map((j, i) => {
                const meta = roleAtCompany(j.role || j.title, j.companyName);
                return (
                  <li key={i} className="border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
                    <p className="text-zinc-200">
                      <PersonLink name={j.username} linkedin={j.linkedin} />
                      {meta ? <span className="text-zinc-400"> · {meta}</span> : null}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        {sponsorReps.length > 0 && (
          <Section title="Sponsor Representatives" icon={Handshake}>
            <ul className="space-y-3">
              {sponsorReps.map((r, i) => {
                const meta = roleAtCompany(r.role, r.companyName);
                return (
                  <li key={i} className="border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
                    <p className="text-zinc-200">
                      <PersonLink name={r.username} linkedin={r.linkedin} />
                      {meta ? <span className="text-zinc-400"> · {meta}</span> : null}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        {regularHosts.length > 0 && (
          <Section title="Hosts" icon={Users}>
            <ul className="space-y-3">
              {regularHosts.map((h, i) => {
                // Only show written extra/sub role — not generic "Host"
                const meta = roleAtCompany(h.role, h.companyName);
                return (
                  <li key={i} className="border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
                    <p className="text-zinc-200">
                      <PersonLink name={h.username} linkedin={h.linkedin} />
                      {meta ? <span className="text-zinc-400"> · {meta}</span> : null}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        {volunteers.length > 0 && (
          <Section title="Volunteers" icon={Users}>
            <ul className="space-y-3">
              {volunteers.map((h, i) => {
                const meta = roleAtCompany(h.role || h.title, h.companyName);
                return (
                  <li key={i} className="border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
                    <p className="text-zinc-200">
                      <PersonLink name={h.username} linkedin={h.linkedin} />
                      {meta ? <span className="text-zinc-400"> · {meta}</span> : null}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        {photos.length > 0 && (
          <Section title="Gallery">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square overflow-hidden rounded-lg bg-zinc-800"
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || ""}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {photo.caption && (
                    <p className="absolute inset-x-0 bottom-0 bg-zinc-950/70 px-2 py-1 text-xs text-zinc-200">
                      {photo.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {links.length > 0 && (
          <Section title="Links">
            <div className="flex flex-wrap gap-3">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  {link.label} <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </Section>
        )}

        <div className="mt-12">
          <Link to="/events" className="text-sm text-brand-500 hover:underline">
            &larr; Back to Events
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
