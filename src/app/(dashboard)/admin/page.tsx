import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminClient from './AdminClient'

const STUDY_PASS_PRICE = 9 // USD/month estimate

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', authUser.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const [
    { count: totalUsers },
    { count: totalQuestions },
    { count: totalSessions },
    { data: subscriptions },
    { data: recentUsers },
    { data: recentSessions },
    { data: scoredSessions },
    { data: allSessionTotals },
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('questions').select('id', { count: 'exact', head: true }),
    supabase.from('test_sessions').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('subscription_status').neq('subscription_status', 'free'),
    supabase.from('users').select('*').order('created_at', { ascending: false }).limit(20),
    supabase.from('test_sessions').select('*, users(email, full_name)').order('started_at', { ascending: false }).limit(10),
    supabase.from('test_sessions').select('score, total_questions').eq('session_type', 'real_exam').not('score', 'is', null).limit(500),
    supabase.from('test_sessions').select('user_id, total_questions').not('total_questions', 'is', null),
  ])

  const totalAnswered = (allSessionTotals || []).reduce((sum, s) => sum + (s.total_questions || 0), 0)

  const answeredPerUser = (allSessionTotals || []).reduce((acc: Record<string, number>, s) => {
    if (s.user_id) acc[s.user_id] = (acc[s.user_id] || 0) + (s.total_questions || 0)
    return acc
  }, {})

  const subCounts = (subscriptions || []).reduce((acc: Record<string, number>, u) => {
    acc[u.subscription_status] = (acc[u.subscription_status] || 0) + 1
    return acc
  }, {})

  const totalPaid = Object.values(subCounts).reduce((a, b) => a + b, 0)
  const mrr = (subCounts['study_pass'] || 0) * STUDY_PASS_PRICE

  let avgScore = 0
  let passRate = 0
  if (scoredSessions && scoredSessions.length > 0) {
    const pcts = scoredSessions.map(s => (s.score / (s.total_questions || 60)) * 100)
    avgScore = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
    passRate = Math.round((pcts.filter(p => p >= 70).length / pcts.length) * 100)
  }

  return (
    <AdminClient
      stats={{
        totalUsers: totalUsers || 0,
        totalQuestions: totalQuestions || 0,
        totalSessions: totalSessions || 0,
        totalAnswered,
        avgScore,
        passRate,
        subCounts,
        mrr,
      }}
      recentUsers={recentUsers || []}
      recentSessions={recentSessions || []}
      answeredPerUser={answeredPerUser}
    />
  )
}
