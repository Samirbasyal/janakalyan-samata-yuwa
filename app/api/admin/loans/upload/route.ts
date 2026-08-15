import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'Please choose an agreement photo.' }, { status: 400 })
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 })
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Photo must be smaller than 8MB.' }, { status: 400 })
    const blob = await put(`loan-agreements/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`, file, { access: 'private', addRandomSuffix: false })
    return NextResponse.json({ pathname: blob.pathname })
  } catch (error) {
    console.error('[v0] agreement photo upload failed', error)
    return NextResponse.json({ error: 'Agreement photo upload failed.' }, { status: 500 })
  }
}
