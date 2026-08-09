import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { type PersonSubRole } from "@/lib/roles";

interface EmailTemplateDraft {
  subject: string;
  body: string;
  certificateText?: string;
}

interface SiteSettings {
  subRoles: PersonSubRole[];
  communityLinks: {
    whatsapp: string;
    discord: string;
    x: string;
    lumaCalendar: string;
  };
  smtp: {
    host: string;
    port: string;
    user: string;
    pass: string;
    from: string;
    notifyEmail: string;
  };
  smtpPasswordSet?: boolean;
  emailTemplates: {
    sponsorshipRequest: EmailTemplateDraft;
    speakerInvite: EmailTemplateDraft;
    judgeInvite: EmailTemplateDraft;
    judgeSpeakerInvite: EmailTemplateDraft;
    judgeCertification: EmailTemplateDraft;
    speakerCertification: EmailTemplateDraft;
    judgeSpeakerCertification: EmailTemplateDraft;
  };
  emailPlaceholders?: { key: string; label: string }[];
  hasPitchDeck?: boolean;
}

const emptyDraft = (): EmailTemplateDraft => ({
  subject: "",
  body: "",
  certificateText: "",
});

const CERT_TEMPLATE_KEYS = new Set<keyof SiteSettings["emailTemplates"]>([
  "judgeCertification",
  "speakerCertification",
  "judgeSpeakerCertification",
]);

const TEMPLATE_META: {
  key: keyof SiteSettings["emailTemplates"];
  title: string;
  hint: string;
}[] = [
  {
    key: "sponsorshipRequest",
    title: "Sponsorship request",
    hint: "Initial outreach email. Pitch deck PDF is attached automatically when sending.",
  },
  {
    key: "speakerInvite",
    title: "Speaker invite",
    hint: "Invitation to speak. Placeholders are filled from the selected event when you send. Logo appears at the bottom of the email.",
  },
  {
    key: "judgeInvite",
    title: "Judge invite",
    hint: "Invitation to judge. Logo appears at the bottom of the email.",
  },
  {
    key: "judgeSpeakerInvite",
    title: "Judge & speaker invite",
    hint: "Combined invite to judge and speak. Logo appears at the bottom of the email.",
  },
  {
    key: "judgeCertification",
    title: "Judge certification",
    hint: "Email body + certificate text (PDF). Logo on email and PDF.",
  },
  {
    key: "speakerCertification",
    title: "Speaker certification",
    hint: "Email body + certificate text (PDF). Logo on email and PDF.",
  },
  {
    key: "judgeSpeakerCertification",
    title: "Judge & speaker certification",
    hint: "Email body + certificate text (PDF). Logo on email and PDF.",
  },
];

function TemplateEditor({
  title,
  hint,
  draft,
  onChange,
  placeholders,
  showCertificateText,
}: {
  title: string;
  hint: string;
  draft: EmailTemplateDraft;
  onChange: (next: EmailTemplateDraft) => void;
  placeholders: { key: string; label: string }[];
  showCertificateText: boolean;
}) {
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const certRef = useRef<HTMLTextAreaElement>(null);
  const [target, setTarget] = useState<"subject" | "body" | "certificate">("body");

  const insertPlaceholder = (key: string) => {
    const token = `{{${key}}}`;
    if (target === "subject") {
      const el = subjectRef.current;
      const start = el?.selectionStart ?? draft.subject.length;
      const end = el?.selectionEnd ?? start;
      const next = draft.subject.slice(0, start) + token + draft.subject.slice(end);
      onChange({ ...draft, subject: next });
      requestAnimationFrame(() => {
        el?.focus();
        const pos = start + token.length;
        el?.setSelectionRange(pos, pos);
      });
    } else if (target === "certificate") {
      const el = certRef.current;
      const current = draft.certificateText || "";
      const start = el?.selectionStart ?? current.length;
      const end = el?.selectionEnd ?? start;
      const next = current.slice(0, start) + token + current.slice(end);
      onChange({ ...draft, certificateText: next });
      requestAnimationFrame(() => {
        el?.focus();
        const pos = start + token.length;
        el?.setSelectionRange(pos, pos);
      });
    } else {
      const el = bodyRef.current;
      const start = el?.selectionStart ?? draft.body.length;
      const end = el?.selectionEnd ?? start;
      const next = draft.body.slice(0, start) + token + draft.body.slice(end);
      onChange({ ...draft, body: next });
      requestAnimationFrame(() => {
        el?.focus();
        const pos = start + token.length;
        el?.setSelectionRange(pos, pos);
      });
    }
  };

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="font-semibold text-zinc-100">{title}</h2>
        <p className="mt-1 text-sm text-zinc-400">{hint}</p>
      </div>
      <div>
        <label className="label">Subject</label>
        <input
          ref={subjectRef}
          className="input-field"
          value={draft.subject}
          onFocus={() => setTarget("subject")}
          onChange={(e) => onChange({ ...draft, subject: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Email body</label>
        <textarea
          ref={bodyRef}
          className="input-field font-mono text-sm"
          rows={showCertificateText ? 8 : 12}
          value={draft.body}
          onFocus={() => setTarget("body")}
          onChange={(e) => onChange({ ...draft, body: e.target.value })}
        />
      </div>
      {showCertificateText && (
        <div>
          <label className="label">Certificate text (PDF)</label>
          <p className="mb-2 text-xs text-zinc-500">
            This text is converted to the attached certificate PDF (placeholders supported).
          </p>
          <textarea
            ref={certRef}
            className="input-field font-mono text-sm"
            rows={10}
            value={draft.certificateText || ""}
            onFocus={() => setTarget("certificate")}
            onChange={(e) => onChange({ ...draft, certificateText: e.target.value })}
          />
        </div>
      )}
      <div>
        <p className="label">
          Insert placeholder into{" "}
          {target === "certificate" ? "certificate text" : target === "subject" ? "subject" : "body"}
        </p>
        <div className="flex flex-wrap gap-2">
          {placeholders.map((p) => (
            <button
              key={p.key}
              type="button"
              className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:border-brand-500 hover:text-brand-300"
              onClick={() => insertPlaceholder(p.key)}
              title={`{{${p.key}}}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const [subRoles, setSubRoles] = useState<PersonSubRole[]>([]);
  const [communityLinks, setCommunityLinks] = useState({
    whatsapp: "",
    discord: "",
    x: "",
    lumaCalendar: "",
  });
  const [smtp, setSmtp] = useState({
    host: "",
    port: "587",
    user: "",
    pass: "",
    from: "",
    notifyEmail: "",
  });
  const [smtpPasswordSet, setSmtpPasswordSet] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<SiteSettings["emailTemplates"]>({
    sponsorshipRequest: emptyDraft(),
    speakerInvite: emptyDraft(),
    judgeInvite: emptyDraft(),
    judgeSpeakerInvite: emptyDraft(),
    judgeCertification: emptyDraft(),
    speakerCertification: emptyDraft(),
    judgeSpeakerCertification: emptyDraft(),
  });
  const [placeholders, setPlaceholders] = useState<{ key: string; label: string }[]>([]);
  const [hasPitchDeck, setHasPitchDeck] = useState(false);
  const [newSubRole, setNewSubRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDeck, setUploadingDeck] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openTemplate, setOpenTemplate] = useState<keyof SiteSettings["emailTemplates"] | null>(
    "speakerInvite"
  );

  useEffect(() => {
    api<SiteSettings>("/api/admin/settings")
      .then((settings) => {
        setSubRoles(Array.isArray(settings.subRoles) ? settings.subRoles : []);
        setCommunityLinks({
          whatsapp: settings.communityLinks?.whatsapp || "",
          discord: settings.communityLinks?.discord || "",
          x: settings.communityLinks?.x || "",
          lumaCalendar: settings.communityLinks?.lumaCalendar || "",
        });
        setSmtp({
          host: settings.smtp?.host || "",
          port: settings.smtp?.port || "587",
          user: settings.smtp?.user || "",
          pass: "",
          from: settings.smtp?.from || "",
          notifyEmail: settings.smtp?.notifyEmail || "",
        });
        setSmtpPasswordSet(Boolean(settings.smtpPasswordSet));
        if (settings.emailTemplates) {
          setEmailTemplates({
            sponsorshipRequest: {
              ...emptyDraft(),
              ...settings.emailTemplates.sponsorshipRequest,
            },
            speakerInvite: { ...emptyDraft(), ...settings.emailTemplates.speakerInvite },
            judgeInvite: { ...emptyDraft(), ...settings.emailTemplates.judgeInvite },
            judgeSpeakerInvite: {
              ...emptyDraft(),
              ...settings.emailTemplates.judgeSpeakerInvite,
            },
            judgeCertification: {
              ...emptyDraft(),
              ...settings.emailTemplates.judgeCertification,
            },
            speakerCertification: {
              ...emptyDraft(),
              ...settings.emailTemplates.speakerCertification,
            },
            judgeSpeakerCertification: {
              ...emptyDraft(),
              ...settings.emailTemplates.judgeSpeakerCertification,
            },
          });
        }
        setPlaceholders(settings.emailPlaceholders || []);
        setHasPitchDeck(Boolean(settings.hasPitchDeck));
        setError("");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load settings");
      })
      .finally(() => setLoading(false));
  }, []);

  const addSubRole = () => {
    const key = newSubRole.trim();
    if (!key || subRoles.some((s) => s.key.toLowerCase() === key.toLowerCase())) return;
    setSubRoles((prev) =>
      [...prev, { key, visible: false }].sort((a, b) => a.key.localeCompare(b.key))
    );
    setNewSubRole("");
  };

  const removeSubRole = (key: string) => {
    setSubRoles((prev) => prev.filter((s) => s.key !== key));
  };

  const toggleVisible = (key: string) => {
    setSubRoles((prev) =>
      prev.map((s) => (s.key === key ? { ...s, visible: !s.visible } : s))
    );
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await api<SiteSettings>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ subRoles, communityLinks, emailTemplates, smtp }),
      });
      setSubRoles(updated.subRoles || subRoles);
      setCommunityLinks({
        whatsapp: updated.communityLinks?.whatsapp || "",
        discord: updated.communityLinks?.discord || "",
        x: updated.communityLinks?.x || "",
        lumaCalendar: updated.communityLinks?.lumaCalendar || "",
      });
      if (updated.emailTemplates) setEmailTemplates(updated.emailTemplates);
      setSmtp({
        host: updated.smtp?.host || "",
        port: updated.smtp?.port || "587",
        user: updated.smtp?.user || "",
        pass: "",
        from: updated.smtp?.from || "",
        notifyEmail: updated.smtp?.notifyEmail || "",
      });
      setSmtpPasswordSet(Boolean(updated.smtpPasswordSet));
      setHasPitchDeck(Boolean(updated.hasPitchDeck));
      setSuccess("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const uploadPitchDeck = async (file: File | null) => {
    if (!file) return;
    setUploadingDeck(true);
    setError("");
    setSuccess("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/settings/pitch-deck", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Upload failed");
      setHasPitchDeck(true);
      setSuccess("Pitch deck PDF uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload pitch deck");
    } finally {
      setUploadingDeck(false);
    }
  };

  if (loading) {
    return <p className="text-zinc-500">Loading settings...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Sub-roles, community links, and outbound email drafts.
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-4 rounded-lg border border-emerald-900/60 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
          {success}
        </p>
      )}

      <div className="card mt-6 space-y-4">
        <h2 className="font-semibold text-zinc-100">Sub-roles</h2>
        <p className="text-sm text-zinc-400">
          Sub-roles like MC, photographer, or venue finder can be assigned on events and people.
          Check <strong>Visible on site</strong> for sub-roles that should appear on the public
          event page when confirmed.
        </p>
        <ul className="space-y-2">
          {subRoles.map((sub) => (
            <li
              key={sub.key}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 px-3 py-2"
            >
              <span className="text-sm text-zinc-200">{sub.key}</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-zinc-400">
                  <input
                    type="checkbox"
                    checked={sub.visible}
                    onChange={() => toggleVisible(sub.key)}
                  />
                  Visible on site
                </label>
                <button
                  type="button"
                  onClick={() => removeSubRole(sub.key)}
                  className="text-red-400 hover:text-red-300"
                  title="Remove sub-role"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
          {subRoles.length === 0 && (
            <li className="text-sm text-zinc-500">No sub-roles yet.</li>
          )}
        </ul>
        <div className="flex gap-2">
          <input
            className="input-field flex-1"
            placeholder="New sub-role (e.g. stage manager)..."
            value={newSubRole}
            onChange={(e) => setNewSubRole(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSubRole();
              }
            }}
          />
          <button type="button" className="btn-secondary" onClick={addSubRole}>
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="card mt-6 space-y-4">
        <h2 className="font-semibold text-zinc-100">Community links</h2>
        <div>
          <label className="label">WhatsApp</label>
          <input
            className="input-field"
            placeholder="https://chat.whatsapp.com/..."
            value={communityLinks.whatsapp}
            onChange={(e) =>
              setCommunityLinks({ ...communityLinks, whatsapp: e.target.value })
            }
          />
        </div>
        <div>
          <label className="label">Discord</label>
          <input
            className="input-field"
            placeholder="https://discord.gg/..."
            value={communityLinks.discord}
            onChange={(e) =>
              setCommunityLinks({ ...communityLinks, discord: e.target.value })
            }
          />
        </div>
        <div>
          <label className="label">X (Twitter)</label>
          <input
            className="input-field"
            placeholder="https://x.com/..."
            value={communityLinks.x}
            onChange={(e) => setCommunityLinks({ ...communityLinks, x: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Luma calendar</label>
          <input
            className="input-field"
            placeholder="https://luma.com/calendar/..."
            value={communityLinks.lumaCalendar}
            onChange={(e) =>
              setCommunityLinks({ ...communityLinks, lumaCalendar: e.target.value })
            }
          />
        </div>
      </div>

      <div className="card mt-6 space-y-4">
        <h2 className="font-semibold text-zinc-100">Email SMTP</h2>
        <p className="text-sm text-zinc-400">
          Used for People → Send email and request-form notifications. Leave password blank when
          saving to keep the current password
          {smtpPasswordSet ? " (already set)." : "."} Env vars still work as fallback.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">SMTP host</label>
            <input
              className="input-field"
              placeholder="smtp.gmail.com"
              value={smtp.host}
              onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Port</label>
            <input
              className="input-field"
              placeholder="587"
              value={smtp.port}
              onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Username</label>
            <input
              className="input-field"
              placeholder="you@email.com"
              value={smtp.user}
              onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
              autoComplete="off"
            />
          </div>
          <div>
            <label className="label">Password / app password</label>
            <input
              type="password"
              className="input-field"
              placeholder={smtpPasswordSet ? "•••••••• (leave blank to keep)" : "App password"}
              value={smtp.pass}
              onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
              autoComplete="new-password"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">From</label>
            <input
              className="input-field"
              placeholder="Crewbase Collective <noreply@crewbasecollective.com>"
              value={smtp.from}
              onChange={(e) => setSmtp({ ...smtp, from: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notify email (request forms)</label>
            <input
              type="email"
              className="input-field"
              placeholder="hello@crewbasecollective.com"
              value={smtp.notifyEmail}
              onChange={(e) => setSmtp({ ...smtp, notifyEmail: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-zinc-100">Email drafts</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Edit drafts used from People → Send email. Click a type to expand. Insert placeholders
          with the chips; they are replaced from the selected event when sending.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {TEMPLATE_META.map((t) => (
            <button
              key={t.key}
              type="button"
              className={
                openTemplate === t.key
                  ? "btn-primary !py-1.5 text-sm"
                  : "btn-secondary !py-1.5 text-sm"
              }
              onClick={() => setOpenTemplate(openTemplate === t.key ? null : t.key)}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {TEMPLATE_META.filter((t) => t.key === openTemplate).map((t) => (
        <div key={t.key} className="mt-4">
          <TemplateEditor
            title={t.title}
            hint={t.hint}
            draft={emailTemplates[t.key]}
            placeholders={placeholders}
            showCertificateText={CERT_TEMPLATE_KEYS.has(t.key)}
            onChange={(next) =>
              setEmailTemplates((prev) => ({
                ...prev,
                [t.key]: next,
              }))
            }
          />
        </div>
      ))}

      <div className="card mt-6 space-y-3">
        <h2 className="font-semibold text-zinc-100">Sponsorship pitch deck (PDF)</h2>
        <p className="text-sm text-zinc-400">
          Attached to sponsorship request emails.{" "}
          {hasPitchDeck
            ? "A custom PDF is uploaded."
            : "No upload yet — a simple fallback deck will be generated."}
        </p>
        <input
          type="file"
          accept="application/pdf,.pdf"
          disabled={uploadingDeck}
          onChange={(e) => void uploadPitchDeck(e.target.files?.[0] || null)}
          className="block text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-zinc-200"
        />
      </div>

      <button
        type="button"
        className="btn-primary mt-6"
        onClick={() => void save()}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save settings"}
      </button>
    </div>
  );
}
