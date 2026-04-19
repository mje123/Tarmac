import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        if (!userId) break

        const customerId = session.customer as string
        let periodEnd: string | null = null

        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const periodEndTs = (sub as any).current_period_end ?? (sub as any).items?.data?.[0]?.current_period_end
          if (periodEndTs) periodEnd = new Date(periodEndTs * 1000).toISOString()
        }

        await supabase.from('users').update({
          subscription_status: 'study_pass',
          stripe_customer_id: customerId,
          subscription_expires_at: periodEnd,
          updated_at: new Date().toISOString(),
        }).eq('id', userId)

        // Track influencer referral if a promo code was used
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const discounts = (session as any).total_details?.breakdown?.discounts ?? (session as any).discounts ?? []
        const promoCode = discounts?.[0]?.discount?.promotion_code
        if (promoCode) {
          const promoDetails = await stripe.promotionCodes.retrieve(promoCode as string)
          const code = promoDetails.code?.toUpperCase()
          if (code) {
            const { data: influencer } = await supabase
              .from('influencers')
              .select('id')
              .eq('promo_code', code)
              .single()
            if (influencer) {
              const { error: refError } = await supabase.from('influencer_referrals').insert({
                influencer_id: influencer.id,
                user_id: userId,
                promo_code: code,
                amount_cents: 3499,
              })
              if (refError) {
                console.error('influencer_referrals insert failed:', refError.message, { influencer_id: influencer.id, userId, code })
              } else {
                console.log('Influencer referral recorded:', { code, influencer_id: influencer.id, userId })
              }
            } else {
              console.log('Promo code used but no matching influencer found:', code)
            }
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const isActive = sub.status === 'active' || sub.status === 'trialing'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const periodEndTs = (sub as any).current_period_end ?? (sub as any).items?.data?.[0]?.current_period_end
        const periodEnd = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null

        await supabase.from('users').update({
          subscription_status: isActive ? 'study_pass' : 'free',
          subscription_expires_at: isActive ? periodEnd : null,
          updated_at: new Date().toISOString(),
        }).eq('stripe_customer_id', customerId)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        await supabase.from('users').update({
          subscription_status: 'free',
          subscription_expires_at: null,
          updated_at: new Date().toISOString(),
        }).eq('stripe_customer_id', customerId)
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
