import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SponsorDisplay } from "@/components/SponsorDisplay";
import { loadData } from "@/lib/api";

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  linkedin: string | null;
  information: string | null;
}

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData<{ sponsors: Sponsor[] }>("/data/sponsors.json")
      .then((data) => {
        setSponsors(data.sponsors || []);
        setError("");
      })
      .catch(() => {
        setSponsors([]);
        setError("Could not load sponsors. Please try again shortly.");
      })
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="mx-auto w-[90%] max-w-6xl pb-20 pt-[130px]">
      <div className="eyebrow">Our partners</div>
      <h1 className="section-title">Sponsors</h1>
      <p className="section-subtitle">Organizations that support our community events.</p>

      {!loaded ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--cyan)]" />
        </div>
      ) : error ? (
        <p className="mt-12 text-[var(--muted)]">{error}</p>
      ) : sponsors.length === 0 ? (
        <p className="mt-12 text-[var(--muted)]">No sponsors yet.</p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((sponsor) => (
            <div key={sponsor.id} className="card">
              <SponsorDisplay
                name={sponsor.name}
                website={sponsor.website}
                logo={sponsor.logoUrl}
                description={sponsor.information}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
