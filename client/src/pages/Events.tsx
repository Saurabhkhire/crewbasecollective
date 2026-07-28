import { useEffect, useState } from "react";
import { EventCard } from "@/components/EventCard";
import { loadData } from "@/lib/api";

interface EventRow {
  id: string;
  slug: string;
  name: string;
  type: string;
  eventDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  coverImageUrl: string | null;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData<{ events: EventRow[] }>("/data/events-index.json")
      .then((data) => {
        setEvents(data.events || []);
        setError("");
      })
      .catch(() => {
        setEvents([]);
        setError("Could not load events. Please try again shortly.");
      })
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="mx-auto w-[90%] max-w-6xl pb-20 pt-[130px]">
      <div className="eyebrow">Community calendar</div>
      <h1 className="section-title">Events</h1>
      <p className="section-subtitle">
        Hackathons, pitch competitions, workshops, mixers, and more.
      </p>

      {!loaded ? (
        <p className="mt-12 text-[var(--muted)]">Loading events…</p>
      ) : error ? (
        <p className="mt-12 text-[var(--muted)]">{error}</p>
      ) : events.length === 0 ? (
        <p className="mt-12 text-[var(--muted)]">No events published yet. Check back soon!</p>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              slug={event.slug}
              name={event.name}
              type={event.type}
              eventDate={event.eventDate}
              endDate={event.endDate}
              startTime={event.startTime}
              endTime={event.endTime}
              location={event.location}
              coverImageUrl={event.coverImageUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
