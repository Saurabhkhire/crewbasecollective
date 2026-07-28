import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { RequestForms } from "@/components/RequestForms";
import { EventCard } from "@/components/EventCard";
import { WireStage } from "@/components/WireStage";
import { loadData } from "@/lib/api";
import { partitionEventsBySchedule } from "@/lib/utils";

interface EventRow {
  id: string;
  slug: string;
  name: string;
  type: string;
  isPartnerEvent: boolean;
  eventDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  coverImageUrl: string | null;
}

function EventGrid({ events }: { events: EventRow[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard
          key={event.id}
          slug={event.slug}
          name={event.name}
          type={event.type}
          isPartnerEvent={event.isPartnerEvent}
          eventDate={event.eventDate}
          endDate={event.endDate}
          startTime={event.startTime}
          endTime={event.endTime}
          location={event.location}
          coverImageUrl={event.coverImageUrl}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [peopleCount, setPeopleCount] = useState(0);
  const [sponsorCount, setSponsorCount] = useState(0);

  useEffect(() => {
    loadData<{ events: EventRow[] }>("/data/events-index.json")
      .then((data) => setEvents(data.events || []))
      .catch(() => setEvents([]));
    loadData<{ people: unknown[] }>("/data/people.json")
      .then((data) => setPeopleCount(data.people?.length || 0))
      .catch(() => setPeopleCount(0));
    loadData<{ sponsors: unknown[] }>("/data/sponsors.json")
      .then((data) => setSponsorCount(data.sponsors?.length || 0))
      .catch(() => setSponsorCount(0));
  }, []);

  const { upcoming, past } = partitionEventsBySchedule(events);
  const featuredUpcoming = upcoming.slice(0, 3);
  const featuredPast = past.slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">Build. Meet. Grow together.</div>
          <h1 className="hero-title">
            Building communities
            <br />
            through events that
            <br />
            <span className="hero-title-accent">shape the future.</span>
          </h1>
          <p className="hero-lead">
            We bring together builders, founders, and innovators through hackathons, pitch
            competitions, workshops, and community events.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/events" className="btn-primary">
              Explore Events <ArrowRight size={16} />
            </Link>
            <a href="#get-involved" className="btn-secondary">
              Learn More
            </a>
          </div>
        </div>

        <WireStage />
      </section>

      <section className="stats-bar">
        <div className="stat-cell">
          <strong className="block text-[31px] font-bold text-white">{events.length}+</strong>
          <span className="mt-[7px] block text-[13px] text-[var(--muted)]">Events</span>
        </div>
        <div className="stat-cell">
          <strong className="block text-[31px] font-bold text-white">{sponsorCount}+</strong>
          <span className="mt-[7px] block text-[13px] text-[var(--muted)]">Sponsors & Partners</span>
        </div>
        <div className="stat-cell">
          <strong className="block text-[31px] font-bold text-white">{peopleCount}+</strong>
          <span className="mt-[7px] block text-[13px] text-[var(--muted)]">Community Members</span>
        </div>
        <div className="stat-cell">
          <strong className="block text-[31px] font-bold text-white">SF Bay</strong>
          <span className="mt-[7px] block text-[13px] text-[var(--muted)]">Based & Growing</span>
        </div>
      </section>

      {featuredUpcoming.length > 0 && (
        <section className="mx-auto mb-16 w-[90%] max-w-6xl">
          <div className="eyebrow">What&apos;s next</div>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h2 className="section-title">Upcoming Events</h2>
            <Link to="/events" className="btn-outline-pill">
              All Events <ArrowRight size={14} />
            </Link>
          </div>
          <EventGrid events={featuredUpcoming} />
        </section>
      )}

      {featuredPast.length > 0 && (
        <section className="mx-auto mb-[90px] w-[90%] max-w-6xl">
          <div className="eyebrow">Recap</div>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h2 className="section-title">Past Events</h2>
            <Link to="/events" className="btn-outline-pill">
              All Events <ArrowRight size={14} />
            </Link>
          </div>
          <EventGrid events={featuredPast} />
        </section>
      )}

      <section id="get-involved" className="mx-auto mb-20 w-[90%] max-w-6xl scroll-mt-28">
        <div className="eyebrow">Get involved</div>
        <h2 className="section-title mb-3">Ways to Join the Collective</h2>
        <p className="section-subtitle mb-8">
          Sponsor, speak, judge, partner, volunteer, or join as a member — we&apos;d love to hear
          from you.
        </p>
        <RequestForms events={events} />
      </section>
    </>
  );
}
