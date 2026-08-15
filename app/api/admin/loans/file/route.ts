import { get } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const pathname = new URL(request.url).searchParams.get('pathname')
  if (!pathname) return NextResponse.json({ error: 'Missing file path' }, { status: 400 })
  try {
    const result = await get(pathname, { access: 'private' })
    if (!result) return new NextResponse('Not found', { status: 404 })
    return new NextResponse(result.stream, { headers: { 'Content-Type': result.blob.contentType, 'Cache-Control': 'private, no-cache' } })
  } catch { return NextResponse.json({ error: 'Could not open agreement photo.' }, { status: 404 }) }
}
