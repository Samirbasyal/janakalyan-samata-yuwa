import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { CommunityDashboard } from '@/components/community-dashboard'

export const dynamic = 'force-dynamic'

export default async function CommunityDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/community-login')
  return <CommunityDashboard />
}
