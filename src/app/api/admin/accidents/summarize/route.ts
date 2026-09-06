import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { accidentId } = await request.json() as { accidentId: string }
  const admin = createAdminClient()

  // Get top 10 upvoted comments
  const { data: comments } = await admin.from('accident_comments')
    .select('body,display_name,upvote_count')
    .eq('accident_id', accidentId)
    .eq('is_removed', false)
    .order('upvote_count', { ascending: false })
    .limit(10)

  if (!comments?.length) return NextResponse.json({ error: 'No comments to summarize' }, { status: 400 })

  const { data: accident } = await admin.from('accidents').select('title,summary').eq('id', accidentId).single()

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const resp = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: 'You synthesize community discussion about aviation accidents into 2-3 educational takeaway sentences. Focus on what the community identified as key learning points. Write in third person, present tense. No lists — flowing prose only.',
    messages: [{
      role: 'user',
      content: `Accident: ${accident?.title}\n\nSummary: ${accident?.summary}\n\nTop community comments:\n${comments.map(c => `- ${c.body}`).join('\n')}`,
    }],
  })

  const summary = resp.content[0].type === 'text' ? resp.content[0].text : ''
  await admin.from('accidents').update({ ai_summary: summary }).eq('id', accidentId)

  return NextResponse.json({ summary })
}
