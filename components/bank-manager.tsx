'use client'

import { useEffect, useState } from 'react'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'

type Bank = {
  id: string
  name: string
  accountHolder: string | null
  accountNumber: string | null
  qrUrl: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

const empty: Bank = { id: '', name: '', accountHolder: '', accountNumber: '', qrUrl: null, isActive: true }

export function BankManager({ onNotice }: { onNotice: (message: string, type?: 'success' | 'error') => void }) {
  const [banks, setBanks] = useState<Bank[]>([])
  const [form, setForm] = useState<Bank>(empty)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)

  async function load() {
    const res = await fetch('/api/admin/banks', { cache: 'no-store' })
    if (res.ok) setBanks(await res.json())
  }
  useEffect(() => { load() }, [])

  async function uploadQr(file: File): Promise<string | null> {
    const upload = new FormData()
    upload.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: upload })
    const body = await res.json()
    if (!res.ok) {
      onNotice(body.error || 'QR upload failed.', 'error')
      return null
    }
    return body.url
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim()) { onNotice('Bank name is required.', 'error'); return }
    setBusy(true)
    const file = (event.currentTarget.elements.namedItem('qrFile') as HTMLInputElement)?.files?.[0]
    let qrUrl = form.qrUrl
    if (file) {
      const uploaded = await uploadQr(file)
      if (!uploaded) { setBusy(false); return }
      qrUrl = uploaded
    }
    const res = await fetch('/api/admin/banks', {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editing ? form.id : undefined,
        name: form.name,
        accountHolder: form.accountHolder,
        accountNumber: form.accountNumber,
        qrUrl,
        isActive: form.isActive,
      }),
    })
    setBusy(false)
    if (!res.ok) { onNotice('Bank could not be saved.', 'error'); return }
    onNotice(editing ? 'Bank updated.' : 'Bank added. QR अब payment form मा देखिन्छ।')
    setForm(empty)
    setEditing(false)
    await load()
  }

  async function remove(bank: Bank) {
    if (!window.confirm(`Delete ${bank.name}?`)) return
    const res = await fetch('/api/admin/banks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bank.id }),
    })
    if (res.ok) { onNotice('Bank deleted.'); await load() }
  }

  async function toggleActive(bank: Bank) {
    const res = await fetch('/api/admin/banks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bank.id, isActive: !bank.isActive }),
    })
    if (res.ok) { onNotice(bank.isActive ? `${bank.name} लाई inactive गरियो।` : `${bank.name} active गरियो।`); await load() }
  }

  return (
    <section className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Payment setup</p>
          <h2 className="text-xl font-bold">Bank accounts & QR codes</h2>
          <p className="text-sm text-muted-foreground">
            जति banks भए पनि थप्नुहोस् — payment form मा bank select गर्दा त्यसकै QR देखिन्छ।
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setForm(empty); setEditing(false) }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          <Plus className="size-4" /> Add bank
        </button>
        <button type="button" onClick={load} className="rounded-xl border p-3" aria-label="Refresh banks">
          <RefreshCw className={`size-4 ${busy ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <form onSubmit={save} className="mt-5 grid gap-3 rounded-xl border bg-muted/20 p-4 md:grid-cols-2">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Bank name (e.g. Nepal Bank Limited)"
          className="rounded-lg border p-3"
        />
        <input
          value={form.accountHolder ?? ''}
          onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
          placeholder="Account holder name"
          className="rounded-lg border p-3"
        />
        <input
          value={form.accountNumber ?? ''}
          onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
          placeholder="Account number"
          className="rounded-lg border p-3"
        />
        <label className="grid gap-1 text-sm font-semibold">
          QR image
          <input name="qrFile" type="file" accept="image/*" className="rounded-lg border bg-background p-2 text-sm font-normal" />
        </label>
        {form.qrUrl && (
          <div className="md:col-span-2">
            <img src={form.qrUrl} alt="Bank QR preview" className="max-h-40 rounded-lg border object-contain" />
          </div>
        )}
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Active (public payment forms ma देखिने)
        </label>
        <div className="flex gap-2 md:col-span-2">
          <button disabled={busy} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">
            {editing ? 'Update bank' : 'Save bank'}
          </button>
          {editing && (
            <button type="button" onClick={() => { setForm(empty); setEditing(false) }} className="rounded-xl border px-4 py-2.5 text-sm font-bold">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {banks.length === 0 && (
          <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground md:col-span-2">
            No banks yet. Add your first bank above — its QR will appear on the donation and member payment forms.
          </p>
        )}
        {banks.map((bank) => (
          <article key={bank.id} className={`rounded-xl border p-4 ${bank.isActive ? '' : 'opacity-55'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{bank.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {bank.accountHolder || '—'} {bank.accountNumber ? `· ${bank.accountNumber}` : ''}
                </p>
                <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${bank.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {bank.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {bank.qrUrl && <img src={bank.qrUrl} alt={`${bank.name} QR`} className="size-16 rounded-lg border object-contain" />}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => { setForm(bank); setEditing(true) }}
                className="rounded-lg border px-3 py-1.5 text-xs font-bold"
              >
                <Pencil className="mr-1 inline size-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={() => toggleActive(bank)}
                className="rounded-lg border px-3 py-1.5 text-xs font-bold"
              >
                {bank.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                type="button"
                onClick={() => remove(bank)}
                className="rounded-lg border px-3 py-1.5 text-xs font-bold text-destructive"
              >
                <Trash2 className="mr-1 inline size-3.5" /> Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
