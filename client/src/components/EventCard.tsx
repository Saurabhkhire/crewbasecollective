import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react";
import { formatDateShort, formatTime, EVENT_TYPE_LABELS } from "@/lib/utils";

interface EventCardProps {
  slug: string;
  name: string;
  type: string;
  isPartnerEvent?: boolean;
  eventDate: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location: string | null;
  coverImageUrl: string | null;
}

export function EventCard({
  slug,
  name,
  type,
  isPartnerEvent = false,
  eventDate,
  endDate,
  startTime,
  endTime,
  location,
  coverImageUrl,
}: EventCardProps) {
  const dateLabel =
    endDate && endDate !== eventDate
      ? `${formatDateShort(eventDate)} – ${formatDateShort(endDate)}`
      : formatDateShort(eventDate);

  const timeLabel = startTime
    ? `${formatTime(startTime)}${endTime ? ` – ${formatTime(endTime)}` : ""}`
    : null;

  return (
    <Link to={`/events/${slug}`} className="group card overflow-hidden !p-0">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-deep)]">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={name}
            className="h-full w-full object-contain p-2 transition group-hover:opacity-95"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--cyan)]">
            <Calendar size={48} />
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1 text-xs font-semibold text-[var(--cyan)]">
            {EVENT_TYPE_LABELS[type] || type}
          </span>
          {isPartnerEvent && (
            <span className="rounded-full border border-[var(--cyan)]/45 bg-[var(--cyan)]/20 px-4 py-1.5 text-sm font-semibold text-white">
              Partner Event
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold leading-snug text-white group-hover:text-[var(--cyan)]">
          {name}
        </h3>
        <div className="mt-3 space-y-1.5 text-sm text-[var(--muted)]">
          <p className="flex items-start gap-2">
            <Calendar size={15} className="mt-0.5 shrink-0 text-[var(--cyan)]" />
            <span>{dateLabel}</span>
          </p>
          {timeLabel && (
            <p className="flex items-start gap-2">
              <Clock size={15} className="mt-0.5 shrink-0 text-[var(--cyan)]" />
              <span>{timeLabel}</span>
            </p>
          )}
          {location && (
            <p className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 shrink-0 text-[var(--cyan)]" />
              <span className="line-clamp-2">{location}</span>
            </p>
          )}
        </div>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--cyan)] opacity-0 transition group-hover:opacity-100">
          View Details <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
