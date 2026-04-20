import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data: users } = await admin
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: sessionTotals } = await admin
    .from('test_sessions')
    .select('user_id, total_questions')
    .not('total_questions', 'is', null)

  const answeredPerUser = (sessionTotals || []).reduce((acc: Record<string, number>, s) => {
    if (s.user_id) acc[s.user_id] = (acc[s.user_id] || 0) + (s.total_questions || 0)
    return acc
  }, {})

  return NextResponse.json({ users: users || [], answeredPerUser })
}
