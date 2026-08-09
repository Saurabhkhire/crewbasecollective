import { useEffect, useState } from "react";
import { Calendar, Loader2, MessageCircle } from "lucide-react";
import { RequestForms } from "@/components/RequestForms";
import { loadData } from "@/lib/api";

type CommunityLinks = {
  whatsapp: string;
  discord: string;
  x: string;
  lumaCalendar: string;
};

const defaults: CommunityLinks = {
  whatsapp: "",
  discord: "https://discord.gg/3ptzZKgjud",
  x: "",
  lumaCalendar: "https://luma.com/calendar/cal-3A00RBKfF0vkoAd",
};

export default function GetInvolvedPage() {
  const [links, setLinks] = useState<CommunityLinks>(defaults);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadData<CommunityLinks>("/data/community-links.json")
      .then((data) => setLinks({ ...defaults, ...data }))
      .catch(() => setLinks(defaults))
      .finally(() => setLoaded(true));
  }, []);

  const joinCards = [
    {
      key: "whatsapp",
      title: "WhatsApp",
      blurb: "Join the community chat for quick updates and hangouts.",
      href: links.whatsapp,
      icon: <MessageCircle className="h-6 w-6" />,
    },
    {
      key: "discord",
      title: "Discord",
      blurb: "Hang out with builders, founders, and organizers.",
      href: links.discord,
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      ),
    },
    {
      key: "x",
      title: "X",
      blurb: "Follow updates and event highlights on X.",
      href: links.x,
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.717-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      key: "luma",
      title: "Luma Calendar",
      blurb: "See upcoming events and RSVP on our calendar.",
      href: links.lumaCalendar,
      icon: <Calendar className="h-6 w-6" />,
    },
  ];

  return (
    <div className="mx-auto w-[90%] max-w-6xl pb-20 pt-[130px]">
      <div className="eyebrow">Crewbase Collective</div>
      <h1 className="section-title">Get involved</h1>
      <p className="section-subtitle">
        Learn who we are, join the community, or reach out to work with us.
      </p>

      <section className="mt-14">
        <h2 className="text-xl font-bold text-white">About us</h2>
        <div className="mt-4 max-w-3xl space-y-4 text-[15px] leading-relaxed text-[var(--muted)]">
          <p>
            Crewbase Collective is a Bay Area community for builders, founders, and operators who
            learn by shipping — together. We run hackathons, pitch competitions, workshops, demos,
            and mixers that turn strangers into teammates and ideas into products.
          </p>
          <p>
            Our events are designed for people who want to meet collaborators, get feedback in the
            room, and stay connected after the night ends. Sponsors and partners help make that
            possible; judges, speakers, hosts, and volunteers keep the energy high.
          </p>
          <p>
            Whether you are showing up for your first hackathon or helping us run the next one, you
            are part of the same collective: build, meet, and grow together.
          </p>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-xl font-bold text-white">Join us</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Connect on WhatsApp, Discord, X, and our Luma calendar.
        </p>
        {!loaded ? (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--cyan)]" />
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {joinCards.map((card) =>
              card.href ? (
                <a
                  key={card.key}
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card block transition hover:border-[rgba(9,247,223,0.35)]"
                >
                  <div className="text-[var(--cyan)]">{card.icon}</div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">{card.blurb}</p>
                  <span className="mt-4 inline-block text-sm font-medium text-[var(--cyan)]">
                    Open →
                  </span>
                </a>
              ) : (
                <div key={card.key} className="card opacity-60">
                  <div className="text-[var(--muted)]">{card.icon}</div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">Link coming soon.</p>
                </div>
              )
            )}
          </div>
        )}
      </section>

      <section className="mt-16">
        <h2 className="text-xl font-bold text-white">Work with us</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Sponsorship, partnership, judging, hosting, volunteering, and general contact.
        </p>
        <div className="mt-8">
          <RequestForms />
        </div>
      </section>
    </div>
  );
}
