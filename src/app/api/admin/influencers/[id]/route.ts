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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()
  const { id } = await params
  const body = await request.json()

  if (body.markAllPaid) {
    await admin
      .from('influencer_referrals')
      .update({ commission_paid: true })
      .eq('influencer_id', id)
      .eq('commission_paid', false)
    return NextResponse.json({ success: true })
  }

  const { data, error: dbError } = await admin
    .from('influencers')
    .update(body)
    .eq('id', id)
    .select().single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()
  const { id } = await params
  await admin.from('influencers').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
