"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    if (result.error)
      setError(result.error.message || "Unable to send reset instructions.");
    else
      setMessage(
        "If this email is registered, password reset instructions have been sent.",
      );
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
            Forgot password?
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Enter your staff email and we will send a secure password reset
            link.
          </p>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            name="email"
            type="email"
            required
            className="rounded-xl border border-border bg-background px-3 py-3 font-normal outline-none focus:border-primary"
          />
        </label>
        {message && (
          <p
            role="status"
            className="rounded-xl bg-primary/10 p-3 text-sm text-primary"
          >
            {message}
          </p>
        )}
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
          {loading ? "Sending…" : "Send reset link"}
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
