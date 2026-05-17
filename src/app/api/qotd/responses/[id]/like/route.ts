import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: responseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Check if already liked
  const { data: existing } = await admin
    .from('qotd_response_likes')
    .select('id')
    .eq('response_id', responseId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    // Unlike
    await admin.from('qotd_response_likes').delete().eq('id', existing.id)
    await admin.rpc('decrement_qotd_likes', { response_id: responseId })
    return NextResponse.json({ liked: false })
  } else {
    // Like
    await admin.from('qotd_response_likes').insert({ response_id: responseId, user_id: user.id })
    await admin.rpc('increment_qotd_likes', { response_id: responseId })
    return NextResponse.json({ liked: true })
  }
}
