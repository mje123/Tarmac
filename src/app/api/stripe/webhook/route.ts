import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

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

  const supabase = await createClient()

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
