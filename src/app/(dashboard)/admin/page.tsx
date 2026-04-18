import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', authUser.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const [
    { count: totalUsers },
    { count: totalQuestions },
    { data: subscriptions },
    { data: recentUsers },
    { data: recentSessions },
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('questions').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('subscription_status').neq('subscription_status', 'free'),
    supabase.from('users').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('test_sessions').select('*, users(email, full_name)').order('started_at', { ascending: false }).limit(10),
  ])

  const subCounts = (subscriptions || []).reduce((acc: Record<string, number>, u) => {
    acc[u.subscription_status] = (acc[u.subscription_status] || 0) + 1
    return acc
  }, {})

  return (
    <AdminClient
      stats={{
        totalUsers: totalUsers || 0,
        totalQuestions: totalQuestions || 0,
        subCounts,
      }}
      recentUsers={recentUsers || []}
      recentSessions={recentSessions || []}
    />
  )
}
