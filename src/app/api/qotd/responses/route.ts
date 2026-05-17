import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const postId = req.nextUrl.searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 })

  const admin = createAdminClient()

  // Fetch responses ordered by likes desc, then date
  const { data: responses, error } = await admin
    .from('qotd_responses')
    .select('id, response_text, like_count, created_at, user_id')
    .eq('post_id', postId)
    .order('like_count', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch this user's likes so we can show liked state
  const responseIds = (responses || []).map(r => r.id)
  const { data: myLikes } = await admin
    .from('qotd_response_likes')
    .select('response_id')
    .eq('user_id', user.id)
    .in('response_id', responseIds.length > 0 ? responseIds : ['none'])

  const likedSet = new Set((myLikes || []).map(l => l.response_id))

  // Fetch comment counts
  const { data: commentCounts } = await admin
    .from('qotd_response_comments')
    .select('response_id')
    .in('response_id', responseIds.length > 0 ? responseIds : ['none'])

  const commentMap: Record<string, number> = {}
  for (const c of commentCounts || []) {
    commentMap[c.response_id] = (commentMap[c.response_id] || 0) + 1
  }

  const enriched = (responses || []).map(r => ({
    id: r.id,
    response_text: r.response_text,
    like_count: r.like_count,
    comment_count: commentMap[r.id] || 0,
    liked_by_me: likedSet.has(r.id),
    is_mine: r.user_id === user.id,
    callsign: toCallsign(r.user_id),
    created_at: r.created_at,
  }))

  return NextResponse.json({ responses: enriched })
}

// Deterministic aviation callsign from user UUID
const NATO = ['ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT','GOLF','HOTEL',
               'INDIA','JULIET','KILO','LIMA','MIKE','NOVEMBER','OSCAR','PAPA',
               'QUEBEC','ROMEO','SIERRA','TANGO','UNIFORM','VICTOR','WHISKEY',
               'XRAY','YANKEE','ZULU']

function toCallsign(userId: string): string {
  const hex = userId.replace(/-/g, '').slice(0, 8)
  const n = parseInt(hex, 16)
  const word = NATO[n % NATO.length]
  const num = String(n % 1000).padStart(3, '0')
  return `${word}-${num}`
}
