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
  Link2,
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
import { normalizeEventLinks } from "@/lib/event-links";

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
    lumaLinks?: string[];
    eventbriteLinks?: string[];
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

type BandTone = "default" | "sponsors" | "people" | "prizes";

const BAND_BODY: Record<BandTone, string> = {
  default:
    "border-[var(--border)] bg-[linear-gradient(180deg,rgba(8,24,39,0.95),rgba(3,11,19,0.98))]",
  sponsors:
    "border-[var(--border)] bg-[linear-gradient(180deg,rgba(8,24,39,0.95),rgba(3,11,19,0.98))]",
  people:
    "border-[var(--border)] bg-[linear-gradient(180deg,rgba(8,24,39,0.95),rgba(3,11,19,0.98))]",
  prizes:
    "border-[var(--border)] bg-[linear-gradient(180deg,rgba(8,24,39,0.95),rgba(3,11,19,0.98))]",
};

const BAND_HEADER =
  "border-b border-[rgba(24,174,232,0.28)] bg-[linear-gradient(90deg,rgba(24,174,232,0.22),rgba(12,130,194,0.1))]";

function EventBand({
  title,
  icon: Icon,
  tone = "default",
  children,
}: {
  title: string;
  icon?: LucideIcon;
  tone?: BandTone;
  children: React.ReactNode;
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border ${BAND_BODY[tone]}`}>
      <div className={`flex items-center gap-2 px-5 py-4 sm:px-6 ${BAND_HEADER}`}>
        {Icon && <Icon size={18} className="shrink-0 text-[#7dd3fc]" />}
        <h2 className="text-base font-bold uppercase tracking-[0.55px] text-[#b8e8ff] sm:text-lg">
          {title}
        </h2>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function EventMetaCard({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[rgba(6,17,28,0.88)] p-4 backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.5px] text-[#7dd3fc]">
        <Icon size={14} className="shrink-0" />
        {label}
      </div>
      <div className="text-[15px] font-medium leading-snug text-white">{children}</div>
    </div>
  );
}

function TimelineList({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-0">{children}</ul>;
}

function TimelineItem({
  isLast,
  time,
  title,
  subtitle,
}: {
  isLast: boolean;
  time?: string | null;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!isLast && (
        <span
          className="absolute left-[5px] top-3 bottom-0 w-px bg-[rgba(24,174,232,0.25)]"
          aria-hidden
        />
      )}
      <span className="relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.45)]" />
      <div className="min-w-0 flex-1">
        {time ? <p className="text-sm text-[var(--muted)]">{time}</p> : null}
        <p className={`font-medium text-white ${time ? "mt-0.5" : ""}`}>{title}</p>
        {subtitle ? <div className="mt-1 text-sm text-[var(--muted)]">{subtitle}</div> : null}
      </div>
    </li>
  );
}

function PersonLink({ name, linkedin }: { name: string; linkedin: string | null }) {
  const url = externalUrl(linkedin);
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-white transition hover:text-[var(--cyan)]"
      >
        {name}
      </a>
    );
  }
  return <span className="font-medium text-white">{name}</span>;
}

function roleAtCompany(role?: string | null, company?: string | null) {
  const r = role?.trim() || "";
  const c = company?.trim() || "";
  if (r && c) return `${r} @ ${c}`;
  if (r) return r;
  if (c) return c;
  return "";
}

function PersonRow({ name, linkedin, meta }: { name: string; linkedin: string | null; meta: string }) {
  return (
    <li className="border-b border-[var(--border)] py-3.5 last:border-0 last:pb-0">
      <p className="text-[15px] leading-relaxed text-[var(--muted)]">
        <PersonLink name={name} linkedin={linkedin} />
        {meta ? <span className="text-[var(--muted)]"> · {meta}</span> : null}
      </p>
    </li>
  );
}

function ExternalLinkRow({ label, href }: { label: string; href: string }) {
  const url = externalUrl(href);
  if (!url) return null;
  return (
    <li>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 rounded-2xl border border-[rgba(24,174,232,0.35)] bg-[rgba(6,17,28,0.88)] px-4 py-3.5 transition hover:border-[rgba(56,189,248,0.55)] hover:bg-[rgba(12,36,56,0.95)]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(56,189,248,0.15)] text-[#7dd3fc] ring-1 ring-[rgba(56,189,248,0.35)]">
          <Link2 size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-white group-hover:text-[#b8e8ff]">{label}</span>
          <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{url}</span>
        </span>
        <ExternalLink size={16} className="shrink-0 text-[var(--cyan)] opacity-80" />
      </a>
    </li>
  );
}

type PlatformKind = "luma" | "eventbrite" | "discord" | "whatsapp" | "group";

function platformFromUrl(url: string): PlatformKind {
  if (/discord/i.test(url)) return "discord";
  if (/whatsapp|wa\.me|chat\.whatsapp/i.test(url)) return "whatsapp";
  return "group";
}

const PLATFORM_STYLES: Record<
  PlatformKind | "luma" | "eventbrite",
  { ring: string; bg: string; label: string }
> = {
  luma: {
    ring: "ring-violet-400/40",
    bg: "bg-gradient-to-r from-violet-700/90 to-fuchsia-600/85",
    label: "Luma",
  },
  eventbrite: {
    ring: "ring-orange-400/40",
    bg: "bg-gradient-to-r from-orange-600/95 to-amber-500/90",
    label: "Eventbrite",
  },
  discord: {
    ring: "ring-indigo-400/40",
    bg: "bg-gradient-to-r from-indigo-700/95 to-violet-700/90",
    label: "Discord",
  },
  whatsapp: {
    ring: "ring-emerald-400/40",
    bg: "bg-gradient-to-r from-emerald-600/95 to-green-500/90",
    label: "WhatsApp",
  },
  group: {
    ring: "ring-sky-400/40",
    bg: "bg-gradient-to-r from-sky-700/95 to-cyan-600/90",
    label: "Group",
  },
};

function PlatformLinkButton({
  href,
  kind,
  label,
  index,
}: {
  href: string;
  kind: PlatformKind | "luma" | "eventbrite";
  label: string;
  index?: number;
}) {
  const url = externalUrl(href);
  if (!url) return null;
  const style = PLATFORM_STYLES[kind];
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white ring-1 transition hover:brightness-110 ${style.bg} ${style.ring}`}
    >
      {label}
      {typeof index === "number" && index > 0 ? ` ${index + 1}` : ""}
    </a>
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
      days.push({
        dayKey: "other",
        heading: withTimes.length > 0 ? "Also speaking" : "",
        items: withoutTimes,
      });
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
      <div className="mx-auto w-[90%] max-w-6xl px-4 py-24 pt-[130px] text-center">
        <h1 className="section-title">Event not found</h1>
        <Link to="/events" className="mt-4 inline-block text-[var(--cyan)] hover:underline">
          &larr; Back to Events
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center py-24 pt-[130px]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--cyan)]" />
      </div>
    );
  }

  const { event, tracks, sponsors, partners, prizes, speakers, judges, hosts, links, photos } =
    data;

  const venuePartners = partners.filter((p) => p.partnerType === "venue");
  const otherPartners = partners.filter((p) => p.partnerType !== "venue");
  const regularHosts = hosts.filter((h) => h.hostType !== "volunteer");
  const volunteers = hosts.filter((h) => h.hostType === "volunteer");

  const fullDateLine =
    event.endDate && event.endDate !== event.eventDate
      ? `${formatDate(event.eventDate)} – ${formatDate(event.endDate)}`
      : formatDate(event.eventDate);

  const timeLine = event.startTime
    ? `${formatTime(event.startTime)}${event.endTime ? ` – ${formatTime(event.endTime)}` : ""}`
    : null;

  const lumaLinks = normalizeEventLinks(event.lumaLinks, event.lumaLink);
  const eventbriteLinks = normalizeEventLinks(event.eventbriteLinks, event.eventbriteLink);
  const groupUrl = externalUrl(event.groupLink);
  const groupKind = groupUrl ? platformFromUrl(groupUrl) : null;

  const hasRegistrationLinks = Boolean(
    lumaLinks.length || eventbriteLinks.length || groupUrl
  );

  const primaryRegisterUrl =
    lumaLinks[0] || eventbriteLinks[0] || groupUrl || null;

  const mapsUrl = event.location
    ? mapsUrlForLocation(event.location, event.locationLat, event.locationLng)
    : null;

  return (
    <div className="pb-20">
      <div className="mx-auto w-[90%] max-w-6xl pt-[110px]">
        {event.coverImageUrl && (
          <div className="card overflow-hidden !p-0">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--panel)] sm:aspect-[16/9]">
              <img
                src={event.coverImageUrl}
                alt={event.name}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        )}

        <div className={event.coverImageUrl ? "mt-8" : ""}>
          <div className="eyebrow">Event</div>
          <span className="inline-block rounded-full border border-[var(--border)] bg-[rgba(9,247,223,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--cyan)]">
            {EVENT_TYPE_LABELS[event.type] || event.type}
          </span>
          <h1 className="section-title mt-4">{event.name}</h1>

          <div className="mt-6 space-y-3">
            <EventMetaCard icon={Calendar} label="Date & Time">
              <span className="block font-bold text-white">{fullDateLine}</span>
              {timeLine ? (
                <span className="mt-2 block text-sm font-bold text-white">{timeLine}</span>
              ) : (
                <span className="mt-2 block text-sm font-normal text-[var(--muted)]">
                  Time to be announced
                </span>
              )}
            </EventMetaCard>
            {event.location && (
              <EventMetaCard icon={MapPin} label="Location">
                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-[#7dd3fc] hover:underline"
                  >
                    {event.location}
                  </a>
                ) : (
                  event.location
                )}
              </EventMetaCard>
            )}
          </div>

          <div className="mt-6">
            {primaryRegisterUrl ? (
              <a
                href={primaryRegisterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex"
              >
                Register
              </a>
            ) : (
              <button type="button" className="btn-primary cursor-default opacity-50" disabled>
                Register
              </button>
            )}
          </div>
        </div>

        <div className="mt-10 space-y-6">
          {hasRegistrationLinks && (
            <EventBand title="Registration" icon={Link2} tone="default">
              <div className="flex flex-wrap gap-3">
                {lumaLinks.map((href, i) => (
                  <PlatformLinkButton
                    key={`luma-${i}-${href}`}
                    href={href}
                    kind="luma"
                    label={lumaLinks.length > 1 ? `Registration ${i + 1}` : "Register on Luma"}
                    index={i}
                  />
                ))}
                {eventbriteLinks.map((href, i) => (
                  <PlatformLinkButton
                    key={`eb-${i}-${href}`}
                    href={href}
                    kind="eventbrite"
                    label={
                      eventbriteLinks.length > 1 ? `Registration ${i + 1}` : "Register on Eventbrite"
                    }
                    index={i}
                  />
                ))}
                {groupUrl && groupKind && (
                  <PlatformLinkButton
                    href={groupUrl}
                    kind={groupKind}
                    label={
                      groupKind === "discord"
                        ? "Join Discord"
                        : groupKind === "whatsapp"
                          ? "Join WhatsApp"
                          : "Join group"
                    }
                  />
                )}
              </div>
            </EventBand>
          )}

          {event.description && (
            <EventBand title="Description" tone="default">
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--muted)]">
                {event.description}
              </p>
            </EventBand>
          )}

          {event.theme && (
            <EventBand title="Theme" tone="default">
              <p className="text-lg font-medium text-white">{event.theme}</p>
            </EventBand>
          )}

          {tracks.length > 0 && (
            <EventBand title="Tracks" tone="default">
              <div className="space-y-5">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className="border-b border-[var(--border)] pb-5 last:border-0 last:pb-0"
                  >
                    <h3 className="font-semibold text-white">{track.name}</h3>
                    {track.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)]">
                        {track.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </EventBand>
          )}

          {sponsors.length > 0 && (
            <EventBand title="Sponsors" icon={Trophy} tone="sponsors">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {sponsors.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-[var(--border)] bg-[rgba(2,7,13,0.45)] p-4"
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
            </EventBand>
          )}

          {venuePartners.length > 0 && (
            <EventBand title="Venue Partner" tone="sponsors">
              <div className="space-y-6">
                {venuePartners.map((p, i) => (
                  <div
                    key={i}
                    className="border-b border-[var(--border)] pb-6 last:border-0 last:pb-0"
                  >
                    <SponsorDisplay
                      name={p.companyName}
                      website={p.companyWebsite}
                      logo={p.companyLogo}
                      description={p.companyDescription}
                      compact
                    />
                  </div>
                ))}
              </div>
            </EventBand>
          )}

          {otherPartners.length > 0 && (
            <EventBand title="Partners" tone="sponsors">
              <div className="space-y-6">
                {otherPartners.map((p, i) => (
                  <div
                    key={i}
                    className="border-b border-[var(--border)] pb-6 last:border-0 last:pb-0"
                  >
                    <SponsorDisplay
                      name={p.companyName}
                      website={p.companyWebsite}
                      logo={p.companyLogo}
                      description={p.companyDescription}
                      typeLabel={
                        p.partnerType === "custom"
                          ? p.customType
                          : PARTNER_TYPE_LABELS[p.partnerType] || p.partnerType
                      }
                      compact
                    />
                  </div>
                ))}
              </div>
            </EventBand>
          )}

          {prizes.length > 0 && (
            <EventBand title="Prizes" icon={Trophy} tone="prizes">
              <div className="space-y-5">
                {prizeGroups.map((group) => (
                  <div
                    key={group.sponsor}
                    className="rounded-xl border border-[var(--border)] bg-[rgba(2,7,13,0.4)] p-4"
                  >
                    {group.sponsor !== "Prizes" && (
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--cyan)]">
                        {group.sponsor}
                      </p>
                    )}
                    <div className="space-y-4">
                      {group.categories.map((cat) => (
                        <div key={cat.name}>
                          <h3 className="font-semibold text-white">{cat.name}</h3>
                          <ul className="mt-2 space-y-2">
                            {cat.items.map((p, i) => (
                              <li key={i} className="text-sm text-[var(--muted)]">
                                <span className="font-medium text-white">
                                  {placementLabel(p.placement, p.customLabel)}
                                </span>
                                {p.amount && <span> — {p.amount}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </EventBand>
          )}

          {scheduleByDay.length > 0 && (
            <EventBand title="Schedule" icon={Clock} tone="default">
              <div className="space-y-8">
                {scheduleByDay.map((day) => (
                  <div key={day.dayKey}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-[#7dd3fc]">
                      {day.heading}
                    </h3>
                    <TimelineList>
                      {day.items.map((item, index) => (
                        <TimelineItem
                          key={item.id}
                          isLast={index === day.items.length - 1}
                          time={`${formatClockFromIso(item.startTime)} – ${formatClockFromIso(item.endTime)}`}
                          title={item.topic}
                          subtitle={
                            item.speakers.length > 0 ? (
                              <>
                                {item.speakers.map((s, i) => (
                                  <span key={i}>
                                    {i > 0 && ", "}
                                    <PersonLink name={s.username} linkedin={s.linkedin} />
                                  </span>
                                ))}
                              </>
                            ) : undefined
                          }
                        />
                      ))}
                    </TimelineList>
                  </div>
                ))}
              </div>
            </EventBand>
          )}

          {speakers.length > 0 && (
            <EventBand title="Speakers" icon={Mic} tone="people">
              <div className="space-y-8">
                {speakersByDay.map((day) => (
                  <div key={day.dayKey || "speakers"}>
                    {day.heading && (
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#7dd3fc]">
                        {day.heading}
                      </h3>
                    )}
                    <TimelineList>
                      {day.items.map((s, index) => {
                        const meta = roleAtCompany(s.title, s.companyName);
                        const topic = s.topic?.trim();
                        const time =
                          s.startTime && s.endTime
                            ? `${formatClockFromIso(s.startTime)} – ${formatClockFromIso(s.endTime)}`
                            : null;
                        const identity = (
                          <>
                            <PersonLink name={s.username} linkedin={s.linkedin} />
                            {meta ? (
                              <span className="font-normal text-[var(--muted)]"> · {meta}</span>
                            ) : null}
                          </>
                        );
                        return (
                          <TimelineItem
                            key={`${s.username}-${s.startTime}-${index}`}
                            isLast={index === day.items.length - 1}
                            time={time}
                            title={identity}
                            subtitle={
                              topic ? (
                                <span className="font-semibold text-white">{topic}</span>
                              ) : undefined
                            }
                          />
                        );
                      })}
                    </TimelineList>
                  </div>
                ))}
              </div>
            </EventBand>
          )}

          {judges.length > 0 && (
            <EventBand title="Judges" icon={Gavel} tone="people">
              <ul>
                {judges.map((j, i) => (
                  <PersonRow
                    key={i}
                    name={j.username}
                    linkedin={j.linkedin}
                    meta={roleAtCompany(j.role || j.title, j.companyName)}
                  />
                ))}
              </ul>
            </EventBand>
          )}

          {sponsorReps.length > 0 && (
            <EventBand title="Sponsor Representatives" icon={Handshake} tone="people">
              <ul>
                {sponsorReps.map((r, i) => (
                  <PersonRow
                    key={i}
                    name={r.username}
                    linkedin={r.linkedin}
                    meta={roleAtCompany(r.role, r.companyName)}
                  />
                ))}
              </ul>
            </EventBand>
          )}

          {regularHosts.length > 0 && (
            <EventBand title="Hosts" icon={Users} tone="people">
              <ul>
                {regularHosts.map((h, i) => (
                  <PersonRow
                    key={i}
                    name={h.username}
                    linkedin={h.linkedin}
                    meta={roleAtCompany(h.role || h.title, h.companyName)}
                  />
                ))}
              </ul>
            </EventBand>
          )}

          {volunteers.length > 0 && (
            <EventBand title="Volunteers" icon={Users} tone="people">
              <ul>
                {volunteers.map((h, i) => (
                  <PersonRow
                    key={i}
                    name={h.username}
                    linkedin={h.linkedin}
                    meta={roleAtCompany(h.role || h.title, h.companyName)}
                  />
                ))}
              </ul>
            </EventBand>
          )}

          {photos.length > 0 && (
            <EventBand title="Gallery" tone="default">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {photos.map((photo) => (
                  <figure
                    key={photo.id}
                    className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)]"
                  >
                    <div className="flex min-h-[180px] items-center justify-center bg-[rgba(2,7,13,0.55)] p-2 sm:min-h-[220px]">
                      <img
                        src={photo.imageUrl}
                        alt={photo.caption || "Event photo"}
                        className="max-h-[min(420px,55vh)] w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    {photo.caption && (
                      <figcaption className="border-t border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)]">
                        {photo.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </EventBand>
          )}

          {links.length > 0 && (
            <EventBand title="Links" icon={Link2} tone="default">
              <ul className="space-y-3">
                {links.map((link) => (
                  <ExternalLinkRow key={link.id} label={link.label} href={link.url} />
                ))}
              </ul>
            </EventBand>
          )}
        </div>

        <div className="mt-10">
          <Link to="/events" className="text-sm text-[var(--cyan)] hover:underline">
            &larr; Back to Events
          </Link>
        </div>
      </div>
    </div>
  );
}
