import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('qotw_response_likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('response_id', id)
    .maybeSingle()

  if (existing) {
    await admin.from('qotw_response_likes').delete().eq('user_id', user.id).eq('response_id', id)
    await admin.rpc('decrement_qotw_likes', { response_id: id })
    return NextResponse.json({ liked: false })
  } else {
    await admin.from('qotw_response_likes').insert({ user_id: user.id, response_id: id })
    await admin.rpc('increment_qotw_likes', { response_id: id })
    return NextResponse.json({ liked: true })
  }
}
