"use client";
import { useEffect, useState } from "react";
const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;
type Loan = {
  id: string;
  borrower: string;
  amount: number;
  purpose: string;
  loanDate: string;
  dueDate?: string | null;
  notes?: string | null;
  agreementText?: string | null;
  agreementPhotoPath?: string | null;
  returned: number;
  balance: number;
};
export function LoanManager() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [editing, setEditing] = useState<Loan | null>(null);
  const [returning, setReturning] = useState<Loan | null>(null);
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  async function load() {
    const r = await fetch("/api/admin/loans", { cache: "no-store" });
    if (r.ok) setLoans(await r.json());
  }
  useEffect(() => {
    load();
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const photo = formData.get("agreementPhoto");
    let agreementPhotoPath = editing?.agreementPhotoPath || "";
    if (photo instanceof File && photo.size) {
      const upload = new FormData();
      upload.append("file", photo);
      const ur = await fetch("/api/admin/loans/upload", {
        method: "POST",
        body: upload,
      });
      const result = await ur.json();
      if (!ur.ok) {
        setNotice(result.error);
        return;
      }
      agreementPhotoPath = result.pathname;
    }
    const data = Object.fromEntries(formData);
    delete data.agreementPhoto;
    const r = await fetch("/api/admin/loans", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, agreementPhotoPath, id: editing?.id }),
    });
    const result = await r.json();
    setNotice(r.ok ? "Loan saved successfully." : result.error);
    if (r.ok) {
      setEditing(null);
      setShowForm(false);
      await load();
    }
  }
  async function addReturn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch("/api/admin/loans", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, loanId: returning?.id }),
    });
    const result = await r.json();
    setNotice(r.ok ? "Loan return saved." : result.error);
    if (r.ok) {
      setReturning(null);
      await load();
    }
  }
  async function remove(id: string) {
    if (!confirm("Delete this loan?")) return;
    await fetch("/api/admin/loans", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }
  const total = loans.reduce((s, l) => s + l.amount, 0),
    returned = loans.reduce((s, l) => s + l.returned, 0),
    balance = loans.reduce((s, l) => s + l.balance, 0);
  return (
    <section className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Loans & returns
          </p>
          <h2 className="text-xl font-bold">Loan register</h2>
          <p className="text-sm text-muted-foreground">
            Every loan, agreement, return, and live balance.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          Add loan
        </button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Loan total</p>
          <p className="text-2xl font-bold">{money(total)}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Returned</p>
          <p className="text-2xl font-bold">{money(returned)}</p>
        </div>
        <div className="rounded-xl border border-accent/40 bg-accent/10 p-4">
          <p className="text-sm text-muted-foreground">Loan balance</p>
          <p className="text-2xl font-bold">{money(balance)}</p>
        </div>
      </div>
      {notice && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-primary/10 p-3 text-sm font-semibold"
        >
          {notice}
        </p>
      )}
      {(showForm || editing) && (
        <form
          onSubmit={submit}
          className="mt-5 grid gap-3 rounded-xl border bg-muted/20 p-4 md:grid-cols-2"
        >
          <input
            name="borrower"
            required
            placeholder="Borrower name"
            defaultValue={editing?.borrower ?? ""}
            className="rounded-lg border p-3"
          />
          <input
            name="amount"
            required
            placeholder="Loan amount"
            defaultValue={editing?.amount ?? ""}
            className="rounded-lg border p-3"
          />
          <input
            name="purpose"
            required
            placeholder="Why loan was given"
            defaultValue={editing?.purpose ?? ""}
            className="rounded-lg border p-3"
          />
          <input
            name="loanDate"
            type="date"
            defaultValue={editing?.loanDate?.slice(0, 10) ?? ""}
            className="rounded-lg border p-3"
          />
          <input
            name="dueDate"
            type="date"
            defaultValue={editing?.dueDate?.slice(0, 10) ?? ""}
            className="rounded-lg border p-3"
          />
          <textarea
            name="notes"
            placeholder="Notes"
            defaultValue={editing?.notes ?? ""}
            className="min-h-20 rounded-lg border p-3 md:col-span-2"
          />
          <textarea
            name="agreementText"
            placeholder="Written agreement details"
            defaultValue={editing?.agreementText ?? ""}
            className="min-h-24 rounded-lg border p-3 md:col-span-2"
          />
          <label className="rounded-lg border border-dashed p-3 text-sm md:col-span-2">
            <span className="font-semibold">Physical agreement photo</span>
            <input
              name="agreementPhoto"
              type="file"
              accept="image/*"
              className="mt-2 block w-full text-sm"
            />
          </label>
          <div className="flex gap-2 md:col-span-2">
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
              Save loan
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setShowForm(false);
              }}
              className="rounded-lg border px-4 py-2 text-sm font-bold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {returning && (
        <form
          onSubmit={addReturn}
          className="mt-5 grid gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4 md:grid-cols-3"
        >
          <p className="font-bold md:col-span-3">
            Return for {returning.borrower} — remaining{" "}
            {money(returning.balance)}
          </p>
          <input
            name="amount"
            required
            placeholder="Returned amount"
            className="rounded-lg border p-3"
          />
          <input
            name="returnDate"
            type="date"
            className="rounded-lg border p-3"
          />
          <input
            name="notes"
            placeholder="Return notes"
            className="rounded-lg border p-3"
          />
          <div className="flex gap-2 md:col-span-3">
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
              Save return
            </button>
            <button
              type="button"
              onClick={() => setReturning(null)}
              className="rounded-lg border px-4 py-2 text-sm font-bold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {loans.map((l) => (
          <article key={l.id} className="rounded-xl border p-4">
            <div className="flex justify-between gap-3">
              <div>
                <h3 className="font-bold">{l.borrower}</h3>
                <p className="text-sm text-muted-foreground">{l.purpose}</p>
                <p className="mt-2 text-lg font-bold">
                  Original {money(l.amount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-xl font-bold text-primary">
                  {money(l.balance)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm">
              Returned: {money(l.returned)} · Date:{" "}
              {new Date(l.loanDate).toLocaleDateString()}
            </p>
            {l.agreementText && (
              <p className="mt-2 rounded-lg bg-muted p-3 text-sm">
                <strong>Agreement:</strong> {l.agreementText}
              </p>
            )}
            {l.agreementPhotoPath && (
              <a
                className="mt-2 inline-block text-sm font-semibold text-primary underline"
                href={`/api/admin/loans/file?pathname=${encodeURIComponent(l.agreementPhotoPath)}`}
                target="_blank"
                rel="noreferrer"
              >
                View physical agreement photo
              </a>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setReturning(l)}
                className="rounded-lg border px-3 py-2 text-xs font-bold"
              >
                Add return
              </button>
              <button
                onClick={() => {
                  setEditing(l);
                  setShowForm(true);
                }}
                className="rounded-lg border px-3 py-2 text-xs font-bold"
              >
                Edit
              </button>
              <button
                onClick={() => remove(l.id)}
                className="rounded-lg border border-destructive/30 px-3 py-2 text-xs font-bold text-destructive"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
