import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Play, BookOpen, Shuffle, Zap, GraduationCap, ChevronRight, Target } from 'lucide-react'
import { getReadiness } from '@/lib/readinessServer'

export const dynamic = 'force-dynamic'

export default async function PracticeHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const cookieStore = await cookies()
  const examType = profile?.is_admin && cookieStore.get('tarmac-exam-type')?.value === 'ifr' ? 'ifr' : 'ppl'
  const examLabel = examType === 'ifr' ? 'Instrument' : 'Private Pilot'

  const { score: readiness, biggestRisks } = await getReadiness(supabase, user.id, examType)
  let focusLabel: string | null = biggestRisks[0]?.conceptName ?? null

  if (!focusLabel) {
    // No concept-level data yet — fall back to category-level accuracy so a brand-new
    // user still sees something meaningful instead of a blank focus area.
    const { data: progress } = await supabase
      .from('user_progress')
      .select('category, accuracy_percentage, questions_attempted')
      .eq('user_id', user.id)
      .order('accuracy_percentage', { ascending: true })
    const relevant = (progress || []).filter(p => p.questions_attempted > 0)
    if (relevant.length > 0) focusLabel = relevant[0].category
  }

  const readinessColor = readiness == null ? 'var(--text-ter)' : readiness >= 80 ? '#22c55e' : readiness >= 60 ? '#FFB627' : '#ef4444'

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-ter)' }}>
          Tarmac Training — {examLabel}
        </p>
        <h1 className="text-2xl font-bold text-white">Today&apos;s training</h1>
      </div>

      <div className="rounded-2xl p-6 mb-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-ter)' }}>Your readiness</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-5xl font-extrabold tabular-nums" style={{ color: readinessColor }}>
                {readiness ?? '—'}
              </span>
              <span className="text-lg font-semibold" style={{ color: 'var(--text-ter)' }}>/100</span>
            </div>
          </div>
        </div>
        {readiness == null ? (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-sec)' }}>
            No sessions yet — your first practice session establishes a baseline.
          </p>
        ) : (
          <>
            <p className="text-xs mb-1" style={{ color: 'var(--text-ter)' }}>Based on your Tarmac performance — not a predicted pass rate.</p>
            {focusLabel && (
              <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--text-sec)' }}>
                <span className="font-semibold text-white">Today&apos;s focus: </span>
                {focusLabel} needs the most work right now.
              </p>
            )}
            <Link href="/practice/readiness" className="text-xs mt-3 inline-block" style={{ color: '#3E92CC' }}>
              See full breakdown →
            </Link>
          </>
        )}
      </div>

      <Link
        href="/practice/practice?autoStart=weak"
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90 mb-6"
        style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463', boxShadow: '0 4px 20px rgba(255,182,39,0.35)' }}
      >
        <Play className="w-5 h-5" />
        Start Today&apos;s Training
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/practice/learn"
          className="flex items-center gap-3 rounded-xl p-4 transition-all hover:opacity-90"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}
        >
          <GraduationCap className="w-5 h-5 text-[#3E92CC] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Learn</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-ter)' }}>Weak concept, from the basics</p>
          </div>
        </Link>
        <Link
          href="/practice/practice"
          className="flex items-center gap-3 rounded-xl p-4 transition-all hover:opacity-90"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}
        >
          <Shuffle className="w-5 h-5 text-[#3E92CC] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Practice</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-ter)' }}>Adaptive, mixed concepts</p>
          </div>
        </Link>
        <Link
          href="/practice/transfer"
          className="flex items-center gap-3 rounded-xl p-4 transition-all hover:opacity-90"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}
        >
          <Zap className="w-5 h-5 text-[#FFB627] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Transfer</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-ter)' }}>Questions you haven&apos;t seen</p>
          </div>
        </Link>
        <Link
          href="/exam"
          className="flex items-center gap-3 rounded-xl p-4 transition-all hover:opacity-90"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}
        >
          <BookOpen className="w-5 h-5 text-[#3E92CC] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Full Exam</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-ter)' }}>Timed, no hints</p>
          </div>
        </Link>
      </div>

      <Link
        href="/practice/weakness"
        className="flex items-center gap-3 rounded-xl p-4 mt-3 transition-all hover:opacity-90"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <Target className="w-5 h-5 text-red-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Weakness Attack</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-ter)' }}>7-minute focused drill on your weakest concepts</p>
        </div>
        <ChevronRight className="w-4 h-4 text-red-400/60 shrink-0" />
      </Link>

      <Link href="/practice/practice" className="flex items-center justify-center gap-1 text-xs mt-5" style={{ color: 'var(--text-ter)' }}>
        Advanced: pick a specific category <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
