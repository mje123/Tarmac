import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('users').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: stuckUsers } = await admin
    .from('users')
    .select('id, email, stripe_customer_id')
    .eq('subscription_status', 'free')
    .not('stripe_customer_id', 'is', null)

  if (!stuckUsers?.length) return NextResponse.json({ fixed: 0, message: 'No stuck users found' })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
  const results: { email: string; result: string }[] = []

  for (const u of stuckUsers) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: u.stripe_customer_id!,
        status: 'all',
        limit: 5,
      })

      const active = subs.data.find(s => s.status === 'active' || s.status === 'trialing')
      if (!active) {
        results.push({ email: u.email, result: 'no active subscription — left as free' })
        continue
      }

      const newStatus = active.status === 'trialing' ? 'trialing' : 'study_pass'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const periodEndTs = (active as any).current_period_end ?? (active as any).items?.data?.[0]?.current_period_end
      const periodEnd = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null

      await admin.from('users').update({
        subscription_status: newStatus,
        subscription_expires_at: periodEnd,
        updated_at: new Date().toISOString(),
      }).eq('id', u.id)

      results.push({ email: u.email, result: `fixed → ${newStatus}` })
    } catch (e) {
      results.push({ email: u.email, result: `error: ${e instanceof Error ? e.message : e}` })
    }
  }

  return NextResponse.json({ fixed: results.filter(r => r.result.startsWith('fixed')).length, results })
}
