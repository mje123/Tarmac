import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const priceId = process.env.STRIPE_BETA_MONTHLY_PRICE_ID!
    if (!priceId) {
      console.error('Checkout error: STRIPE_BETA_MONTHLY_PRICE_ID is not set.')
      return NextResponse.json({ error: 'Payment configuration error — contact support.' }, { status: 500 })
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    let customerId = userProfile?.stripe_customer_id ?? null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userProfile?.email || user.email || '',
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://tarmac.study/checkout/success',
      cancel_url: 'https://tarmac.study/#pricing',
      allow_promotion_codes: true,
      metadata: { userId: user.id, priceId },
    }

    // 7-day free trial for first-time customers only
    const priorSubs = await stripe.subscriptions.list({ customer: customerId, limit: 1, status: 'all' })
    if (priorSubs.data.length === 0) {
      sessionParams.subscription_data = { trial_period_days: 7 }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    if (!session.url) {
      return NextResponse.json({ error: 'Stripe returned no URL — check Vercel logs' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Stripe checkout error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
