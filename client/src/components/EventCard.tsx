import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react";
import { formatDateShort, formatTime, EVENT_TYPE_LABELS } from "@/lib/utils";

interface EventCardProps {
  slug: string;
  name: string;
  type: string;
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
      <div className="relative aspect-[16/9] overflow-hidden bg-[var(--panel)]">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={name}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--cyan)]">
            <Calendar size={48} />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full border border-[var(--border)] bg-[var(--panel)]/90 px-3 py-1 text-xs font-semibold text-[var(--cyan)] backdrop-blur">
          {EVENT_TYPE_LABELS[type] || type}
        </span>
      </div>
      <div className="p-5">
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
