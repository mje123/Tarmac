import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('stripe_customer_id, email').eq('id', user.id).single()

    let customerId = profile?.stripe_customer_id

    // Fallback: look up by email if no customer ID saved in DB
    if (!customerId && (profile?.email || user.email)) {
      const email = profile?.email || user.email!
      const existing = await stripe.customers.list({ email, limit: 1 })
      if (existing.data.length > 0) {
        customerId = existing.data[0].id
        // Save it back so future calls are fast
        const admin = createAdminClient()
        await admin.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id)
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: 'No billing account found. Contact support@tarmac.study' }, { status: 400 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'https://tarmac.study/settings',
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Stripe portal error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
