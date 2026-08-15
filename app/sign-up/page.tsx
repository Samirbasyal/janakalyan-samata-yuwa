"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(form: FormData) {
    setLoading(true);
    setError("");
    const result = await authClient.signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (result.error)
      setError(result.error.message || "Unable to create account");
    else {
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  }
  return (
    <main className="grid min-h-screen place-items-center bg-background px-5">
      <form
        action={submit}
        className="flex w-full max-w-md flex-col gap-5 rounded-3xl border border-border bg-card p-7 shadow-xl"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Staff portal
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold">
            Create staff account
          </h1>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          Full name
          <input
            name="name"
            required
            className="rounded-xl border border-border bg-background px-3 py-3 font-normal outline-none focus:border-primary"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-xl border border-border bg-background px-3 py-3 font-normal outline-none focus:border-primary"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Password
          <input
            name="password"
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
          {loading ? "Creating…" : "Create account"}
        </button>
        <a
          href="/member-signup"
          className="text-center text-sm font-semibold text-primary"
        >
          Member account चाहिन्छ? Member signup
        </a>
        <a
          href="/sign-in"
          className="text-center text-sm font-semibold text-primary"
        >
          Already have an account? Sign in
        </a>
      </form>
    </main>
  );
}
