"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { AdminTools } from "./admin-tools";
import { LoanManager } from "./loan-manager";
import { MonthlyFundPanel } from "./monthly-fund-panel";
import { VisibilityControlPanel } from "./visibility-control-panel";
import { PaymentQrSettings } from "./payment-qr-settings";
import { CommitteeManagement } from "./committee-management";
import { CommunityJoinsPanel } from "./community-joins-panel";
import { AdminSecurityPanel } from "./admin-security";
import { BankManager } from "./bank-manager";
import { ChatPanel } from "./chat-panel";
import { NotificationsBell } from "./notifications-bell";
import { ConfirmDialog } from "./confirm-dialog";
import { authClient } from "@/lib/auth-client";

type Module =
  | "members"
  | "content"
  | "works"
  | "programs"
  | "expenses"
  | "donations"
  | "applications"
  | "gallery"
  | "announcements"
  | "contactMessages"
  | "clubRecords"
  | "communityJoins"
  | "security"
  | "committee"
  | "banks"
  | "messages";

const labels: Record<Module, string> = {
  members: "Members",
  content: "Website content",
  works: "Works",
  programs: "Programs",
  expenses: "Expenses",
  donations: "Donations",
  applications: "Applications",
  gallery: "Gallery",
  announcements: "Announcements",
  contactMessages: "Contact messages",
  clubRecords: "Club Records",
  communityJoins: "Community Joins",
  security: "Security",
  committee: "कार्यसमिति (Committee)",
  banks: "Banks & QR",
  messages: "Messages",
};

const fields: Record<Module, string[]> = {
  members: ["name", "role", "ward", "phone", "email", "status"],
  content: ["section", "title", "body"],
  works: ["title", "description", "location", "responsible", "status", "budget", "actualExpense", "workDate", "photoUrl"],
  programs: ["name", "description", "location", "organizedBy", "responsible", "status", "budget", "actualExpense", "programDate", "photoUrl"],
  expenses: ["title", "amount", "purpose", "spentAt", "receiptUrl"],
  donations: ["donor", "donorPhone", "donorEmail", "amount", "purpose", "method", "reference", "receiptNumber", "status", "isPublic"],
  applications: ["name", "phone", "email", "message", "status"],
  gallery: ["title", "description", "category", "imageUrl", "takenAt"],
  announcements: ["title", "body", "category", "published"],
  contactMessages: ["name", "email", "phone", "message", "status"],
  clubRecords: ["type", "title", "amount", "category", "recordDate", "notes"],
  communityJoins: [],
  security: [],
  committee: [],
  banks: [],
  messages: [],
};

// entityType used in the visibility system for each module
const visibilityType: Partial<Record<Module, string>> = {
  members: "member",
  content: "content",
  works: "work",
  programs: "program",
  expenses: "expense",
  donations: "donation",
  gallery: "gallery",
  announcements: "announcement",
  clubRecords: "club_record",
};

// entity types that trigger a warning before being made public
const sensitivePublic = new Set(["donation", "member", "expense", "loan", "note", "monthly_fund", "club_record"]);

const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

type Summary = {
  totalConfirmed: number;
  receivedBalance: number;
  allBalance: number;
  received: number;
  totalDonationRecords: number;
  expenses: number;
  balance: number;
  pendingDonationCount: number;
  pendingDonationAmount: number;
  pendingApplications: number;
  activeMembers: number;
  works: number;
  programs: number;
};

export default function AdminDashboard({ onBack }: { onBack?: () => void }) {
  const { data: session, isPending } = authClient.useSession();
  const [module, setModule] = useState<Module>("members");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<"success" | "error">("success");
  const [donationView, setDonationView] = useState<"all" | "success" | "pending">("all");
  const [memberStatusFilter, setMemberStatusFilter] = useState<"all" | "active" | "pending" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [moduleSummary, setModuleSummary] = useState<{ income: number; expense: number; balance: number } | null>(null);
  const [visibilityMap, setVisibilityMap] = useState<Record<string, string>>({});
  const [confirmState, setConfirmState] = useState<{ title: string; body: string; confirmLabel?: string; onConfirm: () => void; danger?: boolean } | null>(null);
  const [fundFocus, setFundFocus] = useState<{ month: string; paymentId: string } | null>(null);

  const flash = (message: string, type: "success" | "error" = "success") => {
    setNoticeType(type);
    setNotice(message);
  };

  async function load() {
    setLoading(true);
    let nextRows: Record<string, unknown>[] = [];
    if (module === "clubRecords") {
      const res = await fetch("/api/admin/club-records", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        nextRows = data.records ?? [];
        setModuleSummary(data.summary ?? null);
      }
    } else {
      const endpoint = module === "donations" ? "/api/admin/donations" : `/api/admin/records?kind=${module}`;
      const res = await fetch(endpoint, { cache: "no-store" });
      nextRows = res.ok ? await res.json() : [];
    }
    setRows(nextRows);
    const summaryResponse = await fetch("/api/admin/summary", { cache: "no-store" });
    if (summaryResponse.ok) setSummary(await summaryResponse.json());
    setLoading(false);
  }

  const loadVisibility = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/visibility", { cache: "no-store" });
      if (!res.ok) return
      const data = await res.json();
      const map: Record<string, string> = {};
      for (const row of data) map[`${row.entityType}:${row.recordId}`] = row.visibility;
      setVisibilityMap(map);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (session?.user) {
      load();
      loadVisibility();
    } else setLoading(false);
  }, [session?.user, module]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesSearch = JSON.stringify(r).toLowerCase().includes(query.toLowerCase());
      const status = String(r.status).toLowerCase();
      const matchesView =
        module !== "donations" ||
        donationView === "all" ||
        (donationView === "pending" && status === "pending") ||
        (donationView === "success" && status !== "pending");
      const matchesMemberStatus =
        module !== "members" ||
        memberStatusFilter === "all" ||
        status === memberStatusFilter;
      return matchesSearch && matchesView && matchesMemberStatus;
    });
  }, [rows, query, module, donationView, memberStatusFilter]);

  const pendingDonations = useMemo(
    () => rows.filter((r) => String(r.status).toLowerCase() === "pending"),
    [rows],
  );
  const pendingIncome = pendingDonations.reduce((s, r) => s + Number(r.amount || 0), 0);
  const pendingMembers = useMemo(
    () => rows.filter((r) => String(r.status).toLowerCase() !== "active"),
    [rows],
  );

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(e.currentTarget));
      for (const k of Object.keys(data))
        if (data[k] === "true" || data[k] === "false") data[k] = data[k] === "true";
      const endpoint =
        module === "donations"
          ? "/api/admin/donations"
          : module === "clubRecords"
            ? "/api/admin/club-records"
            : `/api/admin/records?kind=${module}`;
      const res = await fetch(endpoint, {
        method: editing?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, id: editing?.id }),
      });
      if (res.ok) {
        setEditing(null);
        flash("Changes saved. Public content and reports updated.");
        await load();
        await loadVisibility();
      } else {
        const error = await res.json().catch(() => null);
        flash(error?.error ?? `Save failed (${res.status}).`, "error");
      }
    } catch (error) {
      flash(error instanceof Error ? `Save failed: ${error.message}` : "Save failed: network or server error.", "error");
    }
  }

  async function remove(id: unknown) {
    const endpoint =
      module === "donations"
        ? "/api/admin/donations"
        : module === "clubRecords"
          ? "/api/admin/club-records"
          : `/api/admin/records?kind=${module}`;
    const res = await fetch(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      flash("Record deleted.");
      await load();
      await loadVisibility();
    } else {
      const error = await res.json().catch(() => null);
      flash(error?.error ?? `Delete failed.`, "error");
    }
  }

  async function setMemberStatus(row: Record<string, unknown>, status: string) {
    const res = await fetch(`/api/admin/records?kind=members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: row.id,
        name: row.name,
        role: row.role ?? "Member",
        ward: row.ward ?? null,
        phone: row.phone ?? null,
        email: row.email ?? null,
        status,
      }),
    });
    flash(
      res.ok
        ? status === "active"
          ? `${String(row.name)} लाई Active गरियो — member ले अब login गर्न सक्छ।`
          : `${String(row.name)} लाई ${status} मा राखियो।`
        : "Status update failed.",
      res.ok ? "success" : "error",
    );
    await load();
  }

  async function setVisibility(entityType: string, recordId: unknown, visibility: string) {
    if (visibility === "public" && sensitivePublic.has(entityType)) {
      setConfirmState({
        title: "Make this public?",
        body: "यो record public गर्दा website मा सबैले देख्नेछन्। के तपाईं निश्चित हुनुहुन्छ?",
        confirmLabel: "Yes, make public",
        danger: true,
        onConfirm: async () => {
          await putVisibility(entityType, recordId, visibility);
          setConfirmState(null);
        },
      });
      return;
    }
    await putVisibility(entityType, recordId, visibility);
  }

  async function putVisibility(entityType: string, recordId: unknown, visibility: string) {
    const res = await fetch("/api/admin/visibility", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, recordId: String(recordId), visibility }),
    });
    if (res.ok) {
      setVisibilityMap((current) => ({ ...current, [`${entityType}:${recordId}`]: visibility }));
      flash(`Visibility set to ${visibility === "admin" ? "Admin only" : visibility === "members" ? "Members only" : visibility}.`);
    } else {
      flash("Visibility update failed.", "error");
    }
  }

  function exportCsv() {
    const csv = [
      fields[module].join(","),
      ...filtered.map((r) => fields[module].map((f) => JSON.stringify(r[f] ?? "")).join(",")),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `club-${module}.csv`;
    a.click();
  }

  async function openPaymentNotification(paymentId: string) {
    try {
      const res = await fetch(`/api/admin/monthly-fund/payment?id=${paymentId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setFundFocus({ month: data.month, paymentId });
      document.getElementById("monthly-fund-panel")?.scrollIntoView({ behavior: "smooth" });
    } catch { /* ignore */ }
  }

  if (isPending || (loading && !session))
    return <div className="grid min-h-screen place-items-center">Loading secure workspace…</div>;
  if (!session?.user)
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="rounded-2xl border bg-card p-8 text-center">
          <ShieldCheck className="mx-auto size-10 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Staff sign in required</h1>
          <a className="mt-5 inline-flex rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground" href="/sign-in">
            Go to sign in
          </a>
        </div>
      </div>
    );

  const isCrudModule = !["committee", "banks", "messages", "communityJoins", "security"].includes(module);
  const entityType = visibilityType[module];

  return (
    <main className="min-h-screen bg-secondary/50">
      {notice && (
        <div
          key={notice}
          role="status"
          className={`dashboard-toast fixed right-5 top-5 z-50 max-w-sm rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl ${noticeType === "error" ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-primary/30 bg-card text-foreground"}`}
        >
          <div className="flex items-start gap-3">
            <span className={`mt-1 size-2 shrink-0 rounded-full ${noticeType === "error" ? "bg-destructive" : "bg-primary"}`} />
            <span>{notice}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setNotice("")} className="ml-2 text-muted-foreground">
              ×
            </button>
          </div>
        </div>
      )}
      {confirmState && (
        <ConfirmDialog
          open
          title={confirmState.title}
          body={confirmState.body}
          confirmLabel={confirmState.confirmLabel}
          danger={confirmState.danger}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b bg-card/95 px-5 py-4 shadow-sm backdrop-blur">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Complete management system</p>
          <h1 className="text-2xl font-bold">Club administration</h1>
          <p className="text-sm text-muted-foreground">
            {session.user.name} · {(session.user as { role?: string }).role ?? "staff"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsBell onOpenPayment={openPaymentNotification} />
          <button className="rounded-xl border p-3" onClick={load} aria-label="Refresh">
            <RefreshCw className="size-4" />
          </button>
          <button
            className="rounded-xl border px-3 py-2 text-sm font-bold"
            onClick={async () => {
              await authClient.signOut();
              onBack?.();
            }}
          >
            <LogOut className="mr-2 inline size-4" />
            Sign out
          </button>
        </div>
      </header>
      <section className="mx-auto max-w-7xl p-5 lg:p-8">
        {/* Summary stat cards */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5">
            <p className="text-sm text-muted-foreground">Remaining balance</p>
            <p className="mt-2 text-3xl font-bold text-primary">{money((summary?.received ?? 0) - (summary?.expenses ?? 0))}</p>
            <p className="mt-1 text-xs text-muted-foreground">Confirmed donations minus expenses</p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Total confirmed income</p>
            <p className="mt-2 text-3xl font-bold">{money(summary?.received ?? 0)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Received + verified donations</p>
          </div>
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
            <p className="text-sm text-muted-foreground">Expenses</p>
            <p className="mt-2 text-3xl font-bold">{money(summary?.expenses ?? 0)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Total kharcha</p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">All balance (received + pending)</p>
            <p className="mt-2 text-3xl font-bold">{money(summary?.allBalance ?? 0)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Everything recorded</p>
          </div>
          <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5">
            <p className="text-sm text-muted-foreground">Pending donations</p>
            <p className="mt-2 text-3xl font-bold text-accent-foreground">{money(summary?.pendingDonationAmount ?? 0)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{summary?.pendingDonationCount ?? 0} awaiting review</p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Active members</p>
            <p className="mt-2 text-3xl font-bold">{summary?.activeMembers ?? 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">Members directory</p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Works / Programs</p>
            <p className="mt-2 text-3xl font-bold">{summary?.works ?? 0} · {summary?.programs ?? 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">Impact log / upcoming</p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Pending applications</p>
            <p className="mt-2 text-3xl font-bold">{summary?.pendingApplications ?? 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">Membership requests</p>
          </div>
        </div>

        {/* Module switcher */}
        <nav className="mb-5 flex flex-wrap gap-2">
          {(Object.keys(labels) as Module[]).map((k) => (
            <button
              key={k}
              onClick={() => {
                setModule(k);
                setEditing(null);
              }}
              className={`rounded-xl px-3 py-2 text-sm font-bold ${module === k ? "bg-primary text-primary-foreground" : "border bg-card"}`}
            >
              {labels[k]}
            </button>
          ))}
        </nav>

        {/* Club Records money overview */}
        {module === "clubRecords" && moduleSummary && (
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5">
              <p className="text-sm text-muted-foreground">कुल आम्दानी (chanda/income)</p>
              <p className="mt-2 text-3xl font-bold text-primary">{money(moduleSummary.income)}</p>
            </div>
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
              <p className="text-sm text-muted-foreground">कुल खर्च</p>
              <p className="mt-2 text-3xl font-bold">{money(moduleSummary.expense)}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">बाँकी रकम (balance)</p>
              <p className="mt-2 text-3xl font-bold">{money(moduleSummary.balance)}</p>
            </div>
          </div>
        )}

        {/* Donation filters */}
        {module === "donations" && (
          <div className="mb-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => setDonationView("all")} className={`rounded-xl border px-4 py-2 text-sm font-bold ${donationView === "all" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
              All donations ({rows.length})
            </button>
            <button type="button" onClick={() => setDonationView("success")} className={`rounded-xl border px-4 py-2 text-sm font-bold ${donationView === "success" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
              Success / confirmed ({rows.length - pendingDonations.length})
            </button>
            <button type="button" onClick={() => setDonationView("pending")} className={`rounded-xl border border-accent/40 px-4 py-2 text-sm font-bold ${donationView === "pending" ? "bg-accent text-accent-foreground" : "bg-accent/10"}`}>
              Pending ({pendingDonations.length})
            </button>
          </div>
        )}

        {/* Pending member activation banner */}
        {module === "members" && (
          <div className="mb-5 flex flex-wrap gap-2">
            {(["all", "active", "pending", "inactive"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setMemberStatusFilter(key)}
                className={`rounded-xl border px-4 py-2 text-sm font-bold ${memberStatusFilter === key ? "bg-primary text-primary-foreground" : "bg-card"}`}
              >
                {key === "all" ? "All" : key[0].toUpperCase() + key.slice(1)} ({key === "all" ? rows.length : key === "pending" ? pendingMembers.length : 0})
              </button>
            ))}
          </div>
        )}

        {/* Pending donor review cards */}
        {module === "donations" && donationView === "pending" && pendingDonations.length > 0 && (
          <div className="mb-6 rounded-2xl border border-accent/40 bg-accent/10 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Pending donor details</h2>
                <p className="text-sm text-muted-foreground">Review, edit, or confirm each pending donation.</p>
              </div>
              <span className="rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">{pendingDonations.length} pending</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {pendingDonations.map((donation) => (
                <div key={String(donation.id)} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{String(donation.donor || "Anonymous donor")}</p>
                      <p className="text-sm text-muted-foreground">{String(donation.purpose || "General fund")}</p>
                      <p className="mt-1 text-lg font-bold text-primary">{money(Number(donation.amount || 0))}</p>
                    </div>
                    <button type="button" onClick={() => setEditing(donation)} className="rounded-lg border bg-background px-3 py-2 text-sm font-bold">
                      <Pencil className="mr-1 inline size-4" />
                      Edit
                    </button>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Method</dt>
                      <dd className="font-semibold">{String(donation.method || "Cash")}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Reference</dt>
                      <dd className="font-semibold">{String(donation.reference || "—")}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CRUD toolbar */}
        {isCrudModule && (
          <div className="mb-5 flex flex-wrap gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any field…"
              className="min-w-64 flex-1 rounded-xl border bg-card px-4 py-3 text-sm"
            />
            <button className="rounded-xl border bg-card px-4 py-3 text-sm font-bold" onClick={exportCsv}>
              <Download className="mr-2 inline size-4" />
              Export CSV
            </button>
            <button className="rounded-xl bg-accent px-4 py-3 text-sm font-bold" onClick={() => setEditing({})}>
              <Plus className="mr-1 inline size-4" />
              Add {labels[module]}
            </button>
          </div>
        )}

        {/* Dedicated module components */}
        {module === "committee" && <CommitteeManagement />}
        {module === "security" && <AdminSecurityPanel onNotice={(message, type) => flash(message, type ?? "success")} />}
        {module === "communityJoins" && <CommunityJoinsPanel onNotice={(message, type) => flash(message, type ?? "success")} />}
        {module === "banks" && <BankManager onNotice={(message, type) => flash(message, type ?? "success")} />}
        {module === "messages" && <ChatPanel mode="admin" />}

        {/* CRUD form */}
        {isCrudModule && editing && (
          <form onSubmit={save} className="mb-6 grid gap-3 rounded-2xl border bg-card p-5 sm:grid-cols-2">
            {fields[module].map((f) => (
              <label key={f} className="flex flex-col gap-1 text-sm font-semibold">
                {f}
                {module === "clubRecords" && f === "type" ? (
                  <select name={f} defaultValue={String(editing[f] ?? "income")} className="rounded-xl border bg-background px-3 py-2.5">
                    <option value="income">Income / Chanda</option>
                    <option value="expense">Expense</option>
                  </select>
                ) : (
                  <input
                    name={f}
                    defaultValue={String(editing[f] ?? "")}
                    type={["amount", "budget", "actualExpense"].includes(f) ? "number" : f === "published" || f === "isPublic" ? "checkbox" : ["workDate", "programDate", "takenAt", "spentAt", "recordDate"].includes(f) ? "date" : "text"}
                    defaultChecked={Boolean(editing[f])}
                    className="rounded-xl border bg-background px-3 py-2.5"
                  />
                )}
              </label>
            ))}
            <div className="flex gap-2 sm:col-span-2">
              <button className="rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground">Save changes</button>
              <button type="button" className="rounded-xl border px-4 py-3 font-bold" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Records table */}
        {isCrudModule && (
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b bg-secondary/50">
                <tr>
                  <th className="px-4 py-3">Record</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Status</th>
                  {entityType && <th className="px-4 py-3">Visibility</th>}
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const currentVisibility = entityType ? visibilityMap[`${entityType}:${r.id}`] ?? "public" : null;
                  return (
                    <tr key={String(r.id)} className="border-b last:border-0">
                      <td className="px-4 py-4 font-bold">
                        {String(r.name || r.title || r.donor || r.section || "Record")}
                      </td>
                      <td className="max-w-lg px-4 py-4 text-muted-foreground">
                        {String(r.description || r.body || r.email || r.purpose || r.category || r.notes || r.phone || "")}
                      </td>
                      <td className="px-4 py-4">
                        {module === "members" ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${String(r.status) === "active" ? "bg-primary/15 text-primary" : "bg-accent/20 text-accent-foreground"}`}>
                              {String(r.status || "—")}
                            </span>
                            {String(r.status) !== "active" ? (
                              <button
                                type="button"
                                onClick={() => setMemberStatus(r, "active")}
                                className="rounded-lg bg-primary px-2 py-1 text-[11px] font-bold text-primary-foreground"
                              >
                                Activate
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setMemberStatus(r, "inactive")}
                                className="rounded-lg border px-2 py-1 text-[11px] font-bold"
                              >
                                Deactivate
                              </button>
                            )}
                          </div>
                        ) : module === "clubRecords" ? (
                          <>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${String(r.type) === "income" ? "bg-primary/15 text-primary" : "bg-destructive/10 text-destructive"}`}
                            >
                              {String(r.type) === "income" ? "Income / Chanda" : "Expense"}
                            </span>
                            <span className="ml-2 font-bold">{money(Number(r.amount))}</span>
                          </>
                        ) : (
                          <>
                            {String(r.status || r.published || "—")}
                            {r.amount && <span className="ml-2 font-bold">{money(Number(r.amount))}</span>}
                          </>
                        )}
                      </td>
                      {entityType && (
                        <td className="px-4 py-4">
                          <select
                            value={currentVisibility ?? "public"}
                            onChange={(e) => setVisibility(entityType, r.id, e.target.value)}
                            className="rounded-lg border bg-background px-2 py-1.5 text-xs font-semibold"
                            aria-label="Visibility"
                          >
                            <option value="public">Public</option>
                            <option value="members">Members only</option>
                            <option value="private">Private</option>
                            <option value="admin">Admin only</option>
                          </select>
                        </td>
                      )}
                      <td className="px-4 py-4 text-right">
                        <button className="mr-2 rounded-lg border p-2" onClick={() => setEditing(r)} aria-label="Edit">
                          <Pencil className="size-4" />
                        </button>
                        <button
                          className="rounded-lg border p-2 text-destructive"
                          onClick={() =>
                            setConfirmState({
                              title: "Delete record?",
                              body: "यो record स्थायी रूपमा हट्नेछ। के तपाईं निश्चित हुनुहुन्छ?",
                              confirmLabel: "Delete",
                              danger: true,
                              onConfirm: () => {
                                setConfirmState(null);
                                remove(r.id);
                              },
                            })
                          }
                          aria-label="Delete"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filtered.length && !loading && (
              <p className="p-10 text-center text-muted-foreground">No records found. Use Add to create one.</p>
            )}
          </div>
        )}

        {/* Management panels */}
        <MonthlyFundPanel focusRequest={fundFocus} />
        <LoanManager />
        <PaymentQrSettings
          onNotice={(message) => flash(message)}
        />
        <VisibilityControlPanel />
        <AdminTools
          rows={filtered}
          module={module}
          onNotice={(message) => flash(message)}
          onRefresh={load}
        />
      </section>
    </main>
  );
}
