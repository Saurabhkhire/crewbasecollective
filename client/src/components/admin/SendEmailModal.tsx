import { useEffect, useMemo, useState } from "react";
import { Send, X } from "lucide-react";
import { api } from "@/lib/api";
import { isCompetitionEvent } from "@/lib/utils";

export type EmailKind =
  | "sponsorship_request"
  | "speaker_invite"
  | "judge_invite"
  | "judge_speaker_invite"
  | "judge_certification"
  | "speaker_certification"
  | "judge_speaker_certification"
  | "other";

const JUDGE_SPEAKER_KINDS = new Set<EmailKind>([
  "speaker_invite",
  "judge_invite",
  "judge_speaker_invite",
  "judge_certification",
  "speaker_certification",
  "judge_speaker_certification",
]);

const KIND_OPTIONS: { value: EmailKind; label: string; needsEvent: boolean }[] = [
  { value: "sponsorship_request", label: "Sponsorship request", needsEvent: true },
  { value: "speaker_invite", label: "Speaker invite", needsEvent: true },
  { value: "judge_invite", label: "Judge invite", needsEvent: true },
  { value: "judge_speaker_invite", label: "Judge & speaker invite", needsEvent: true },
  { value: "judge_certification", label: "Judge certification", needsEvent: true },
  { value: "speaker_certification", label: "Speaker certification", needsEvent: true },
  {
    value: "judge_speaker_certification",
    label: "Judge & speaker certification",
    needsEvent: true,
  },
  { value: "other", label: "Other", needsEvent: false },
];

const CERT_KINDS = new Set<EmailKind>([
  "judge_certification",
  "speaker_certification",
  "judge_speaker_certification",
]);

const INVITE_KINDS = new Set<EmailKind>([
  "speaker_invite",
  "judge_invite",
  "judge_speaker_invite",
]);

interface EventOption {
  id: string;
  name: string;
  eventDate: string;
  type: string;
}

interface SendEmailModalProps {
  person: { id: string; username: string; email: string | null };
  onClose: () => void;
  /** Lock the modal to a specific event (event People tab). */
  fixedEventId?: string;
  fixedEventType?: string;
  fixedEventName?: string;
}

export function SendEmailModal({
  person,
  onClose,
  fixedEventId,
  fixedEventType,
  fixedEventName,
}: SendEmailModalProps) {
  const [kind, setKind] = useState<EmailKind | "">("");
  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventId, setEventId] = useState(fixedEventId || "");
  const [toEmail, setToEmail] = useState(person.email || "");
  const [otherSubject, setOtherSubject] = useState("");
  const [otherBody, setOtherBody] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewBody, setPreviewBody] = useState("");
  const [previewCertificate, setPreviewCertificate] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (fixedEventId) {
      setEventId(fixedEventId);
      return;
    }
    api<{ id: string; name: string; eventDate: string; type: string }[]>("/api/admin/events")
      .then((rows) =>
        setEvents(
          (Array.isArray(rows) ? rows : []).map((e) => ({
            id: e.id,
            name: e.name,
            eventDate: e.eventDate,
            type: e.type,
          }))
        )
      )
      .catch(() => setEvents([]));
  }, [fixedEventId]);

  const allowJudgeSpeaker = fixedEventId
    ? isCompetitionEvent(fixedEventType || "")
    : true;

  const kindOptions = useMemo(
    () =>
      KIND_OPTIONS.filter((opt) => {
        if (!JUDGE_SPEAKER_KINDS.has(opt.value)) return true;
        if (fixedEventId) return allowJudgeSpeaker;
        return true;
      }),
    [fixedEventId, allowJudgeSpeaker]
  );

  const selectedMeta = kindOptions.find((k) => k.value === kind);
  const kindNeedsCompetition = Boolean(kind && JUDGE_SPEAKER_KINDS.has(kind));

  const eventChoices = useMemo(() => {
    if (kindNeedsCompetition) {
      return events.filter((e) => isCompetitionEvent(e.type));
    }
    return events;
  }, [events, kindNeedsCompetition]);

  useEffect(() => {
    if (fixedEventId) return;
    if (!eventId) return;
    const selected = events.find((e) => e.id === eventId);
    if (!selected) return;
    if (kindNeedsCompetition && !isCompetitionEvent(selected.type)) {
      setEventId("");
    }
  }, [kindNeedsCompetition, eventId, events, fixedEventId]);

  useEffect(() => {
    if (!kind || kind === "other") {
      setPreviewSubject("");
      setPreviewBody("");
      setPreviewCertificate("");
      return;
    }
    if (!eventId) {
      setPreviewSubject("");
      setPreviewBody("");
      setPreviewCertificate("");
      return;
    }
    let cancelled = false;
    setLoadingPreview(true);
    api<{ subject: string; body: string; certificateText?: string }>("/api/admin/emails/preview", {
      method: "POST",
      body: JSON.stringify({ personId: person.id, kind, eventId }),
    })
      .then((data) => {
        if (!cancelled) {
          setPreviewSubject(data.subject);
          setPreviewBody(data.body);
          setPreviewCertificate(data.certificateText || "");
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Preview failed");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, eventId, person.id]);

  const send = async () => {
    if (!kind) {
      setError("Choose an email type");
      return;
    }
    if (selectedMeta?.needsEvent && !eventId) {
      setError(
        kindNeedsCompetition
          ? "Select a hackathon or pitch competition"
          : "Select an event"
      );
      return;
    }
    if (!toEmail.trim()) {
      setError("Enter a recipient email");
      return;
    }
    setSending(true);
    setError("");
    setSuccess("");
    try {
      await api("/api/admin/emails/send", {
        method: "POST",
        body: JSON.stringify({
          personId: person.id,
          kind,
          eventId: eventId || undefined,
          toEmail: toEmail.trim(),
          subject: kind === "other" ? otherSubject : undefined,
          body: kind === "other" ? otherBody : undefined,
        }),
      });
      setSuccess("Email sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Send email</h2>
            <p className="mt-1 text-sm text-zinc-400">
              To {person.username}
              {fixedEventName ? ` · ${fixedEventName}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-3 rounded-lg border border-emerald-900/60 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
            {success}
          </p>
        )}

        {!kind ? (
          <div className="mt-5 grid gap-2">
            {kindOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-left text-sm text-zinc-200 hover:border-brand-500 hover:text-brand-300"
                onClick={() => setKind(opt.value)}
              >
                {opt.label}
                {JUDGE_SPEAKER_KINDS.has(opt.value) && !fixedEventId && (
                  <span className="mt-1 block text-xs text-zinc-500">
                    Hackathons & pitch competitions only
                  </span>
                )}
              </button>
            ))}
            {fixedEventId && !allowJudgeSpeaker && (
              <p className="text-xs text-zinc-500">
                Judge and speaker emails are only available for hackathons and pitch competitions.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
                {selectedMeta?.label}
              </span>
              <button
                type="button"
                className="text-xs text-brand-400 hover:underline"
                onClick={() => {
                  setKind("");
                  setSuccess("");
                  setError("");
                }}
              >
                Change type
              </button>
            </div>

            {(selectedMeta?.needsEvent || kind === "other") && (
              <div>
                <label className="label">
                  Event{" "}
                  {selectedMeta?.needsEvent
                    ? kindNeedsCompetition
                      ? "(hackathon / pitch) *"
                      : "*"
                    : "(optional for placeholders)"}
                </label>
                {fixedEventId ? (
                  <p className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300">
                    {fixedEventName || "This event"}
                  </p>
                ) : (
                  <select
                    className="input-field"
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                  >
                    <option value="">Select event...</option>
                    {eventChoices.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} ({ev.eventDate})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div>
              <label className="label">To email *</label>
              <input
                type="email"
                className="input-field"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
              />
            </div>

            {kind === "other" ? (
              <>
                <div>
                  <label className="label">Subject *</label>
                  <input
                    className="input-field"
                    value={otherSubject}
                    onChange={(e) => setOtherSubject(e.target.value)}
                    placeholder="You can use {{person_name}}, {{event_name}}, …"
                  />
                </div>
                <div>
                  <label className="label">Body *</label>
                  <textarea
                    className="input-field font-mono text-sm"
                    rows={8}
                    value={otherBody}
                    onChange={(e) => setOtherBody(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Preview {loadingPreview ? "(loading…)" : ""}
                </p>
                {previewSubject ? (
                  <>
                    <p className="mt-2 text-sm font-medium text-zinc-200">{previewSubject}</p>
                    <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-400">
                      {previewBody}
                    </pre>
                    {previewCertificate ? (
                      <div className="mt-3 rounded border border-zinc-800 bg-zinc-950/60 p-2">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                          Certificate PDF text
                        </p>
                        <pre className="mt-1 whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-400">
                          {previewCertificate}
                        </pre>
                      </div>
                    ) : null}
                    <p className="mt-3 text-xs text-zinc-500">
                      {kind === "sponsorship_request" && "Attaches pitch deck PDF."}
                      {CERT_KINDS.has(kind) &&
                        "Attaches certificate PDF from certificate text. Logo in email footer."}
                      {INVITE_KINDS.has(kind) && "Logo in email footer. No attachment."}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-zinc-500">Select an event to preview the draft.</p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                className="btn-primary"
                disabled={sending || Boolean(success)}
                onClick={() => void send()}
              >
                <Send className="mr-1 h-4 w-4" />
                {sending ? "Sending..." : "Send"}
              </button>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
