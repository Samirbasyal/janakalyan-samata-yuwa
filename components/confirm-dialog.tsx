'use client'

import { AlertTriangle } from 'lucide-react'

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[110] grid place-items-center bg-foreground/45 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${danger ? 'bg-destructive/10 text-destructive' : 'bg-accent/20 text-accent-foreground'}`}>
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border px-4 py-2.5 text-sm font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white ${danger ? 'bg-destructive' : 'bg-primary'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
