import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { isBeta } from '@/lib/pricing'

// Full-pricing plan → price ID map
const FULL_PLAN_PRICE_MAP: Record<string, string | undefined> = {
  monthly:          process.env.STRIPE_MONTHLY_PRICE_ID,
  quick_prep:       process.env.STRIPE_QUICK_PREP_PRICE_ID,
  study_pass:       process.env.STRIPE_STUDY_PASS_PRICE_ID,
  founding_member:  process.env.STRIPE_FOUNDING_MEMBER_PRICE_ID,
}

const SUBSCRIPTION_PRICE_IDS = new Set([
  process.env.STRIPE_MONTHLY_PRICE_ID,
  process.env.STRIPE_BETA_MONTHLY_PRICE_ID,
])

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let priceId: string
    try {
      const body = await request.json()
      if (isBeta) {
        priceId = process.env.STRIPE_BETA_MONTHLY_PRICE_ID!
      } else {
        priceId = (body.plan && FULL_PLAN_PRICE_MAP[body.plan]) || body.priceId || process.env.STRIPE_STUDY_PASS_PRICE_ID!
      }
    } catch {
      priceId = isBeta ? process.env.STRIPE_BETA_MONTHLY_PRICE_ID! : process.env.STRIPE_STUDY_PASS_PRICE_ID!
    }

    if (!priceId) {
      console.error('Checkout error: priceId is undefined. Set STRIPE_BETA_MONTHLY_PRICE_ID in env.')
      return NextResponse.json({ error: 'Payment configuration error — contact support.' }, { status: 500 })
    }

    // Pre-create or reuse Stripe customer so stripe_customer_id is set before redirect
    const { data: userProfile } = await supabase.from('users').select('stripe_customer_id, email').eq('id', user.id).single()
    let customerId = userProfile?.stripe_customer_id ?? null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userProfile?.email || user.email || '',
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const mode = SUBSCRIPTION_PRICE_IDS.has(priceId) ? 'subscription' : 'payment'

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://tarmac.study/checkout/success',
      cancel_url: 'https://tarmac.study/#pricing',
      allow_promotion_codes: true,
      metadata: { userId: user.id, priceId },
    }

    // Add 7-day free trial for beta subscription
    if (isBeta && mode === 'subscription') {
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
