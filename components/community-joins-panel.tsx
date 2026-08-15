"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, Trash2 } from "lucide-react";

type JoinRow = {
  applicationId: string;
  name: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  joinedAt: string;
  applicationStatus: string;
  memberStatus: string | null;
  memberId: string | null;
  memberRole: string | null;
};

export function CommunityJoinsPanel({ onNotice }: { onNotice: (message: string, type?: "success" | "error") => void }) {
  const [joins, setJoins] = useState<JoinRow[]>([]);
  const [summary, setSummary] = useState<{ total: number; active: number; pending: number } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/community-joins", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setJoins(data.joins ?? []);
        setSummary(data.summary ?? null);
      }
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => { load() }, []);

  async function approve(row: JoinRow) {
    if (!confirm(`Approve ${row.name}? यसको member email Active हुन्छ र login गर्न पाउँछ।`)) return;
    const res = await fetch("/api/admin/community-joins", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: row.applicationId }),
    });
    onNotice(res.ok ? `${row.name} को account Active गरियो।` : "Approve गर्न सकिएन।", res.ok ? "success" : "error");
    await load();
  }

  async function remove(row: JoinRow) {
    if (!confirm(`Remove ${row.name}? यसको application र member record (यदि छ भने) पनि हट्नेछ।`)) return;
    const res = await fetch("/api/admin/community-joins", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: row.applicationId }),
    });
    onNotice(res.ok ? `${row.name} हटाइयो।` : "Remove गर्न सकिएन।", res.ok ? "success" : "error");
    await load();
  }

  return (
    <section className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Join our community</p>
          <h2 className="text-xl font-bold">Community joins — history</h2>
          <p className="text-sm text-muted-foreground">
            "Join our community" बाट आएका सबैको history। Approve गर्दा member को email Active हुन्छ;
            Remove गर्दा application र member दुवै हट्छ।
          </p>
        </div>
        <button type="button" onClick={load} className="rounded-xl border p-3" aria-label="Refresh joins">
          <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />
        </button>
      </div>

      {summary && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">Total: {summary.total}</span>
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">Active: {summary.active}</span>
          <span className="rounded-full bg-accent/25 px-3 py-1 text-xs font-bold text-accent-foreground">Pending: {summary.pending}</span>
        </div>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <th className="p-3">Name</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Member status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {joins.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  अहिलेसम्म कोही join गरेको छैन।
                </td>
              </tr>
            )}
            {joins.map((row) => (
              <tr key={row.applicationId} className="border-b last:border-0">
                <td className="p-3">
                  <p className="font-bold">{row.name}</p>
                  {row.message && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{row.message}</p>}
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {row.phone ?? "—"}
                  {row.email ? <><br />{row.email}</> : null}
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {row.joinedAt ? new Date(row.joinedAt).toLocaleDateString("en-GB") : "—"}
                </td>
                <td className="p-3">
                  {row.memberStatus === "active" ? (
                    <span className="rounded-full bg-primary/15 px-2 py-1 text-xs font-bold text-primary">Active</span>
                  ) : (
                    <span className="rounded-full bg-accent/25 px-2 py-1 text-xs font-bold text-accent-foreground">Pending</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    {row.memberStatus !== "active" && (
                      <button
                        type="button"
                        onClick={() => approve(row)}
                        className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
                      >
                        <CheckCircle2 className="mr-1 inline size-3.5" /> Approve / Activate
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(row)}
                      className="rounded-lg border border-destructive/40 px-3 py-2 text-xs font-bold text-destructive"
                    >
                      <Trash2 className="mr-1 inline size-3.5" /> Remove member
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
