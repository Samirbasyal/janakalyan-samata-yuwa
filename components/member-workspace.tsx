"use client";
import { useEffect, useState } from "react";

type Item = {
  id: string;
  itemType: string;
  title: string;
  details?: string | null;
  eventDate?: string | null;
  isPublic: boolean;
};
const types = [
  ["note", "Notes"],
  ["work", "My work"],
  ["plan", "Tomorrow plan"],
  ["achievement", "Achievements"],
] as const;
export function MemberWorkspace() {
  const [items, setItems] = useState<Item[]>([]);
  const [type, setType] = useState("note");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [message, setMessage] = useState("");
  async function load() {
    const r = await fetch("/api/member/workspace", { cache: "no-store" });
    if (r.ok) setItems((await r.json()).items);
  }
  useEffect(() => {
    load();
  }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/member/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemType: type, title, details, isPublic }),
    });
    if (r.ok) {
      setTitle("");
      setDetails("");
      setMessage("Saved");
      load();
    }
  }
  async function remove(id: string) {
    await fetch("/api/member/workspace", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }
  return (
    <section className="space-y-5 rounded-2xl border bg-card p-5">
      <div>
        <p className="text-sm font-semibold text-primary">My workspace</p>
        <h2 className="text-xl font-bold">Notes, work, plans & achievements</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep your own record. Achievements can be shared publicly.
        </p>
      </div>
      <form
        onSubmit={save}
        className="grid gap-3 rounded-xl bg-secondary/50 p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-xl border bg-background px-3 py-2 text-sm"
          >
            {types.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="rounded-xl border bg-background px-3 py-2 text-sm"
          />
        </div>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Details"
          className="min-h-20 rounded-xl border bg-background px-3 py-2 text-sm"
        />
        {type === "achievement" && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />{" "}
            Show this achievement publicly
          </label>
        )}
        <button className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          Add record
        </button>
        {message && <p className="text-xs text-primary">{message}</p>}
      </form>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-primary">
                  {types.find(([value]) => value === item.itemType)?.[1] ??
                    item.itemType}
                </p>
                <h3 className="font-bold">{item.title}</h3>
              </div>
              <button
                onClick={() => remove(item.id)}
                className="text-xs text-destructive"
              >
                Delete
              </button>
            </div>
            {item.details && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {item.details}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
