import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTrialStartEmail } from '@/lib/email'
import { SupabaseClient } from '@supabase/supabase-js'

const MS_PER_DAY = 24 * 60 * 60 * 1000

function expiryForPriceId(priceId: string): string | null {
  const now = Date.now()
  if (priceId === process.env.STRIPE_QUICK_PREP_PRICE_ID)      return new Date(now + 60 * MS_PER_DAY).toISOString()
  if (priceId === process.env.STRIPE_STUDY_PASS_PRICE_ID)       return new Date(now + 90 * MS_PER_DAY).toISOString()
  if (priceId === process.env.STRIPE_FOUNDING_MEMBER_PRICE_ID)  return null // lifetime
  return new Date(now + 90 * MS_PER_DAY).toISOString()
}

async function recordReferral(
  supabase: SupabaseClient,
  code: string,
  userId: string,
  amountCents: number
) {
  const { data: influencer } = await supabase
    .from('influencers')
    .select('id')
    .eq('promo_code', code)
    .single()
  if (!influencer) {
    console.log('No influencer found for promo code:', code)
    return
  }

  // Only record one referral per user (first real payment)
  const { data: existing } = await supabase
    .from('influencer_referrals')
    .select('id')
    .eq('user_id', userId)
    .eq('influencer_id', influencer.id)
    .single()

  if (existing) {
    console.log('Referral already recorded for user:', userId)
    return
  }

  const { error } = await supabase.from('influencer_referrals').insert({
    influencer_id: influencer.id,
    user_id: userId,
    promo_code: code,
    amount_cents: amountCents,
    commission_paid: false,
  })

  if (error) {
    console.error('influencer_referrals insert failed:', error.message, { influencer_id: influencer.id, userId, code })
  } else {
    console.log('Influencer referral recorded:', { code, influencer_id: influencer.id, userId, amountCents })
  }
}

async function extractPromoCode(
  stripe: Stripe,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any
): Promise<string | null> {
  const discounts = session.total_details?.breakdown?.discounts ?? session.discounts ?? []
  const promoCodeId = discounts?.[0]?.discount?.promotion_code
  if (!promoCodeId) return null
  try {
    const promoDetails = await stripe.promotionCodes.retrieve(promoCodeId as string)
    return promoDetails.code?.toUpperCase() ?? null
  } catch {
    return null
  }
}

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
        const priceId = session.metadata?.priceId
        if (!userId) break

        const customerId = session.customer as string
        let periodEnd: string | null = null
        let subStatus: string = 'study_pass'

        if (session.mode === 'subscription' && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const periodEndTs = (sub as any).current_period_end ?? (sub as any).items?.data?.[0]?.current_period_end
          if (periodEndTs) periodEnd = new Date(periodEndTs * 1000).toISOString()
          subStatus = sub.status === 'trialing' ? 'trialing' : 'study_pass'

          // Store promo code in subscription metadata so invoice.payment_succeeded can track it
          const code = await extractPromoCode(stripe, session)
          if (code) {
            await stripe.subscriptions.update(session.subscription as string, {
              metadata: { referral_promo_code: code, referral_user_id: userId },
            })
            console.log('Stored referral promo code in subscription metadata:', { code, userId })
          }
        } else if (session.mode === 'payment' && priceId) {
          periodEnd = expiryForPriceId(priceId)
          // One-time payments: track immediately (no trial, real amount)
          if ((session.amount_total ?? 0) > 0) {
            const code = await extractPromoCode(stripe, session)
            if (code) await recordReferral(supabase, code, userId, session.amount_total!)
          }
        }

        await supabase.from('users').update({
          subscription_status: subStatus,
          stripe_customer_id: customerId,
          subscription_expires_at: periodEnd,
          updated_at: new Date().toISOString(),
        }).eq('id', userId)

        // Send trial-start email
        if (subStatus === 'trialing') {
          const { data: userRow } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', userId)
            .single()
          if (userRow?.email) {
            const firstName = userRow.full_name?.split(' ')[0] || 'Pilot'
            sendTrialStartEmail({ to: userRow.email, userId, firstName }).catch(e =>
              console.error('Trial start email failed:', e)
            )
          }
        }
        break
      }

      // Fires when a real invoice is paid (after trial ends or immediately for non-trial)
      // NOTE: Make sure 'invoice.payment_succeeded' is enabled in your Stripe webhook settings
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        // Skip $0 invoices (trial start, free periods)
        if ((invoice.amount_paid ?? 0) === 0) break

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscriptionId = (invoice as any).subscription as string | null
        if (!subscriptionId) break

        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        const promoCode = sub.metadata?.referral_promo_code
        const userId = sub.metadata?.referral_user_id

        if (!promoCode || !userId) break

        await recordReferral(supabase, promoCode, userId, invoice.amount_paid)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const isActive = sub.status === 'active' || sub.status === 'trialing'
        const newStatus = sub.status === 'trialing' ? 'trialing' : (sub.status === 'active' ? 'study_pass' : 'free')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const periodEndTs = (sub as any).current_period_end ?? (sub as any).items?.data?.[0]?.current_period_end
        const periodEnd = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null

        await supabase.from('users').update({
          subscription_status: newStatus,
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
