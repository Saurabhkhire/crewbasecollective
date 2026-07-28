import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { externalUrl, formatDateShort } from "@/lib/utils";

export interface EventRef {
  eventName: string;
  slug: string;
  eventDate: string;
}

export interface Person {
  id: string;
  username: string;
  email: string | null;
  linkedin: string | null;
  role: string;
  title: string | null;
  companyName: string | null;
  judged: EventRef[];
  spoke: EventRef[];
  sponsored: EventRef[];
  partnered: EventRef[];
  hosted: EventRef[];
  volunteered: EventRef[];
}

type RoleKey = "hosted" | "sponsored" | "judged" | "spoke" | "volunteered" | "partnered";

const ROLE_META: { key: RoleKey; label: string; short: string }[] = [
  { key: "hosted", label: "Hosted", short: "host" },
  { key: "sponsored", label: "Sponsor rep", short: "sponsor" },
  { key: "judged", label: "Judged", short: "judge" },
  { key: "spoke", label: "Spoke", short: "speaker" },
  { key: "volunteered", label: "Volunteered", short: "volunteer" },
  { key: "partnered", label: "Partnered", short: "partner" },
];

const SECTIONS: { key: RoleKey; title: string }[] = [
  { key: "hosted", title: "Hosts" },
  { key: "sponsored", title: "Sponsor Representatives" },
  { key: "judged", title: "Judges" },
  { key: "spoke", title: "Speakers" },
  { key: "volunteered", title: "Volunteers" },
];

function roleTags(person: Person): string {
  return ROLE_META.filter((r) => (person[r.key] || []).length > 0)
    .map((r) => r.short)
    .join(" · ");
}

function roleStats(person: Person) {
  return ROLE_META.map((r) => {
    const events = person[r.key] || [];
    return { ...r, events, count: events.length };
  }).filter((r) => r.count > 0);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function PersonIdentity({ person }: { person: Person }) {
  const linkedin = externalUrl(person.linkedin);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[rgba(9,247,223,0.3)] bg-[rgba(9,247,223,0.08)] text-xs font-bold text-[var(--cyan)]">
        {initials(person.username)}
      </div>
      <div className="min-w-0">
        {linkedin ? (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate font-semibold text-white hover:text-[var(--cyan)]"
            onClick={(e) => e.stopPropagation()}
          >
            {person.username}
          </a>
        ) : (
          <span className="block truncate font-semibold text-white">{person.username}</span>
        )}
        {(person.title || person.companyName) && (
          <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
            {[person.title, person.companyName].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

function PersonCardSimple({ person }: { person: Person }) {
  return (
    <div className="card flex h-full flex-col p-5">
      <PersonIdentity person={person} />
    </div>
  );
}

function PersonCardDetailed({
  person,
  expanded,
  onToggle,
}: {
  person: Person;
  expanded: boolean;
  onToggle: () => void;
}) {
  const tags = roleTags(person);
  const stats = roleStats(person);

  return (
    <div className="card !p-0 flex h-full flex-col overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex flex-1 flex-col gap-3 p-5 text-left transition hover:bg-white/[0.02]"
      >
        <div className="flex items-start justify-between gap-2">
          <PersonIdentity person={person} />
          {expanded ? (
            <ChevronUp size={16} className="mt-1 shrink-0 text-[var(--muted)]" />
          ) : (
            <ChevronDown size={16} className="mt-1 shrink-0 text-[var(--muted)]" />
          )}
        </div>

        {tags ? (
          <p className="text-xs font-medium uppercase tracking-[0.4px] text-[var(--cyan)]">{tags}</p>
        ) : (
          <p className="text-xs text-[var(--muted)]">Member</p>
        )}
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] px-5 py-4">
          {stats.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No event roles yet.</p>
          ) : (
            <div className="space-y-4">
              {stats.map((stat) => (
                <div key={stat.key}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                      {stat.label}
                    </h4>
                    <span className="text-xs text-[var(--cyan)]">{stat.count}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {stat.events.map((item) => (
                      <li key={`${stat.key}-${item.slug}-${item.eventDate}`}>
                        <Link
                          to={`/events/${item.slug}`}
                          className="text-sm text-[var(--cyan2)] hover:underline"
                        >
                          {item.eventName}
                        </Link>
                        {item.eventDate && (
                          <span className="ml-2 text-xs text-[var(--muted)]">
                            {formatDateShort(item.eventDate)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PeopleList({ people }: { people: Person[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const community = [...people].sort((a, b) => a.username.localeCompare(b.username));

  if (people.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No people yet.</p>;
  }

  return (
    <div className="space-y-14">
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {community.map((person) => {
            const key = `community:${person.id}`;
            return (
              <PersonCardDetailed
                key={key}
                person={person}
                expanded={expanded === key}
                onToggle={() => setExpanded(expanded === key ? null : key)}
              />
            );
          })}
        </div>
      </section>

      {SECTIONS.map((section) => {
        const inRole = people
          .filter((p) => (p[section.key] || []).length > 0)
          .sort((a, b) => (b[section.key]?.length || 0) - (a[section.key]?.length || 0));

        if (inRole.length === 0) return null;

        return (
          <section key={section.key}>
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="text-xl font-bold text-white">{section.title}</h2>
              <span className="text-sm text-[var(--muted)]">
                {inRole.length} {inRole.length === 1 ? "person" : "people"}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {inRole.map((person) => (
                <PersonCardSimple key={`${section.key}:${person.id}`} person={person} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
