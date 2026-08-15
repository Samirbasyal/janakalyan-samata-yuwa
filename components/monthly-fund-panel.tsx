"use client";
import { useEffect, useRef, useState } from "react";
import { Pencil, RefreshCw, Trash2, UserPlus, X } from "lucide-react";

type FundRow = {
  id: string | null;
  memberId: string;
  memberName: string;
  collectionMonth: string;
  amount: number;
  status: string;
  paidAt: string | null;
  paymentMethod: string | null;
  collectedBy: string | null;
  remarks: string | null;
  receiptNumber: string | null;
  paymentReference?: string | null;
};
type Summary = {
  totalMembers: number;
  paidMembers: number;
  unpaidMembers: number;
  expectedCollection: number;
  collectedAmount: number;
  remainingAmount: number;
};
const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

const statusStyle = (status: string) =>
  status === "paid"
    ? "bg-primary/15 text-primary"
    : status === "pending"
      ? "bg-accent/25 text-accent-foreground"
      : "bg-muted text-muted-foreground";
const statusLabel = (status: string) =>
  status === "paid" ? "Paid" : status === "pending" ? "Pending" : "Unpaid";

export function MonthlyFundPanel({
  focusRequest,
}: {
  focusRequest?: { month: string; paymentId: string } | null;
}) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState<FundRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "unpaid">("all");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<FundRow | null>(null);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);

  async function load() {
    setBusy(true);
    const response = await fetch(`/api/admin/monthly-fund?month=${month}`, {
      cache: "no-store",
    });
    const data = await response.json();
    if (response.ok) {
      setRows(data.rows);
      setSummary(data.summary);
    } else setMessage(data.error ?? "Could not load monthly fund.");
    setBusy(false);
  }
  useEffect(() => {
    load();
  }, [month]);

  // Jump to a payment row (from a notification click)
  useEffect(() => {
    if (!focusRequest) return;
    setMonth(focusRequest.month);
    setPendingFocusId(focusRequest.paymentId);
  }, [focusRequest]);

  useEffect(() => {
    if (!pendingFocusId) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`fund-row-${pendingFocusId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("bg-accent/20");
        window.setTimeout(() => el.classList.remove("bg-accent/20"), 2500);
        setPendingFocusId(null);
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [pendingFocusId, rows]);

  async function approvePayment(row: FundRow) {
    if (!row.id || !confirm(`Approve ${row.memberName}'s payment?`)) return;
    const response = await fetch("/api/admin/monthly-fund/approve", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id }),
    });
    setMessage(
      response.ok
        ? "Payment approved and marked paid."
        : "Could not approve payment.",
    );
    await load();
  }
  async function rejectPayment(row: FundRow) {
    if (!row.id || !confirm(`Reject ${row.memberName}'s payment submission?`)) return;
    const response = await fetch("/api/admin/monthly-fund", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: row.id,
        memberId: row.memberId,
        memberName: row.memberName,
        amount: row.amount,
        status: "unpaid",
        paymentMethod: null,
        paymentReference: null,
        remarks: "Rejected by admin",
        forceEdit: true,
      }),
    });
    setMessage(response.ok ? "Payment rejected (back to unpaid)." : "Could not reject payment.");
    await load();
  }
  async function removePayment(row: FundRow) {
    if (!row.id || !confirm(`Delete ${row.memberName}'s payment?`)) return;
    const response = await fetch("/api/admin/monthly-fund", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id }),
    });
    setMessage(response.ok ? "Payment deleted." : "Could not delete payment.");
    await load();
  }
  const visible = rows.filter(
    (row) => filter === "all" || row.status === filter,
  );
  const pendingRows = rows.filter((row) => row.status === "pending");

  return (
    <section id="monthly-fund-panel" className="mb-8 rounded-3xl border bg-card p-5 shadow-sm lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Monthly fund collection
          </p>
          <h2 className="mt-1 text-2xl font-bold">Rs. 20 member kosha</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every member, payment record and monthly status in one place. Member
            द्वारा submit गरिएको payment Approve गरेपछि मात्र Paid हुन्छ।
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-semibold" htmlFor="fund-month">
            Month
          </label>
          <input
            id="fund-month"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="rounded-xl border bg-background px-3 py-2"
          />
          <button
            type="button"
            onClick={() => setShowMemberForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"
          >
            <UserPlus className="size-4" />
            Add member
          </button>
          <button
            type="button"
            onClick={load}
            className="rounded-xl border p-3"
            aria-label="Refresh monthly fund"
          >
            <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
      {summary && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["Members", summary.totalMembers],
            ["Paid", summary.paidMembers],
            ["Pending", pendingRows.length],
            ["Unpaid", summary.unpaidMembers],
            ["Expected", money(summary.expectedCollection)],
            ["Collected", money(summary.collectedAmount)],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-2xl border bg-background p-4"
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      )}
      {pendingRows.length > 0 && (
        <div className="mt-4 rounded-2xl border border-accent/40 bg-accent/10 p-4">
          <p className="text-sm font-bold text-accent-foreground">
            {pendingRows.length} payment(s) awaiting approval — member ले submit
            गरेका
          </p>
        </div>
      )}
      {message && (
        <div
          role="status"
          className="mt-4 rounded-xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary"
        >
          {message}
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        {(["all", "paid", "pending", "unpaid"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-xl border px-4 py-2 text-sm font-bold ${filter === key ? "bg-primary text-primary-foreground" : ""}`}
          >
            {key[0].toUpperCase() + key.slice(1)} (
            {key === "all" ? rows.length : key === "paid" ? summary?.paidMembers ?? 0 : key === "pending" ? pendingRows.length : summary?.unpaidMembers ?? 0})
          </button>
        ))}
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <th className="p-3">Member</th>
              <th className="p-3">Status</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Payment details</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={row.memberId}
                id={row.id ? `fund-row-${row.id}` : undefined}
                className="border-b transition-colors last:border-0"
              >
                <td className="p-3">
                  <p className="font-bold">{row.memberName}</p>
                  <p className="text-xs text-muted-foreground">ID: {row.memberId}</p>
                </td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusStyle(row.status)}`}>
                    {statusLabel(row.status)}
                  </span>
                </td>
                <td className="p-3 font-bold">{money(row.amount)}</td>
                <td className="p-3 text-xs text-muted-foreground">
                  {row.status === "paid"
                    ? `${row.paymentMethod ?? "Cash"} · ${row.paidAt ? new Date(row.paidAt).toLocaleDateString("en-GB") : ""}${row.receiptNumber ? ` · ${row.receiptNumber}` : ""}`
                    : row.status === "pending"
                      ? `${row.paymentMethod ?? ""} · Ref: ${row.paymentReference ?? "—"}${row.paidAt ? ` · ${new Date(row.paidAt).toLocaleString()}` : ""}`
                      : "No payment recorded"}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {row.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => approvePayment(row)}
                          className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
                        >
                          Approve / Paid
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectPayment(row)}
                          className="rounded-lg border border-destructive/40 px-3 py-2 text-xs font-bold text-destructive"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {row.status === "paid" && (
                      <button
                        type="button"
                        onClick={() => setEditing(row)}
                        className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold"
                      >
                        <Pencil className="size-3" />
                        Edit payment
                      </button>
                    )}
                    {row.status === "unpaid" && (
                      <button
                        type="button"
                        onClick={() => setEditing(row)}
                        className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
                      >
                        Add payment
                      </button>
                    )}
                    {(row.status === "paid" || row.status === "pending") && (
                      <button
                        type="button"
                        onClick={() => removePayment(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-3 py-2 text-xs font-bold text-destructive"
                      >
                        <Trash2 className="size-3" />
                        Delete
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm(`Delete ${row.memberName} from members and monthly fund?`)) return;
                        fetch("/api/admin/records?kind=members", {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: row.memberId }),
                        }).then(() => load());
                      }}
                      className="rounded-lg border border-destructive/40 px-3 py-2 text-xs font-bold text-destructive"
                    >
                      Delete member
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No members found. Add a member to start monthly collection.
          </p>
        )}
      </div>
      {(editing || showMemberForm) && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">
                {showMemberForm
                  ? "Add new member"
                  : `Record payment — ${editing?.memberName}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setShowMemberForm(false);
                }}
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            {showMemberForm ? (
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  const data = Object.fromEntries(new FormData(event.currentTarget));
                  const response = await fetch("/api/admin/records?kind=members", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                  });
                  const result = await response.json();
                  setMessage(
                    response.ok
                      ? "Member added successfully."
                      : (result.error ?? "Could not add member."),
                  );
                  if (response.ok) {
                    setShowMemberForm(false);
                    await load();
                  }
                }}
                className="mt-5 grid gap-3"
              >
                <input name="name" required placeholder="Member name" className="rounded-xl border bg-background px-3 py-3" />
                <input name="role" placeholder="Role" defaultValue="Member" className="rounded-xl border bg-background px-3 py-3" />
                <input name="ward" placeholder="Ward / address" className="rounded-xl border bg-background px-3 py-3" />
                <input name="phone" placeholder="Phone" className="rounded-xl border bg-background px-3 py-3" />
                <input name="email" type="email" placeholder="Email" className="rounded-xl border bg-background px-3 py-3" />
                <button className="rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground">Save member</button>
              </form>
            ) : (
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  const data = Object.fromEntries(new FormData(event.currentTarget));
                  const response = await fetch("/api/admin/monthly-fund", {
                    method: editing?.id ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...data,
                      memberId: editing?.memberId ?? data.memberId,
                      collectionMonth: month,
                      forceEdit: Boolean(editing?.id),
                    }),
                  });
                  const result = await response.json();
                  setMessage(
                    response.ok
                      ? "Payment recorded successfully."
                      : (result.error ?? "Could not save payment."),
                  );
                  if (response.ok) {
                    setEditing(null);
                    await load();
                  }
                }}
                className="mt-5 grid gap-3"
              >
                <p className="rounded-xl bg-muted p-3 text-sm">
                  Member: <strong>{editing?.memberName}</strong>
                  <br />
                  Month: <strong>{month}</strong>
                </p>
                <input name="amount" type="number" min="1" defaultValue={editing?.amount ?? 20} required placeholder="Amount" className="rounded-xl border bg-background px-3 py-3" />
                <input name="paymentDate" type="date" defaultValue={editing?.paidAt ? editing.paidAt.slice(0, 10) : new Date().toISOString().slice(0, 10)} required className="rounded-xl border bg-background px-3 py-3" />
                <select name="paymentMethod" defaultValue={editing?.paymentMethod ?? "Cash"} className="rounded-xl border bg-background px-3 py-3">
                  <option>Cash</option>
                  <option>eSewa</option>
                  <option>Bank</option>
                  <option>Other</option>
                </select>
                <input name="collectedBy" defaultValue={editing?.collectedBy ?? ""} placeholder="Collected by" className="rounded-xl border bg-background px-3 py-3" />
                <textarea name="remarks" defaultValue={editing?.remarks ?? ""} placeholder="Remarks" className="min-h-20 rounded-xl border bg-background px-3 py-3" />
                <button className="rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground">Save payment</button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
