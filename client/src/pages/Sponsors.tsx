import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SponsorDisplay } from "@/components/SponsorDisplay";
import { loadData } from "@/lib/api";
import { PARTNER_TYPE_LABELS } from "@/lib/utils";

interface PublicCompany {
  id: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
}

interface PartnerSection {
  partnerType: string;
  companies: PublicCompany[];
}

interface SponsorsPayload {
  sponsors: PublicCompany[];
  partners?: PartnerSection[];
  venuePartners?: PublicCompany[];
  communityPartners?: PublicCompany[];
}

function CompanyGrid({ items }: { items: PublicCompany[] }) {
  if (!items.length) return <p className="text-sm text-[var(--muted)]">None yet.</p>;
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => (
        <div key={c.id} className="card flex min-h-[260px] flex-col">
          <SponsorDisplay name={c.name} website={c.website} logo={c.logoUrl} className="flex-1" />
        </div>
      ))}
    </div>
  );
}

function partnerSectionTitle(type: string): string {
  const titles: Record<string, string> = {
    venue: "Venue Partners",
    ventures: "Ventures Partners",
    community: "Community Partners",
    media: "Media Partners",
    food: "Food Partners",
    other: "Other Partners",
    custom: "Custom Partners",
  };
  return titles[type] || `${(PARTNER_TYPE_LABELS[type] || type).replace(/_/g, " ")} Partners`;
}

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<PublicCompany[]>([]);
  const [partners, setPartners] = useState<PartnerSection[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData<SponsorsPayload>("/data/sponsors.json")
      .then((raw) => {
        setSponsors(raw.sponsors || []);
        if (Array.isArray(raw.partners) && raw.partners.length) {
          setPartners(raw.partners.filter((p) => (p.companies || []).length > 0));
        } else {
          // Legacy shape
          const legacy: PartnerSection[] = [];
          if (raw.venuePartners?.length) {
            legacy.push({ partnerType: "venue", companies: raw.venuePartners });
          }
          if (raw.communityPartners?.length) {
            legacy.push({ partnerType: "community", companies: raw.communityPartners });
          }
          setPartners(legacy);
        }
        setError("");
      })
      .catch(() => {
        setError("Could not load sponsors. Please try again shortly.");
      })
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="mx-auto w-[90%] max-w-6xl pb-20 pt-[130px]">
      <div className="eyebrow">Our partners</div>
      <h1 className="section-title">Sponsors &amp; Partners</h1>
      <p className="section-subtitle">
        Organizations that have sponsored and partnered on live Crewbase Collective events.
      </p>

      {!loaded ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--cyan)]" />
        </div>
      ) : error ? (
        <p className="mt-12 text-[var(--muted)]">{error}</p>
      ) : (
        <div className="mt-12 space-y-14">
          <section>
            <h2 className="text-xl font-bold text-white">Sponsors</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Companies that have sponsored our published events.
            </p>
            <CompanyGrid items={sponsors} />
          </section>
          {partners.map((section) => (
            <section key={section.partnerType}>
              <h2 className="text-xl font-bold text-white">
                {partnerSectionTitle(section.partnerType)}
              </h2>
              <CompanyGrid items={section.companies || []} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
