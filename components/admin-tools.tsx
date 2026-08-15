"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  FileText,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

type Note = {
  id: string;
  title: string;
  content: string;
  visibility?: "public" | "admin";
  createdAt?: string;
  updatedAt?: string;
};
type Row = Record<string, unknown>;

export function AdminTools({
  rows,
  module,
  onNotice,
  onRefresh,
}: {
  rows: Row[];
  module: string;
  onNotice: (message: string) => void;
  onRefresh: () => void;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [active, setActive] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "admin">("admin");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadNotes() {
    const response = await fetch("/api/admin/notes", { cache: "no-store" });
    if (response.ok) setNotes(await response.json());
  }
  useEffect(() => {
    loadNotes();
  }, []);
  const visibleNotes = useMemo(
    () =>
      notes.filter((note) =>
        `${note.title} ${note.content}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [notes, search],
  );
  function newNote() {
    setActive(null);
    setTitle("");
    setContent("");
    setVisibility("admin");
  }
  function selectNote(note: Note) {
    setActive(note);
    setTitle(note.title);
    setContent(note.content);
    setVisibility(note.visibility === "public" ? "public" : "admin");
  }
  async function saveNote() {
    if (!title.trim() || !content.trim()) {
      onNotice("Note title and content are required.");
      return;
    }
    setSaving(true);
    const response = await fetch("/api/admin/notes", {
      method: active ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: active?.id,
        title: title.trim(),
        content: content.trim(),
        visibility,
      }),
    });
    setSaving(false);
    if (!response.ok) {
      onNotice("Note could not be saved.");
      return;
    }
    const saved = await response.json();
    setNotes((current) =>
      active
        ? current.map((note) => (note.id === saved.id ? saved : note))
        : [saved, ...current],
    );
    setActive(saved);
    onNotice(
      visibility === "public"
        ? "Note saved. यो note website को announcement/notice section मा पनि देखिन्छ।"
        : "Note saved (Admin only).",
    );
  }
  async function deleteNote() {
    if (!active || !window.confirm(`Delete “${active.title}”?`)) return;
    const response = await fetch("/api/admin/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: active.id }),
    });
    if (response.ok) {
      setNotes((current) => current.filter((note) => note.id !== active.id));
      newNote();
      onNotice("Note deleted.");
    }
  }
  function downloadExcel() {
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, module.slice(0, 31));
    XLSX.writeFile(book, `club-${module}.xlsx`);
    onNotice("Excel file downloaded.");
  }
  function importExcel(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const workbook = XLSX.read(reader.result, { type: "array" });
      const data = XLSX.utils.sheet_to_json<Row>(
        workbook.Sheets[workbook.SheetNames[0]],
      );
      const endpoint =
        module === "donations"
          ? "/api/admin/donations"
          : `/api/admin/records?kind=${module}`;
      Promise.all(
        data.map((row) =>
          fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(row),
          }),
        ),
      ).then((responses) => {
        const failed = responses.filter((response) => !response.ok).length;
        onNotice(
          failed
            ? `${data.length - failed} imported, ${failed} rows need correction.`
            : `${data.length} rows imported successfully.`,
        );
        onRefresh();
      });
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-secondary/20 px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Private admin workspace
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-bold">
            <FileText className="size-5" /> Notes & Excel
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Public notes automatically appear on the website announcement/notice
            section. Admin-only notes stay inside the admin panel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadExcel}
            className="rounded-lg border bg-background px-3 py-2 text-sm font-bold"
          >
            <FileSpreadsheet className="mr-2 inline size-4" />
            Export Excel
          </button>
          <label className="cursor-pointer rounded-lg border bg-background px-3 py-2 text-sm font-bold">
            <Upload className="mr-2 inline size-4" />
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={(event) =>
                event.target.files?.[0] && importExcel(event.target.files[0])
              }
            />
          </label>
        </div>
      </header>
      <div className="grid min-h-[360px] lg:grid-cols-[280px_1fr]">
        <aside className="border-b bg-secondary/10 p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold">All notes</h3>
              <p className="text-xs text-muted-foreground">
                {notes.length} saved
              </p>
            </div>
            <button
              type="button"
              onClick={newNote}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
            >
              <Plus className="mr-1 inline size-4" />
              New note
            </button>
          </div>
          <label className="mb-3 flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {visibleNotes.map((note) => (
              <button
                type="button"
                key={note.id}
                onClick={() => selectNote(note)}
                className={`w-full rounded-lg border p-3 text-left ${active?.id === note.id ? "border-primary bg-primary/10" : "bg-background"}`}
              >
                <p className="truncate text-sm font-bold">{note.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {note.content}
                </p>
                <span
                  className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${note.visibility === "public" ? "bg-accent/20 text-accent-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {note.visibility === "public" ? "Public" : "Admin only"}
                </span>
              </button>
            ))}
            {!visibleNotes.length && (
              <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                No saved notes yet.
              </p>
            )}
          </div>
        </aside>
        <div className="flex flex-col p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {active ? "Editing note" : "New note"}
              </p>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Note title"
                className="mt-1 w-full bg-transparent text-2xl font-bold outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as "public" | "admin")}
                className="rounded-lg border bg-background px-3 py-2 text-sm font-semibold"
                aria-label="Note visibility"
              >
                <option value="admin">Admin only</option>
                <option value="public">Public (website notice)</option>
              </select>
              <button
                type="button"
                onClick={saveNote}
                disabled={saving}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                <Save className="mr-1 inline size-4" />
                {saving ? "Saving…" : "Save"}
              </button>
              {active && (
                <button
                  type="button"
                  onClick={deleteNote}
                  className="rounded-lg border px-3 py-2 text-sm font-bold text-destructive"
                >
                  <Trash2 className="mr-1 inline size-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Start writing your note here…"
            className="min-h-[260px] flex-1 resize-y rounded-xl border bg-background p-4 text-sm leading-7 outline-none focus:border-primary"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Tip: use one note per meeting, donor follow-up, loan agreement, or
            task.
          </p>
        </div>
      </div>
    </section>
  );
}
