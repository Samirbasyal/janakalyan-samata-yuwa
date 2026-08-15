"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function ActionModal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-foreground/45 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-modal-title"
        className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-2xl outline-none sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="action-modal-title"
            className="font-serif text-2xl font-bold text-balance"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close popup"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-5 leading-6 text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
