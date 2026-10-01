import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, UserProgress, TestSession } from '@/types'
import Link from 'next/link'
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

  const displayName = user?.full_name?.split(' ')[0] || 'Pilot'
  const totalAttempted = progress.reduce((s, p) => s + p.questions_attempted, 0)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' }).toUpperCase()

  return (
    <div className="p-5 sm:p-8 max-w-5xl mx-auto" style={{ fontFamily: 'var(--ac-sans)' }}>
      <CheckoutSuccessBanner />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-10">
        <div>
          <h1 style={{ fontFamily: 'var(--ac-serif)', fontStyle: 'italic', fontSize: 28, fontWeight: 500, color: 'var(--ac-ivory)' }}>
            Good day, {displayName}.
          </h1>
          <p className="mt-1" style={{ fontFamily: 'var(--ac-mono)', fontSize: 11.5, letterSpacing: '.03em', color: 'var(--ac-ivory-faint)' }}>
            {totalAttempted > 0 ? `${totalAttempted.toLocaleString()} QUESTIONS LOGGED` : 'READY FOR YOUR FIRST SESSION'}
          </p>
        </div>
        <div className="text-right" style={{ fontFamily: 'var(--ac-mono)', fontSize: 12, color: 'var(--ac-brass)' }}>
          {today}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left — exam focus + readiness (3/5 width) */}
        <div className="lg:col-span-3">
          <ExamFocusPanel progress={progress} />
        </div>

        {/* Right rail — SRS + recent exams (2/5 width) */}
        <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <Suspense fallback={null}>
            <SRSWidget userId={authUser.id} />
          </Suspense>

          {/* Recent exams */}
          {sessions.length > 0 && (
            <div style={{ borderTop: '1px solid var(--ac-rule)', paddingTop: 16 }}>
              <div className="flex items-center gap-2 mb-3" style={{ fontFamily: 'var(--ac-mono)', fontSize: 11, letterSpacing: '.03em', color: 'var(--ac-ivory-faint)' }}>
                <span style={{ width: 14, height: 1, background: 'var(--ac-brass)', display: 'inline-block' }} />
                RECENT EXAMS
              </div>
              <div>
                {sessions.map(s => {
                  const pct = s.score && s.total_questions
                    ? Math.round((s.score / s.total_questions) * 100)
                    : null
                  const color = pct == null ? 'var(--ac-ivory-faint)' : pct >= 70 ? 'var(--ac-good)' : 'var(--ac-chart-wine)'
                  return (
                    <div key={s.id} className="flex items-center justify-between text-sm py-2" style={{ borderBottom: '1px solid var(--ac-rule)' }}>
                      <span style={{ color: 'var(--ac-ivory-dim)' }}>
                        {s.completed_at ? new Date(s.completed_at).toLocaleDateString() : '—'}
                      </span>
                      {pct != null && (
                        <span style={{ fontFamily: 'var(--ac-mono)', color, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                      )}
                    </div>
                  )
                })}
              </div>
              <Link href="/exam" className="text-sm mt-3 inline-block" style={{ color: 'var(--ac-brass)' }}>
                Take a practice exam
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
