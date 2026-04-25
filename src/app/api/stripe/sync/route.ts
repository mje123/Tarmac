import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('users')
    .select('stripe_customer_id, subscription_status')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ status: profile?.subscription_status || 'free' })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

  const subscriptions = await stripe.subscriptions.list({
    customer: profile.stripe_customer_id,
    status: 'all',
    limit: 5,
  })

  const active = subscriptions.data.find(s =>
    s.status === 'active' || s.status === 'trialing'
  )

  if (!active) {
    return NextResponse.json({ status: profile.subscription_status })
  }

  const newStatus = active.status === 'trialing' ? 'trialing' : 'study_pass'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodEndTs = (active as any).current_period_end ?? (active as any).items?.data?.[0]?.current_period_end
  const periodEnd = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null

  await admin.from('users').update({
    subscription_status: newStatus,
    subscription_expires_at: periodEnd,
    updated_at: new Date().toISOString(),
  }).eq('id', user.id)

  return NextResponse.json({ status: newStatus })
}
