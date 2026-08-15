"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { MemberWorkspace } from "./member-workspace";
import { ChatPanel } from "./chat-panel";
import { CalendarDays, ClipboardList, MessageCircle, WalletCards } from "lucide-react";

type Payment = {
  id: string;
  collectionMonth: string;
  amount: number;
  status: string;
  paidAt?: string | null;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  receiptNumber?: string | null;
  submittedAt?: string | null;
};
type Bank = { id: string; name: string; accountHolder: string | null; accountNumber: string | null; qrUrl: string | null };
type Data = {
  member: { name: string; role: string; ward?: string; phone?: string; email?: string; status: string };
  payments: Payment[];
  notices: { title: string; body: string; category: string }[];
  events: { name: string; description: string; location?: string; programDate?: string }[];
  banks: Bank[];
  paymentSettings: { bankQrUrl?: string | null; esewaQrUrl?: string | null };
};

const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;
const months = ["Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];
const monthName = (key: string) => {
  if (!/^\d{4}-\d{2}$/.test(key)) return key;
  const [, mm] = key.split("-");
  const index = Number(mm) - 1;
  return `${months[index] ?? mm} ${key.slice(0, 4)}`;
};

const statusStyle = (status: string) =>
  status === "paid"
    ? "bg-primary/15 text-primary"
    : status === "pending"
      ? "bg-accent/25 text-accent-foreground"
      : "bg-muted text-muted-foreground";

export function MemberDashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"workspace" | "fund" | "payments" | "messages">("workspace");
  const [method, setMethod] = useState<"Bank transfer" | "eSewa">("Bank transfer");
  const [bankId, setBankId] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useState(() => {
    fetch("/api/member/dashboard")
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error);
        setData(body);
        if (body.banks?.length) setBankId(body.banks[0].id);
      })
      .catch((e) => setError(e.message));
  });

  async function submit(form: FormData) {
    setLoading(true);
    setMessage("");
    const body = Object.fromEntries(form);
    const response = await fetch("/api/member/fund-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(result.error || "Payment submission failed");
    setMessage(
      "Payment submitted successfully. Status: Pending approval. Admin ले payment verify गरेर Approve / Paid गरेपछि मात्र history मा Paid देखिन्छ।",
    );
    const refreshed = await fetch("/api/member/dashboard", { cache: "no-store" });
    if (refreshed.ok) setData(await refreshed.json());
  }

  if (error)
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          <p className="font-bold">Member dashboard</p>
          <p className="mt-2 text-sm leading-6">{error}</p>
          <a href="/sign-in" className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
            Go to sign in
          </a>
        </div>
      </main>
    );
  if (!data)
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="animate-pulse rounded-2xl bg-muted p-12">Loading member dashboard...</div>
      </main>
    );

  const unpaid = data.payments.find((payment) => payment.status !== "paid");
  const pendingPayments = data.payments.filter((p) => p.status === "pending");
  const selectedBank = data.banks.find((b) => b.id === bankId);
  const qrUrl = method === "eSewa" ? data.paymentSettings.esewaQrUrl : (selectedBank?.qrUrl ?? data.paymentSettings.bankQrUrl);
  const qrLabel = method === "eSewa" ? "eSewa QR" : selectedBank ? `${selectedBank.name} QR` : "Bank QR";

  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-semibold text-primary">Member dashboard</p>
            <h1 className="text-2xl font-bold">Namaste, {data.member.name}</h1>
            <p className="text-xs text-muted-foreground">
              {data.member.role} · {data.member.ward ? `Ward ${data.member.ward}` : ""} · Status:{" "}
              <span className="font-bold text-primary">{data.member.status}</span>
            </p>
          </div>
          <button className="rounded-xl border px-3 py-2" onClick={() => authClient.signOut().then(() => (location.href = "/sign-in"))}>
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-5">
        <nav className="mb-5 flex flex-wrap gap-2">
          {(
            [
              ["workspace", "My workspace", ClipboardList],
              ["fund", "Monthly fund", WalletCards],
              ["payments", "Payments", CalendarDays],
              ["messages", "Messages", MessageCircle],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${tab === key ? "bg-primary text-primary-foreground" : "border bg-card"}`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </nav>

        {pendingPayments.length > 0 && (
          <div className="mb-5 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm font-semibold text-accent-foreground">
            {pendingPayments.length} payment(s) pending admin approval — Approve गरेपछि मात्र Paid देखिन्छ।
          </div>
        )}

        {tab === "workspace" && <MemberWorkspace />}

        {tab === "fund" && (
          <section className="space-y-5">
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="text-lg font-bold">Monthly fund</h2>
              <button
                type="button"
                onClick={() => setShowPayment((open) => !open)}
                className="mt-4 flex w-full items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-left text-sm font-bold text-primary"
              >
                <span>Payment here</span>
                <span aria-hidden="true">{showPayment ? "−" : "+"}</span>
              </button>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Scan the QR, pay Rs. {unpaid?.amount ?? 20}, then submit your transaction details. Payment Pending रहन्छ जबसम्म admin approve गर्दैन।
              </p>
              {showPayment && (
                <form action={submit} className="mt-5 grid gap-4 rounded-2xl border bg-muted/20 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1 text-sm font-semibold">
                      Payment method
                      <select
                        name="paymentMethod"
                        value={method}
                        onChange={(e) => setMethod(e.target.value as "Bank transfer" | "eSewa")}
                        className="rounded-xl border bg-background px-3 py-2.5 text-sm font-normal"
                      >
                        <option value="Bank transfer">Bank transfer</option>
                        <option value="eSewa">eSewa</option>
                      </select>
                    </label>
                    {method === "Bank transfer" && data.banks.length > 0 && (
                      <label className="grid gap-1 text-sm font-semibold">
                        Select bank (QR अनुसार pay गर्नुहोस्)
                        <select
                          value={bankId}
                          onChange={(e) => setBankId(e.target.value)}
                          className="rounded-xl border bg-background px-3 py-2.5 text-sm font-normal"
                        >
                          {data.banks.map((bank) => (
                            <option key={bank.id} value={bank.id}>
                              {bank.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                  <div className="rounded-xl border bg-background p-4 text-center">
                    {qrUrl ? (
                      <img src={qrUrl} alt={`${qrLabel} payment QR`} className="mx-auto aspect-square w-44 rounded-xl border object-contain p-2" />
                    ) : (
                      <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">QR not configured yet — admin सँग सम्पर्क गर्नुहोस्।</p>
                    )}
                    <p className="mt-2 text-xs font-bold text-primary">{qrLabel}</p>
                    {selectedBank && <p className="text-xs text-muted-foreground">{selectedBank.accountHolder} · {selectedBank.accountNumber}</p>}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-sm font-semibold">
                      Collection month
                      <input name="collectionMonth" type="month" required className="rounded-xl border bg-background px-3 py-2.5 text-sm font-normal" />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold">
                      Amount (Rs.)
                      <input name="amount" type="number" min="1" required defaultValue={unpaid?.amount ?? 20} className="rounded-xl border bg-background px-3 py-2.5 text-sm font-normal" />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
                      Transaction reference number
                      <input name="paymentReference" required placeholder="e.g. eSewa ID / bank reference" className="rounded-xl border bg-background px-3 py-2.5 text-sm font-normal" />
                    </label>
                  </div>
                  <button disabled={loading} className="rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-60">
                    {loading ? "Submitting…" : "Submit payment (Pending approval)"}
                  </button>
                </form>
              )}
              {message && <p role="status" className="mt-4 rounded-xl bg-primary/10 p-3 text-sm font-semibold text-primary">{message}</p>}
            </div>
          </section>
        )}

        {tab === "payments" && (
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-lg font-bold">Payment history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pending payment Admin approve गरेपछि मात्र Paid / Success देखिन्छ।
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="p-3">Month</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No payments yet.
                      </td>
                    </tr>
                  )}
                  {data.payments.map((payment) => (
                    <tr key={payment.id} className="border-b last:border-0">
                      <td className="p-3 font-bold">{monthName(payment.collectionMonth)}</td>
                      <td className="p-3 font-bold">{money(payment.amount)}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusStyle(payment.status)}`}>
                          {payment.status === "paid" ? "Paid / Success" : payment.status === "pending" ? "Pending" : "Unpaid"}
                        </span>
                      </td>
                      <td className="p-3">{payment.paymentMethod ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">
                        {payment.status === "paid" && payment.paidAt
                          ? new Date(payment.paidAt).toLocaleDateString("en-GB")
                          : payment.submittedAt
                            ? new Date(payment.submittedAt).toLocaleDateString("en-GB")
                            : "—"}
                      </td>
                      <td className="p-3 text-muted-foreground">{payment.receiptNumber ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "messages" && <ChatPanel mode="member" />}
      </div>
    </main>
  );
}
