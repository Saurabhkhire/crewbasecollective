import { formatDateShort } from "@/lib/utils";

interface EventOption {
  id: string;
  name: string;
  type: string;
  eventDate: string;
}

interface EventMultiSelectProps {
  events: EventOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  loading?: boolean;
}

export function EventMultiSelect({
  events,
  selected,
  onChange,
  label = "Select Events",
  loading = false,
}: EventMultiSelectProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div>
      <label className="label">{label}</label>
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-zinc-700 p-2">
        {loading ? (
          <p className="px-2 py-1 text-sm text-zinc-500">Loading events…</p>
        ) : events.length === 0 ? (
          <p className="px-2 py-1 text-sm text-zinc-500">
            No published events available yet.
          </p>
        ) : (
          events.map((event) => (
            <label
              key={event.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-900"
            >
              <input
                type="checkbox"
                checked={selected.includes(event.id)}
                onChange={() => toggle(event.id)}
                className="rounded border-zinc-700 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-zinc-300">
                {event.name}{" "}
                <span className="text-zinc-500">
                  ({formatDateShort(event.eventDate)})
                </span>
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
