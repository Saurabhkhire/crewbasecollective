import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
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
    provider?: "gmail" | "brevo";
    host: string;
    port: string;
    user: string;
    pass: string;
    from: string;
    notifyEmail: string;
    gmail?: { user: string; pass: string };
    brevo?: { user: string; pass: string };
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

const SMTP_PRESETS = {
  gmail: {
    host: "smtp.gmail.com",
    port: "587",
    label: "Gmail",
    env: "SMTP_PROVIDER=gmail",
    hint: "Google App Password (not your normal Gmail password). Google Account → Security → 2-Step Verification → App passwords. Maps to GMAIL_SMTP_USER / GMAIL_SMTP_PASS.",
  },
  brevo: {
    host: "smtp-relay.brevo.com",
    port: "587",
    label: "Brevo",
    env: "SMTP_PROVIDER=brevo",
    hint: "Brevo → SMTP & API → SMTP. Use the SMTP login + SMTP key (not the REST API key). Verify the From address as a sender. Maps to BREVO_SMTP_USER / BREVO_SMTP_KEY.",
  },
} as const;

type SmtpProvider = keyof typeof SMTP_PRESETS;

function parseProvider(value?: string, host?: string): SmtpProvider {
  if (value === "gmail" || value === "brevo") return value;
  const h = (host || "").toLowerCase();
  if (h.includes("brevo") || h.includes("sendinblue")) return "brevo";
  return "gmail";
}

function smtpFromSettings(smtp: SiteSettings["smtp"] | undefined) {
  const provider = parseProvider(smtp?.provider, smtp?.host);
  return {
    provider,
    from: smtp?.from || "",
    notifyEmail: smtp?.notifyEmail || "",
    gmail: {
      user: smtp?.gmail?.user || (provider === "gmail" ? smtp?.user || "" : ""),
      pass: smtp?.gmail?.pass || (provider === "gmail" ? smtp?.pass || "" : ""),
    },
    brevo: {
      user: smtp?.brevo?.user || (provider === "brevo" ? smtp?.user || "" : ""),
      pass: smtp?.brevo?.pass || (provider === "brevo" ? smtp?.pass || "" : ""),
    },
  };
}

function SecretField({
  label,
  value,
  onChange,
  placeholder,
  show,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          className="input-field pr-10"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-zinc-200"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
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
  const [smtp, setSmtp] = useState(smtpFromSettings(undefined));
  const [showGmailPass, setShowGmailPass] = useState(false);
  const [showBrevoPass, setShowBrevoPass] = useState(false);
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
        setSmtp(smtpFromSettings(settings.smtp));
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
      setSmtp(smtpFromSettings(updated.smtp));
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
          Configure Gmail and Brevo, then choose which one sends People emails and
          request-form notifications. These fields match{" "}
          <code className="text-zinc-300">server/.env</code> (
          <code className="text-zinc-300">SMTP_PROVIDER</code>,{" "}
          <code className="text-zinc-300">GMAIL_SMTP_*</code>,{" "}
          <code className="text-zinc-300">BREVO_SMTP_*</code>,{" "}
          <code className="text-zinc-300">SMTP_FROM</code>,{" "}
          <code className="text-zinc-300">NOTIFY_EMAIL</code>
          ). Empty Settings fields fall back to env.
        </p>
        <div>
          <p className="label">Send with (SMTP_PROVIDER)</p>
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            {(Object.keys(SMTP_PRESETS) as SmtpProvider[]).map((key) => {
              const preset = SMTP_PRESETS[key];
              const selected = smtp.provider === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    selected
                      ? "border-brand-500 bg-brand-950/50 ring-1 ring-brand-500"
                      : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-600"
                  }`}
                  onClick={() => setSmtp({ ...smtp, provider: key })}
                >
                  <span className="block font-medium text-zinc-100">{preset.label}</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    {preset.env} · {preset.host}:{preset.port}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-zinc-500">{SMTP_PRESETS[smtp.provider].hint}</p>
        </div>

        <div className="space-y-3 rounded-xl border border-zinc-800 p-4">
          <h3 className="text-sm font-medium text-zinc-200">Gmail (GMAIL_SMTP_USER / GMAIL_SMTP_PASS)</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Gmail address</label>
              <input
                className="input-field"
                placeholder="you@gmail.com"
                value={smtp.gmail.user}
                onChange={(e) =>
                  setSmtp({ ...smtp, gmail: { ...smtp.gmail, user: e.target.value } })
                }
                autoComplete="off"
              />
            </div>
            <SecretField
              label="App password"
              placeholder="Google App Password"
              value={smtp.gmail.pass}
              onChange={(pass) => setSmtp({ ...smtp, gmail: { ...smtp.gmail, pass } })}
              show={showGmailPass}
              onToggle={() => setShowGmailPass((v) => !v)}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-zinc-800 p-4">
          <h3 className="text-sm font-medium text-zinc-200">Brevo (BREVO_SMTP_USER / BREVO_SMTP_KEY)</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">SMTP login</label>
              <input
                className="input-field"
                placeholder="SMTP login from Brevo"
                value={smtp.brevo.user}
                onChange={(e) =>
                  setSmtp({ ...smtp, brevo: { ...smtp.brevo, user: e.target.value } })
                }
                autoComplete="off"
              />
            </div>
            <SecretField
              label="SMTP key"
              placeholder="Brevo SMTP key"
              value={smtp.brevo.pass}
              onChange={(pass) => setSmtp({ ...smtp, brevo: { ...smtp.brevo, pass } })}
              show={showBrevoPass}
              onToggle={() => setShowBrevoPass((v) => !v)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">From (SMTP_FROM)</label>
            <input
              className="input-field"
              placeholder="Crewbase Collective &lt;events@yourdomain.com&gt;"
              value={smtp.from}
              onChange={(e) => setSmtp({ ...smtp, from: e.target.value })}
            />
            <p className="mt-1 text-xs text-zinc-500">
              Gmail rewrites this to match the Gmail mailbox. Brevo sends as this address — verify
              it as a sender in Brevo.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notify email (NOTIFY_EMAIL)</label>
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
