"use client";
import { useEffect, useState } from "react";
import { KeyRound, Mail, RefreshCw, ShieldPlus, Trash2, UserCog } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type AdminRow = { id: string; name: string; email: string; role: string; emailVerified: boolean };

export function AdminSecurityPanel({ onNotice }: { onNotice: (message: string, type?: "success" | "error") => void }) {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/security", { cache: "no-store" });
    if (res.ok) setAdmins((await res.json()).admins ?? []);
  }
  useEffect(() => { load() }, []);

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (data.newPassword !== data.confirmPassword) {
      onNotice("New password र confirm password मिलेन।", "error");
      return;
    }
    setBusy(true);
    const result = await authClient.changePassword({
      currentPassword: String(data.currentPassword),
      newPassword: String(data.newPassword),
      revokeOtherSessions: true,
    });
    setBusy(false);
    if (result.error) onNotice(`Password change failed: ${result.error.message || "try again"}`, "error");
    else {
      onNotice("Password बदलियो। अब नयाँ password बाट login गर्नुहोस्।");
      event.currentTarget.reset();
    }
  }

  async function changeEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    const res = await fetch("/api/admin/security", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "change-email", currentPassword: String(data.currentPassword), newEmail: String(data.newEmail) }),
    });
    const body = await res.json();
    setBusy(false);
    onNotice(body.message ?? body.error ?? "Email change failed.", res.ok ? "success" : "error");
    if (res.ok) event.currentTarget.reset();
  }

  async function addAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    const res = await fetch("/api/admin/security", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add-admin", name: String(data.name), email: String(data.email) }),
    });
    const body = await res.json();
    setBusy(false);
    onNotice(body.message ?? body.error ?? "Could not add admin.", res.ok ? "success" : "error");
    if (res.ok) {
      event.currentTarget.reset();
      await load();
    }
  }

  async function removeAdmin(row: AdminRow) {
    if (!confirm(`Remove ${row.name} (${row.email}) from admins?`)) return;
    const res = await fetch("/api/admin/security", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove-admin", id: row.id }),
    });
    const body = await res.json();
    onNotice(body.message ?? "Done.", res.ok ? "success" : "error");
    await load();
  }

  const card = "rounded-2xl border bg-card p-5 shadow-sm";
  const input = "w-full rounded-xl border bg-background px-3 py-2.5 text-sm";

  return (
    <section className="mb-6 space-y-5">
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Settings → Security</p>
            <h2 className="text-xl font-bold">Admin account management</h2>
            <p className="text-sm text-muted-foreground">Change your email / password, add or remove admins — without touching code.</p>
          </div>
          <button type="button" onClick={load} className="rounded-xl border p-3" aria-label="Refresh admins">
            <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <form onSubmit={changePassword} className={card}>
            <h3 className="flex items-center gap-2 font-bold"><KeyRound className="size-4 text-primary" /> Change password</h3>
            <div className="mt-3 grid gap-2">
              <input name="currentPassword" type="password" required placeholder="Current password" className={input} />
              <input name="newPassword" type="password" minLength={8} required placeholder="New password (min 8)" className={input} />
              <input name="confirmPassword" type="password" minLength={8} required placeholder="Confirm new password" className={input} />
              <button disabled={busy} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">Change password</button>
            </div>
          </form>

          <form onSubmit={changeEmail} className={card}>
            <h3 className="flex items-center gap-2 font-bold"><Mail className="size-4 text-primary" /> Change admin email</h3>
            <div className="mt-3 grid gap-2">
              <input name="currentPassword" type="password" required placeholder="Current password" className={input} />
              <input name="newEmail" type="email" required placeholder="New admin email" className={input} />
              <button disabled={busy} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">Change email</button>
            </div>
          </form>

          <form onSubmit={addAdmin} className={card}>
            <h3 className="flex items-center gap-2 font-bold"><ShieldPlus className="size-4 text-primary" /> Add new admin</h3>
            <div className="mt-3 grid gap-2">
              <input name="name" required placeholder="Name" className={input} />
              <input name="email" type="email" required placeholder="Email" className={input} />
              <button disabled={busy} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">Add admin</button>
              <p className="text-xs text-muted-foreground">नयाँ admin ले Forgot password बाट password set गर्नुहोस्।</p>
            </div>
          </form>
        </div>

        <div className="mt-6">
          <h3 className="flex items-center gap-2 font-bold"><UserCog className="size-4 text-primary" /> Current admins</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Verified</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b last:border-0">
                    <td className="p-3 font-bold">{admin.name}</td>
                    <td className="p-3">{admin.email}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${admin.emailVerified ? "bg-primary/15 text-primary" : "bg-accent/25 text-accent-foreground"}`}>
                        {admin.emailVerified ? "Verified" : "Pending"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button type="button" onClick={() => removeAdmin(admin)} className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-bold text-destructive">
                        <Trash2 className="mr-1 inline size-3.5" /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
