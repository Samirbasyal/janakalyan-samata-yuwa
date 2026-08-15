import { toNextJsHandler } from 'better-auth/next-js'

export const dynamic = 'force-dynamic'

async function handler(request: Request) {
  const { auth } = await import('@/lib/auth')
  const { GET, POST } = toNextJsHandler(auth.handler)
  return request.method === 'GET' ? GET(request) : POST(request)
}

export const GET = handler
export const POST = handler
