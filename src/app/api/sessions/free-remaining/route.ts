import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const FREE_QUESTION_LIMIT = 10

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ freeQuestionsLeft: null })

  const { data: profile } = await supabase.from('users').select('subscription_status, subscription_expires_at').eq('id', user.id).single()
  const isFree = !profile || profile.subscription_status === 'free'
  const isExpired = profile?.subscription_expires_at && new Date(profile.subscription_expires_at) < new Date()

  if (!isFree && !isExpired) return NextResponse.json({ freeQuestionsLeft: null })

  const { data: sessions } = await supabase.from('test_sessions').select('id').eq('user_id', user.id)
  const sessionIds = sessions?.map(s => s.id) || []

  let totalAnswered = 0
  if (sessionIds.length > 0) {
    const { count } = await supabase
      .from('test_answers')
      .select('id', { count: 'exact', head: true })
      .in('session_id', sessionIds)
    totalAnswered = count || 0
  }

  return NextResponse.json({ freeQuestionsLeft: Math.max(0, FREE_QUESTION_LIMIT - totalAnswered) })
}
