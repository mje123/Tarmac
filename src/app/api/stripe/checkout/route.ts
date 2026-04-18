import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const priceId = process.env.STRIPE_STUDY_PASS_PRICE_ID!
    console.log('Creating checkout — priceId:', priceId, 'userId:', user.id)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://tarmac.study/dashboard?checkout=success',
      cancel_url: 'https://tarmac.study',
      allow_promotion_codes: true,
      metadata: { userId: user.id },
    })

    console.log('Session created:', session.id, 'url:', session.url)

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
