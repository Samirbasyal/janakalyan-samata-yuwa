"use client";
import { useEffect, useMemo, useState } from "react";

type Visibility = "public" | "members" | "private" | "admin";
type Row = {
  id: string;
  entityType: string;
  recordId: string;
  name?: string;
  visibility: Visibility;
  updatedAt: string;
};

const labels: Record<string, string> = {
  donation: "Donation",
  member: "Member",
  expense: "Expense",
  content: "Content",
  gallery: "Gallery",
  announcement: "Announcement",
  program: "Program",
  work: "Work",
  loan: "Loan",
  monthly_fund: "Monthly fund",
  note: "Admin note",
  committee: "Committee",
  club_record: "Club record",
};

export function VisibilityControlPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<"all" | Visibility>("all");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const load = async () => {
    const response = await fetch("/api/admin/visibility", {
      cache: "no-store",
    });
    if (response.ok) setRows(await response.json());
  };
  useEffect(() => {
    load();
  }, []);
  const visible = useMemo(
    () =>
      rows.filter(
        (row) =>
          (filter === "all" || row.visibility === filter) &&
          `${row.entityType} ${row.name ?? ""} ${row.recordId}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [rows, filter, query],
  );
  const update = async (row: Row, visibility: Visibility) => {
    if (
      visibility === "public" &&
      ["donation", "member", "expense", "loan", "note", "monthly_fund"].includes(row.entityType) &&
      !window.confirm(
        "This may expose sensitive information publicly. Continue?",
      )
    )
      return;
    const response = await fetch("/api/admin/visibility", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: row.entityType,
        recordId: row.recordId,
        visibility,
      }),
    });
    if (response.ok) {
      setNotice(
        `${labels[row.entityType] ?? row.entityType} is now ${visibility === "admin" ? "Only admin" : visibility === "members" ? "Members only" : visibility}`,
      );
      await load();
      setTimeout(() => setNotice(""), 2500);
    }
  };
  return (
    <section className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Admin control
          </p>
          <h2 className="mt-1 text-xl font-bold">Visibility control</h2>
          <p className="text-sm text-muted-foreground">
            Choose what visitors and members can see.
          </p>
        </div>
        {notice && (
          <span className="dashboard-toast rounded-full bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
            {notice}
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search records"
          className="min-w-48 flex-1 rounded-xl border bg-background px-3 py-2 text-sm"
        />
        {(["all", "public", "members", "private", "admin"] as const).map(
          (item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${filter === item ? "bg-primary text-primary-foreground" : "bg-background"}`}
            >
              {item === "all"
                ? "All"
                : item === "members"
                  ? "Members only"
                  : item[0].toUpperCase() + item.slice(1)}
            </button>
          ),
        )}
      </div>
      <div className="mt-4 grid gap-2">
        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
            No visibility records yet. Use a record action below to create one.
          </p>
        ) : (
          visible.map((row) => (
            <div
              key={`${row.entityType}:${row.recordId}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
            >
              <div>
                <p className="font-semibold">
                  {labels[row.entityType] ?? row.entityType} ·{" "}
                  {row.name || row.recordId}
                </p>
                <p className="text-xs text-muted-foreground">
                  ID: {row.recordId}
                </p>
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(row.updatedAt).toLocaleString()}
                </p>
              </div>
              <select
                value={row.visibility}
                onChange={(event) =>
                  update(row, event.target.value as Visibility)
                }
                className="rounded-lg border bg-background px-3 py-2 text-sm font-semibold"
              >
                <option value="public">Public</option>
                <option value="members">Members only</option>
                <option value="private">Private</option>
                <option value="admin">Only admin</option>
              </select>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
