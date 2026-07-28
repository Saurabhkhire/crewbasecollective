import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export interface LocationValue {
  location: string;
  locationLat: string;
  locationLng: string;
}

interface PlaceResult {
  label: string;
  lat: string;
  lng: string;
  type: string | null;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  className?: string;
}

export default function LocationPicker({
  value,
  onChange,
  className = "",
}: LocationPickerProps) {
  const [query, setQuery] = useState(value.location || "");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const skipSearch = useRef(false);

  useEffect(() => {
    setQuery(value.location || "");
  }, [value.location]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => {
      api<PlaceResult[]>(`/api/places/search?q=${encodeURIComponent(q)}`)
        .then((rows) => {
          setResults(rows);
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const pick = (place: PlaceResult) => {
    skipSearch.current = true;
    setQuery(place.label);
    setResults([]);
    setOpen(false);
    onChange({
      location: place.label,
      locationLat: place.lat,
      locationLng: place.lng,
    });
  };

  const mapsPreviewUrl =
    value.locationLat && value.locationLng
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${
          Number(value.locationLng) - 0.01
        }%2C${Number(value.locationLat) - 0.01}%2C${
          Number(value.locationLng) + 0.01
        }%2C${Number(value.locationLat) + 0.01}&layer=mapnik&marker=${
          value.locationLat
        }%2C${value.locationLng}`
      : null;

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          className="input-field pl-9 pr-9"
          placeholder="Search on map or type an address..."
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            onChange({
              location: next,
              locationLat: "",
              locationLng: "",
            });
            setOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-500" />
        )}
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Pick a suggestion from the map search, or keep typing your own location.
      </p>

      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
          {results.map((place) => (
            <li key={`${place.lat}-${place.lng}-${place.label}`}>
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                onClick={() => pick(place)}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" />
                <span>{place.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {mapsPreviewUrl && (
        <div className="mt-3 overflow-hidden rounded-lg border border-zinc-800">
          <iframe
            title="Location map"
            src={mapsPreviewUrl}
            className="h-44 w-full border-0"
            loading="lazy"
          />
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${value.locationLat},${value.locationLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-zinc-900 px-3 py-2 text-xs text-brand-400 hover:underline"
          >
            Open in Google Maps
          </a>
        </div>
      )}
    </div>
  );
}

export function mapsUrlForLocation(
  location: string | null | undefined,
  lat?: string | null,
  lng?: string | null
): string | null {
  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  if (location?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`;
  }
  return null;
}
