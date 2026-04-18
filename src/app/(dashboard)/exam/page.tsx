import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canAccessExam } from '@/lib/utils'
import { ClipboardList, Lock, Trophy, TrendingUp, CheckSquare, Calendar } from 'lucide-react'

interface ExamSession {
  id: string
  score: number
  total_questions: number
  completed_at: string
  started_at: string
  time_remaining_seconds: number | null
}

export default async function ExamHubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('subscription_status, subscription_expires_at')
    .eq('id', user.id)
    .single()

  const isExpired = profile?.subscription_expires_at
    ? new Date(profile.subscription_expires_at) < new Date()
    : true

  const hasAccess = profile && canAccessExam(profile.subscription_status) && !isExpired

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="glass-card p-10 max-w-md text-center">
          <Lock className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Study Pass Required</h2>
          <p className="text-white/60 mb-6">Practice exams are available with Study Pass.</p>
          <a href="/settings" className="btn-gold inline-flex justify-center px-8 py-3">Upgrade Now</a>
        </div>
      </div>
    )
  }

  const { data: sessions } = await supabase
    .from('test_sessions')
    .select('id, score, total_questions, completed_at, started_at, time_remaining_seconds')
    .eq('user_id', user.id)
    .eq('session_type', 'real_exam')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  const examSessions: ExamSession[] = sessions ?? []

  const avgScore = examSessions.length > 0
    ? Math.round(examSessions.reduce((sum, s) => sum + Math.round((s.score / s.total_questions) * 100), 0) / examSessions.length)
    : 0

  const bestScore = examSessions.length > 0
    ? Math.max(...examSessions.map(s => Math.round((s.score / s.total_questions) * 100)))
    : 0

  const passRate = examSessions.length > 0
    ? Math.round((examSessions.filter(s => s.score / s.total_questions >= 0.70).length / examSessions.length) * 100)
    : 0

  function formatExamDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,182,39,0.15)' }}>
          <ClipboardList className="w-6 h-6 text-[#FFB627]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Practice Exam</h1>
          <p className="text-white/50 text-sm">FAA Private Pilot Written — full simulation</p>
        </div>
      </div>

      {/* Stats row */}
      {examSessions.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Exams Taken', value: examSessions.length.toString(), icon: ClipboardList, color: '#3E92CC' },
            { label: 'Avg Score', value: `${avgScore}%`, icon: TrendingUp, color: '#3E92CC' },
            { label: 'Best Score', value: `${bestScore}%`, icon: Trophy, color: '#FFB627' },
            { label: 'Pass Rate', value: `${passRate}%`, icon: CheckSquare, color: passRate >= 70 ? '#22c55e' : '#ef4444' },
          ].map(stat => (
            <div key={stat.label} className="glass-card p-4 text-center">
              <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: stat.color }} />
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-white/50 text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Start exam CTA */}
      <div className="glass-card p-6 mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Ready to test yourself?</h2>
          <p className="text-white/50 text-sm">60 questions · 2:30 time limit · 70% to pass</p>
        </div>
        <a href="/exam-session" target="_blank" rel="noopener noreferrer" className="btn-gold px-6 py-3 inline-flex items-center gap-2 whitespace-nowrap">
          <ClipboardList className="w-4 h-4" />
          Start New Exam
        </a>
      </div>

      {/* Past exams */}
      {examSessions.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <ClipboardList className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">No exams yet</h3>
          <p className="text-white/50 text-sm">Start your first practice exam to see your results here.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3 border-b border-white/8">
            <h3 className="font-semibold text-white text-sm">Past Exams</h3>
          </div>
          <div className="divide-y divide-white/5">
            {examSessions.map(session => {
              const pct = Math.round((session.score / session.total_questions) * 100)
              const passed = pct >= 70
              return (
                <div key={session.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex items-center gap-1.5 text-white/40 text-xs w-40 shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatExamDate(session.completed_at)}
                  </div>
                  <div className="flex-1">
                    <span className="text-white font-semibold">
                      {session.score}/{session.total_questions}
                    </span>
                    <span className="text-white/50 text-sm ml-2">({pct}%)</span>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={passed
                      ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e' }
                      : { background: 'rgba(239,68,68,0.15)', color: '#ef4444' }
                    }
                  >
                    {passed ? 'PASSED' : 'FAILED'}
                  </span>
                  <a
                    href={`/exam/results/${session.id}`}
                    className="text-sm text-[#3E92CC] hover:text-white transition-colors whitespace-nowrap"
                  >
                    View Results →
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
