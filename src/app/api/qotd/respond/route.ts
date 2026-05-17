import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId, responseText } = await req.json()
  if (!postId || !responseText?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (responseText.trim().length < 10) {
    return NextResponse.json({ error: 'Response too short' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('qotd_responses')
    .insert({ post_id: postId, user_id: user.id, response_text: responseText.trim() })
    .select('id, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already responded today' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ response: data })
}
