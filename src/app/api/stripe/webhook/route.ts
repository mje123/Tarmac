import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('[webhook] received event:', event.type, event.id)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        console.log('[webhook] checkout.session.completed — userId:', userId, 'customer:', session.customer, 'subscription:', session.subscription)

        if (!userId) {
          console.error('[webhook] no userId in metadata')
          break
        }

        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const expiresAt = new Date(((sub as unknown as Record<string, unknown>).current_period_end as number) * 1000).toISOString()
          console.log('[webhook] updating user', userId, 'to study_pass, expires:', expiresAt)

          const { data, error } = await supabaseAdmin.from('users').update({
            subscription_status: 'study_pass',
            subscription_expires_at: expiresAt,
            stripe_customer_id: session.customer as string,
            updated_at: new Date().toISOString(),
          }).eq('id', userId).select()

          if (error) console.error('[webhook] supabase update error:', error)
          else console.log('[webhook] supabase update success, rows affected:', data?.length)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        console.log('[webhook] subscription.updated — customer:', customerId, 'status:', sub.status)

        if (sub.status === 'active') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const expiresAt = new Date(((sub as unknown as Record<string, unknown>).current_period_end as number) * 1000).toISOString()
          const { data, error } = await supabaseAdmin.from('users').update({
            subscription_status: 'study_pass',
            subscription_expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          }).eq('stripe_customer_id', customerId).select()

          if (error) console.error('[webhook] supabase update error:', error)
          else console.log('[webhook] supabase update success, rows affected:', data?.length)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        console.log('[webhook] subscription.deleted — customer:', sub.customer)
        await supabaseAdmin.from('users').update({
          subscription_status: 'free',
          subscription_expires_at: null,
          updated_at: new Date().toISOString(),
        }).eq('stripe_customer_id', sub.customer as string)
        break
      }

      default:
        console.log('[webhook] unhandled event type:', event.type)
    }
  } catch (error) {
    console.error('[webhook] processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
