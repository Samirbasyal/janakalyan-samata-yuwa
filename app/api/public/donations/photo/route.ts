import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'

const MAX_SIZE = 5 * 1024 * 1024
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('photo')
    if (!(file instanceof File)) return NextResponse.json({ error: 'Photo is required' }, { status: 400 })
    if (!TYPES.has(file.type)) return NextResponse.json({ error: 'Use JPG, PNG, or WebP' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Photo must be 5MB or smaller' }, { status: 400 })
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-80)
    const blob = await put(`donor-photos/${crypto.randomUUID()}-${safeName}`, file, { access: 'public', addRandomSuffix: false })
    return NextResponse.json({ url: blob.url, pathname: blob.pathname })
  } catch {
    return NextResponse.json({ error: 'Photo upload failed' }, { status: 500 })
  }
}
