import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWeeklyQuestion } from '@/lib/question-pools'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId, responseText } = await req.json()
  if (!postId || !responseText?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (responseText.trim().length < 10) return NextResponse.json({ error: 'Response too short' }, { status: 400 })

  const admin = createAdminClient()
  let realPostId = postId

  if (typeof postId === 'string' && postId.startsWith('auto-')) {
    const weekStart = postId.replace('auto-', '')
    const q = getWeeklyQuestion(weekStart)
    const { data: upserted } = await admin
      .from('qotw_posts')
      .upsert({ question_text: q.question_text, question_type: q.question_type, context: q.context, week_start: weekStart }, { onConflict: 'week_start' })
      .select('id')
      .single()
    if (!upserted) return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    realPostId = upserted.id
  }

  const { data, error } = await admin
    .from('qotw_responses')
    .insert({ post_id: realPostId, user_id: user.id, response_text: responseText.trim() })
    .select('id, created_at')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already responded this week' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ response: data, realPostId })
}
