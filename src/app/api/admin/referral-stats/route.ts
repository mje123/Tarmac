import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('users').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: users } = await admin
    .from('users')
    .select('onboarding_data')
    .not('onboarding_data', 'is', null)

  const counts: Record<string, number> = {}
  let total = 0

  for (const u of users ?? []) {
    const source = (u.onboarding_data as Record<string, string> | null)?.referral_source
    if (source && source !== 'skipped') {
      counts[source] = (counts[source] || 0) + 1
      total++
    }
  }

  const labels: Record<string, string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    google: 'Google / Search',
    reddit: 'Reddit',
    friend: 'Friend / Classmate',
    cfi: 'Flight Instructor',
    other: 'Other',
  }

  const results = Object.entries(counts)
    .map(([key, count]) => ({ key, label: labels[key] || key, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({ results, total })
}
