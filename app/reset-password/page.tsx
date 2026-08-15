"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const token = params.get("token");
    if (!token) {
      setError("This reset link is invalid or expired.");
      setLoading(false);
      return;
    }
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    if (result.error)
      setError(result.error.message || "Unable to reset password.");
    else router.push("/sign-in");
    setLoading(false);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5">
      <form
        onSubmit={submit}
        className="flex w-full max-w-md flex-col gap-5 rounded-3xl border border-border bg-card p-7 shadow-xl"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Staff portal
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold">
            Set new password
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Choose a new secure password for your admin account.
          </p>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          New password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            minLength={8}
            required
            className="rounded-xl border border-border bg-background px-3 py-3 font-normal outline-none focus:border-primary"
          />
        </label>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <button
          disabled={loading}
          className="rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
        <Link
          href="/sign-in"
          className="text-center text-sm font-semibold text-primary"
        >
          Back to sign in
        </Link>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-background">
          <p>Loading secure reset form…</p>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
