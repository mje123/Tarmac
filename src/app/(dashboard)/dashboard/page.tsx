import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, UserProgress, TestSession } from '@/types'
import Link from 'next/link'
import { Brain } from 'lucide-react'
import SRSWidget from '@/components/ui/SRSWidget'
import ExamFocusPanel from '@/components/ui/ExamFocusPanel'
import { Suspense } from 'react'
import CheckoutSuccessBanner from '@/components/ui/CheckoutSuccessBanner'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const [
    { data: userProfile },
    { data: progressData },
    { data: recentSessions },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('user_progress').select('*').eq('user_id', authUser.id).order('accuracy_percentage', { ascending: true }),
    supabase.from('test_sessions').select('*').eq('user_id', authUser.id).eq('status', 'completed').order('completed_at', { ascending: false }).limit(3),
  ])

  const user = userProfile as User
  const progress = (progressData as UserProgress[]) || []
  const sessions = (recentSessions as TestSession[]) || []

  const displayName = user?.callsign || user?.full_name?.split(' ')[0] || 'Pilot'
  const totalAttempted = progress.reduce((s, p) => s + p.questions_attempted, 0)

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <CheckoutSuccessBanner />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Welcome back, {displayName}</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-ter)' }}>
          {totalAttempted > 0
            ? `${totalAttempted.toLocaleString()} questions practiced`
            : 'Prepare for questions you haven\'t seen before'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — exam focus + readiness (3/5 width) */}
        <div className="lg:col-span-3">
          <ExamFocusPanel progress={progress} />
        </div>

        {/* Right rail — SRS + recent exams (2/5 width) */}
        <div className="lg:col-span-2 space-y-4">
          <Suspense fallback={null}>
            <SRSWidget userId={authUser.id} />
          </Suspense>

          {/* Recent exams */}
          {sessions.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Brain style={{ width: '14px', height: '14px', color: 'var(--text-ter)' }} />
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-ter)' }}>
                  Recent Exams
                </h3>
              </div>
              <div className="space-y-2">
                {sessions.map(s => {
                  const pct = s.score && s.total_questions
                    ? Math.round((s.score / s.total_questions) * 100)
                    : null
                  const color = pct == null ? 'var(--text-ter)' : pct >= 70 ? '#22c55e' : '#ef4444'
                  return (
                    <div key={s.id} className="flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--text-sec)' }}>
                        {s.completed_at ? new Date(s.completed_at).toLocaleDateString() : '—'}
                      </span>
                      {pct != null && (
                        <span className="font-bold" style={{ color }}>{pct}%</span>
                      )}
                    </div>
                  )
                })}
              </div>
              <Link href="/exam" className="text-xs text-[#3E92CC] hover:underline mt-3 inline-block">
                Take a practice exam →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
