"use client";

import { useEffect, useState } from "react";

export function PaymentQrSettings({
  onNotice,
}: {
  onNotice: (message: string) => void;
}) {
  const [settings, setSettings] = useState<{
    bankQrUrl: string | null;
    esewaQrUrl: string | null;
  }>({ bankQrUrl: null, esewaQrUrl: null });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/admin/payment-settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setSettings(data));
  }, []);
  async function upload(key: "bankQrUrl" | "esewaQrUrl", file: File) {
    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    const uploadResponse = await fetch("/api/admin/upload", {
      method: "POST",
      body: form,
    });
    const uploaded = await uploadResponse.json();
    if (!uploadResponse.ok) {
      onNotice(uploaded.error || "QR upload failed.");
      setBusy(false);
      return;
    }
    const next = { ...settings, [key]: uploaded.url };
    const saveResponse = await fetch("/api/admin/payment-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setBusy(false);
    if (!saveResponse.ok) {
      onNotice("QR setting could not be saved.");
      return;
    }
    setSettings(next);
    onNotice(`${key === "bankQrUrl" ? "Bank" : "eSewa"} QR saved.`);
  }
  return (
    <section className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Payment setup
        </p>
        <h2 className="mt-1 text-xl font-bold">Bank र eSewa QR</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Donor ले payment method छान्दा सम्बन्धित QR homepage मा देखिन्छ।
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["bankQrUrl", "Bank QR"],
            ["esewaQrUrl", "eSewa QR"],
          ] as const
        ).map(([key, label]) => (
          <label
            key={key}
            className="grid gap-3 rounded-xl border border-dashed p-4 text-sm font-bold"
          >
            {label}
            <input
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(event) =>
                event.target.files?.[0] && upload(key, event.target.files[0])
              }
              className="text-sm font-normal"
            />
            {settings[key] && (
              <img
                src={settings[key]!}
                alt={`${label} preview`}
                className="max-h-48 w-full rounded-lg object-contain"
              />
            )}
          </label>
        ))}
      </div>
    </section>
  );
}
