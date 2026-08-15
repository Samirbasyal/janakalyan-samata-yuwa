import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: 'File is required.' }, { status: 400 })
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 })
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Image must be under 8MB.' }, { status: 400 })
    const blob = await put(`club/${session.user.id}/${crypto.randomUUID()}-${file.name}`, file, { access: 'public', addRandomSuffix: false })
    return NextResponse.json({ url: blob.url, pathname: blob.pathname })
  } catch { return NextResponse.json({ error: 'Upload failed or unauthorized.' }, { status: 401 }) }
}
