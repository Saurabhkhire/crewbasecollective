import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Mail } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { api } from "@/lib/api";

const CONTACT_EMAIL = "hello@crewbasecollective.com";

/** Update these when official social URLs are ready. */
const socials = [
  {
    label: "Discord",
    href: "https://discord.gg/",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "X / Twitter",
    href: "https://x.com/",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.717-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Luma Calendar",
    href: "https://lu.ma/",
    icon: <Calendar className="h-4 w-4" aria-hidden />,
  },
];

const exploreLinks = [
  { href: "/", label: "Home" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/people", label: "Community" },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      await api("/api/subscribe", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setStatus("ok");
      setMessage("Thanks — you're on the list.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not subscribe");
    }
  };

  return (
    <footer className="relative mt-8 border-t border-[var(--border)] bg-[#02070d] text-white">
      {/* Broad newsletter band */}
      <section className="border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(8,24,39,0.95),rgba(2,7,13,0.98))]">
        <div className="mx-auto w-[90%] max-w-6xl py-14 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[13px] font-semibold uppercase tracking-[0.7px] text-[var(--cyan)]">
              Newsletter
            </p>
            <h2 className="mt-3 text-[clamp(28px,4vw,42px)] font-bold leading-tight tracking-[-0.5px] text-white">
              Stay in the loop
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-[var(--muted)]">
              Get updates on upcoming hackathons, workshops, and community events across the Bay
              Area.
            </p>
            <form
              onSubmit={handleSubscribe}
              className="mx-auto mt-8 flex w-full max-w-xl flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="input-field flex-1 py-3.5 text-base"
              />
              <button
                type="submit"
                className="btn-primary shrink-0 px-8 py-3.5"
                disabled={status === "loading"}
              >
                {status === "loading" ? "…" : "Subscribe"}
              </button>
            </form>
            {message && (
              <p
                className={`mt-3 text-sm ${status === "ok" ? "text-emerald-400" : "text-red-400"}`}
              >
                {message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Brand + explore */}
      <div className="mx-auto w-[90%] max-w-6xl py-14 md:py-16">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)] md:gap-16 lg:gap-24">
          <div>
            <Link to="/" className="inline-flex items-center gap-3" aria-label="Crewbase Collective home">
              <BrandLogo variant="mark" className="!h-12 sm:!h-14" />
              <span className="leading-none">
                <span className="block text-[22px] font-extrabold tracking-[0.8px] text-white">
                  CREW BASE
                </span>
                <span className="mt-1.5 block text-[11px] font-semibold tracking-[5px] text-[var(--cyan)]">
                  COLLECTIVE
                </span>
              </span>
            </Link>

            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-[var(--muted)]">
              Building communities through hackathons, workshops, and events that bring builders,
              founders, and innovators together in the Bay Area and beyond.
            </p>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-5 inline-flex items-center gap-2 text-[15px] text-[var(--cyan)] transition hover:brightness-110"
            >
              <Mail size={16} />
              {CONTACT_EMAIL}
            </a>

            <div className="mt-8 flex flex-wrap gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0c1520] px-4 py-2.5 text-sm text-[#d8e1e8] transition hover:border-[rgba(9,247,223,0.35)] hover:text-[var(--cyan)]"
                >
                  {s.icon}
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.7px] text-[var(--cyan)]">
              Explore
            </h3>
            <ul className="mt-5 space-y-3.5">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-[15px] text-[#d8e1e8] transition hover:text-[var(--cyan)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-white/5 pt-6 text-center text-sm text-[var(--muted)]">
          &copy; {new Date().getFullYear()} Crewbase Collective. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
