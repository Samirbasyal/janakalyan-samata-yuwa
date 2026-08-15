"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type RecordItem = {
  id: string;
  memberName: string;
  position: string;
  responsibilities: string | null;
  workDetails: string | null;
  workCount: number;
  achievements: string | null;
};
const empty = {
  memberName: "",
  position: "",
  responsibilities: "",
  workDetails: "",
  workCount: 0,
  achievements: "",
};

export function CommitteeManagement() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const load = async () => {
    const response = await fetch("/api/admin/committee", { cache: "no-store" });
    if (response.ok) setRecords(await response.json());
  };
  useEffect(() => {
    load();
  }, []);
  const save = async () => {
    const response = await fetch("/api/admin/committee", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { ...form, id: editing } : form),
    });
    if (response.ok) {
      setForm(empty);
      setEditing(null);
      setNotice("कार्यसमिति record saved");
      await load();
    } else setNotice("Save गर्न सकिएन");
  };
  const remove = async (id: string) => {
    if (!window.confirm("यो record delete गर्ने?")) return;
    await fetch("/api/admin/committee", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">कार्यसमिति</h2>
          <p className="text-sm text-muted-foreground">
            Admin-only committee work and achievement control
          </p>
        </div>
        {notice && <p className="text-sm text-primary">{notice}</p>}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <input
          value={form.memberName}
          onChange={(e) => setForm({ ...form, memberName: e.target.value })}
          placeholder="Member name"
          className="rounded-xl border bg-background px-3 py-2"
        />
        <input
          value={form.position}
          onChange={(e) => setForm({ ...form, position: e.target.value })}
          placeholder="Position"
          className="rounded-xl border bg-background px-3 py-2"
        />
        <textarea
          value={form.responsibilities}
          onChange={(e) =>
            setForm({ ...form, responsibilities: e.target.value })
          }
          placeholder="What is their responsibility?"
          className="min-h-20 rounded-xl border bg-background px-3 py-2"
        />
        <textarea
          value={form.workDetails}
          onChange={(e) => setForm({ ...form, workDetails: e.target.value })}
          placeholder="Work details"
          className="min-h-20 rounded-xl border bg-background px-3 py-2"
        />
        <input
          type="number"
          min="0"
          value={form.workCount}
          onChange={(e) =>
            setForm({ ...form, workCount: Number(e.target.value) })
          }
          placeholder="Completed work count"
          className="rounded-xl border bg-background px-3 py-2"
        />
        <textarea
          value={form.achievements}
          onChange={(e) => setForm({ ...form, achievements: e.target.value })}
          placeholder="Achievements"
          className="min-h-20 rounded-xl border bg-background px-3 py-2"
        />
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={save}>
          {editing ? "Update record" : "Add member"}
        </Button>
        {editing && (
          <Button
            variant="outline"
            onClick={() => {
              setEditing(null);
              setForm(empty);
            }}
          >
            Cancel
          </Button>
        )}
      </div>
      <div className="mt-6 grid gap-3">
        {records.map((record) => (
          <article
            key={record.id}
            className="rounded-xl border border-border p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  {record.position}
                </p>
                <h3 className="text-lg font-bold">{record.memberName}</h3>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(record.id);
                    setForm({
                      memberName: record.memberName,
                      position: record.position,
                      responsibilities: record.responsibilities ?? "",
                      workDetails: record.workDetails ?? "",
                      workCount: record.workCount,
                      achievements: record.achievements ?? "",
                    });
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => remove(record.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              <p>
                <strong>Responsibilities:</strong>{" "}
                {record.responsibilities || "—"}
              </p>
              <p>
                <strong>Completed work:</strong> {record.workCount}
              </p>
              <p>
                <strong>Work:</strong> {record.workDetails || "—"}
              </p>
              <p>
                <strong>Achievements:</strong> {record.achievements || "—"}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
