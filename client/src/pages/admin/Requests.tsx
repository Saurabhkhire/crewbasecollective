import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface RequestRow {
  id: string;
  type: string;
  name: string;
  email: string;
  linkedin: string | null;
  comments: string | null;
  companyName: string | null;
  website: string | null;
  description: string | null;
  sponsorshipDetails: string | null;
  judgingSpeakingRole: string | null;
  partnershipType: string | null;
  memberHostRole: string | null;
  memberHostScope: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  sponsorship: "Sponsorship",
  judging_speaking: "Judging / Speaking",
  partnership: "Partnership",
  member_host: "Member / Host",
  volunteer: "Volunteer",
  contact_us: "Contact Us",
};

export default function AdminRequests() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<RequestRow[]>("/api/admin/requests")
      .then((rows) => {
        setRequests(Array.isArray(rows) ? rows : []);
        setError("");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load requests");
        setRequests([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-100">Requests</h1>
      <p className="mt-1 text-zinc-400">Form submissions from the home page.</p>

      {error && (
        <p className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-zinc-500">Loading requests...</p>}
        {!loading && requests.length === 0 && !error && (
          <p className="text-sm text-zinc-500">No requests yet.</p>
        )}
        {requests.map((req) => (
          <div key={req.id} className="card !p-0 overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === req.id ? null : req.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-zinc-900"
            >
              <div>
                <span className="rounded-full bg-brand-900/50 px-2.5 py-0.5 text-xs font-medium text-brand-300">
                  {TYPE_LABELS[req.type] || req.type}
                </span>
                <p className="mt-1 font-semibold text-zinc-100">{req.name}</p>
                <p className="text-sm text-zinc-400">{req.email}</p>
              </div>
              <span className="text-xs text-zinc-500">
                {new Date(req.createdAt).toLocaleDateString()}
              </span>
            </button>
            {expanded === req.id && (
              <div className="border-t border-zinc-800 px-5 py-4 text-sm">
                <dl className="grid gap-2 sm:grid-cols-2">
                  {req.linkedin && (
                    <div>
                      <dt className="text-zinc-500">LinkedIn</dt>
                      <dd>{req.linkedin}</dd>
                    </div>
                  )}
                  {req.companyName && (
                    <div>
                      <dt className="text-zinc-500">Company</dt>
                      <dd>{req.companyName}</dd>
                    </div>
                  )}
                  {req.website && (
                    <div>
                      <dt className="text-zinc-500">Website</dt>
                      <dd>{req.website}</dd>
                    </div>
                  )}
                  {req.description && (
                    <div>
                      <dt className="text-zinc-500">Description</dt>
                      <dd>{req.description}</dd>
                    </div>
                  )}
                  {req.sponsorshipDetails && (
                    <div className="sm:col-span-2">
                      <dt className="text-zinc-500">Sponsorship Details</dt>
                      <dd className="whitespace-pre-wrap">{req.sponsorshipDetails}</dd>
                    </div>
                  )}
                  {req.judgingSpeakingRole && (
                    <div>
                      <dt className="text-zinc-500">Role</dt>
                      <dd className="capitalize">{req.judgingSpeakingRole}</dd>
                    </div>
                  )}
                  {req.partnershipType && (
                    <div>
                      <dt className="text-zinc-500">Partnership Type</dt>
                      <dd className="capitalize">{req.partnershipType.replace(/_/g, " ")}</dd>
                    </div>
                  )}
                  {req.memberHostRole && (
                    <div>
                      <dt className="text-zinc-500">Member/Host Role</dt>
                      <dd className="capitalize">{req.memberHostRole}</dd>
                    </div>
                  )}
                  {req.memberHostScope && (
                    <div>
                      <dt className="text-zinc-500">Scope</dt>
                      <dd className="capitalize">{req.memberHostScope.replace(/_/g, " ")}</dd>
                    </div>
                  )}
                  {req.comments && (
                    <div className="sm:col-span-2">
                      <dt className="text-zinc-500">
                        {req.type === "volunteer" ? "Why Volunteer" : "Comments"}
                      </dt>
                      <dd className="whitespace-pre-wrap">{req.comments}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
