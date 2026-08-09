import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { EventMultiSelect } from "./EventMultiSelect";
import { loadData } from "@/lib/api";
import {
  Handshake,
  Mic,
  Building2,
  Users,
  HeartHandshake,
  CheckCircle,
  Loader2,
  Mail,
} from "lucide-react";

interface EventOption {
  id: string;
  name: string;
  type: string;
  eventDate: string;
}

type FormType =
  | "sponsorship"
  | "judging_speaking"
  | "partnership"
  | "member_host"
  | "volunteer"
  | "contact_us";

const iconWrap =
  "mb-7 grid h-[46px] w-[46px] place-items-center rounded-full border border-[rgba(9,247,223,0.3)] text-[var(--cyan)] bg-[rgba(9,247,223,0.08)]";

const cards = [
  {
    type: "sponsorship" as FormType,
    title: "Request for Sponsorship",
    description: "Support our events with financial or in-kind sponsorship.",
    icon: Handshake,
  },
  {
    type: "judging_speaking" as FormType,
    title: "Request for Judging & Speaking",
    description: "Share your expertise as a judge or speaker at our events.",
    icon: Mic,
  },
  {
    type: "partnership" as FormType,
    title: "Request for Partnership",
    description: "Partner with us as a venue or community partner.",
    icon: Building2,
  },
  {
    type: "member_host" as FormType,
    title: "Become a Member or Host",
    description: "Join our community as a member or event host.",
    icon: Users,
  },
  {
    type: "volunteer" as FormType,
    title: "Become a Volunteer",
    description: "Help us run amazing events — registration, logistics, and more.",
    icon: HeartHandshake,
  },
  {
    type: "contact_us" as FormType,
    title: "Contact Us",
    description: "General questions, feedback, or anything else — we'd love to hear from you.",
    icon: Mail,
  },
];

export function RequestForms({ events: eventsProp = [] }: { events?: EventOption[] }) {
  const [activeForm, setActiveForm] = useState<FormType | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<EventOption[]>(eventsProp);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setEventsLoading(true);
    loadData<{ events: EventOption[] }>("/data/events-index.json")
      .then((data) => {
        if (!cancelled) setEvents(data.events?.length ? data.events : eventsProp);
      })
      .catch(() => {
        if (!cancelled) setEvents(eventsProp);
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (eventsProp.length > 0 && events.length === 0) {
      setEvents(eventsProp);
    }
  }, [eventsProp, events.length]);

  const [form, setForm] = useState<Record<string, string | string[]>>({
    eventIds: [],
  });

  const resetForm = () => {
    setForm({ eventIds: [] });
    setError("");
    setSuccess(false);
  };

  const updateField = (key: string, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeForm) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeForm, ...form }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          typeof data.error === "string" ? data.error : "Submission failed — check required fields"
        );
      }

      setSuccess(true);
      setTimeout(() => {
        setActiveForm(null);
        resetForm();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    if (success) {
      return (
        <div className="flex flex-col items-center py-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <p className="mt-3 text-lg font-semibold text-zinc-100">Request Submitted!</p>
          <p className="mt-1 text-sm text-zinc-400">We'll be in touch soon.</p>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Your Name *</label>
            <input
              className="input-field"
              required
              value={(form.name as string) || ""}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              className="input-field"
              required
              value={(form.email as string) || ""}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">LinkedIn</label>
          <input
            className="input-field"
            placeholder="https://linkedin.com/in/..."
            value={(form.linkedin as string) || ""}
            onChange={(e) => updateField("linkedin", e.target.value)}
          />
        </div>

        {activeForm === "sponsorship" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Company Name *</label>
                <input
                  className="input-field"
                  required
                  value={(form.companyName as string) || ""}
                  onChange={(e) => updateField("companyName", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Website</label>
                <input
                  className="input-field"
                  placeholder="https://..."
                  value={(form.website as string) || ""}
                  onChange={(e) => updateField("website", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Company Description</label>
              <textarea
                className="input-field"
                rows={2}
                value={(form.description as string) || ""}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Sponsorship Details</label>
              <textarea
                className="input-field"
                rows={4}
                placeholder="Total money/credits sponsorship, Prize 1, Prize 2, food & beverages, swag, etc."
                value={(form.sponsorshipDetails as string) || ""}
                onChange={(e) => updateField("sponsorshipDetails", e.target.value)}
              />
            </div>
          </>
        )}

        {activeForm === "judging_speaking" && (
          <div>
            <label className="label">Role *</label>
            <select
              className="input-field"
              required
              value={(form.judgingSpeakingRole as string) || ""}
              onChange={(e) => updateField("judgingSpeakingRole", e.target.value)}
            >
              <option value="">Select...</option>
              <option value="judging">Judging</option>
              <option value="speaking">Speaking</option>
              <option value="both">Both</option>
            </select>
          </div>
        )}

        {activeForm === "partnership" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Company / Organization</label>
                <input
                  className="input-field"
                  value={(form.companyName as string) || ""}
                  onChange={(e) => updateField("companyName", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Website</label>
                <input
                  className="input-field"
                  value={(form.website as string) || ""}
                  onChange={(e) => updateField("website", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Partnership Type *</label>
              <select
                className="input-field"
                required
                value={(form.partnershipType as string) || ""}
                onChange={(e) => updateField("partnershipType", e.target.value)}
              >
                <option value="">Select...</option>
                <option value="venue">Venue Partnership</option>
                <option value="ventures">Ventures Partner</option>
                <option value="community">Community Partner</option>
                <option value="media">Media Partner</option>
                <option value="food">Food Partner</option>
                <option value="other">Other</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {form.partnershipType === "custom" && (
              <div>
                <label className="label">Custom Type</label>
                <input
                  className="input-field"
                  value={(form.partnershipCustomType as string) || ""}
                  onChange={(e) => updateField("partnershipCustomType", e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="label">Description</label>
              <textarea
                className="input-field"
                rows={2}
                value={(form.description as string) || ""}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>
          </>
        )}

        {activeForm === "member_host" && (
          <div>
            <label className="label">Role *</label>
            <select
              className="input-field"
              required
              value={(form.memberHostRole as string) || ""}
              onChange={(e) => updateField("memberHostRole", e.target.value)}
            >
              <option value="">Select...</option>
              <option value="member">Member</option>
              <option value="host">Host</option>
            </select>
          </div>
        )}

        <div>
          <label className="label">
            {activeForm === "contact_us"
              ? "Message *"
              : activeForm === "judging_speaking"
                ? "Why do you want to participate / Why you'd be a great fit"
                : activeForm === "volunteer"
                  ? "Why do you want to volunteer / How can you help"
                  : "Comments"}
          </label>
          <textarea
            className="input-field"
            rows={3}
            required={activeForm === "contact_us"}
            value={(form.comments as string) || ""}
            onChange={(e) => updateField("comments", e.target.value)}
          />
        </div>

        {activeForm !== "contact_us" && (
          <EventMultiSelect
            events={events}
            selected={(form.eventIds as string[]) || []}
            onChange={(ids) => updateField("eventIds", ids)}
            loading={eventsLoading}
            label={
              activeForm === "volunteer" ? "Select Events to Volunteer At" : "Select Events"
            }
          />
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
            </>
          ) : (
            "Submit Request"
          )}
        </button>
      </form>
    );
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <button
            key={card.type}
            type="button"
            onClick={() => {
              resetForm();
              setActiveForm(card.type);
            }}
            className="card group min-h-[200px] text-left"
          >
            <div className={`${iconWrap} transition group-hover:scale-110`}>
              <card.icon size={22} />
            </div>
            <h3 className="mb-[11px] text-lg font-semibold text-white">{card.title}</h3>
            <p className="m-0 text-sm leading-[1.65] text-[var(--muted)]">{card.description}</p>
          </button>
        ))}
      </div>

      <Modal
        open={activeForm !== null}
        onClose={() => {
          setActiveForm(null);
          resetForm();
        }}
        title={cards.find((c) => c.type === activeForm)?.title || ""}
      >
        {renderForm()}
      </Modal>
    </>
  );
}
