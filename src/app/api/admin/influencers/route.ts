import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, error: null }
}

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()

  const { data: influencers } = await admin
    .from('influencers')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: referrals } = await admin
    .from('influencer_referrals')
    .select('*, users(full_name, email)')
    .order('created_at', { ascending: false })

  const result = (influencers || []).map(inf => {
    const refs = (referrals || []).filter(r => r.influencer_id === inf.id)
    const totalCents = refs.reduce((sum, r) => sum + (r.amount_cents || 0), 0)
    const unpaidRefs = refs.filter(r => !r.commission_paid)
    const unpaidCents = unpaidRefs.reduce((sum, r) => sum + (r.amount_cents || 0), 0)
    const commissionOwedCents = Math.round(unpaidCents * inf.commission_pct / 100)
    const totalCommissionPaidCents = Math.round(
      refs.filter(r => r.commission_paid).reduce((sum, r) => sum + (r.amount_cents || 0), 0) * inf.commission_pct / 100
    )
    return {
      ...inf,
      referralCount: refs.length,
      totalRevenueCents: totalCents,
      commissionOwedCents,
      totalCommissionPaidCents,
      unpaidReferrals: unpaidRefs.length,
      referrals: refs.map(r => ({
        id: r.id,
        user_name: (r.users as Record<string, string> | null)?.full_name || (r.users as Record<string, string> | null)?.email || 'Unknown',
        user_email: (r.users as Record<string, string> | null)?.email || '',
        amount_cents: r.amount_cents,
        commission_paid: r.commission_paid,
        created_at: r.created_at,
      })),
    }
  })

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()
  const body = await request.json()
  const { name, email, promo_code, commission_pct } = body

  if (!name || !promo_code) {
    return NextResponse.json({ error: 'Name and promo code required' }, { status: 400 })
  }

  const { data, error: dbError } = await admin
    .from('influencers')
    .insert({ name, email, promo_code: promo_code.toUpperCase(), commission_pct: commission_pct || 30 })
    .select().single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}
