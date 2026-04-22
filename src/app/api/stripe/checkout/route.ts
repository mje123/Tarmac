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
        // Beta mode: always use the beta monthly price
        priceId = process.env.STRIPE_BETA_MONTHLY_PRICE_ID!
      } else {
        priceId = (body.plan && FULL_PLAN_PRICE_MAP[body.plan]) || body.priceId || process.env.STRIPE_STUDY_PASS_PRICE_ID!
      }
    } catch {
      priceId = isBeta ? process.env.STRIPE_BETA_MONTHLY_PRICE_ID! : process.env.STRIPE_STUDY_PASS_PRICE_ID!
    }

    const mode = SUBSCRIPTION_PRICE_IDS.has(priceId) ? 'subscription' : 'payment'

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://tarmac.study/dashboard?checkout=success',
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
