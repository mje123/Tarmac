import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { getReadiness } from '@/lib/readinessServer'
import { getEffectiveExamType } from '@/lib/examType'
import { ArrowLeft, Play } from 'lucide-react'

export const dynamic = 'force-dynamic'

const COMPONENT_LABELS: { key: 'conceptMastery' | 'novelPerformance' | 'retention' | 'examPerformance' | 'calibration'; label: string; note: string }[] = [
  { key: 'conceptMastery', label: 'Concept Mastery', note: 'Accuracy across everything you\'ve practiced' },
  { key: 'novelPerformance', label: 'Novel Question Performance', note: 'Accuracy on questions in a form you haven\'t drilled' },
  { key: 'retention', label: 'Retention', note: 'How current your spaced reviews are' },
  { key: 'examPerformance', label: 'Timed Exam Performance', note: 'Your most recent full exam, decaying if it\'s getting old' },
  { key: 'calibration', label: 'Confidence Calibration', note: 'Whether your confidence matches your accuracy' },
]

function barColor(pct: number): string {
  return pct >= 80 ? '#22c55e' : pct >= 60 ? '#FFB627' : '#ef4444'
}

export default async function ReadinessBreakdownPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const examType = await getEffectiveExamType(supabase, user.id, cookieStore.get('tarmac-exam-type')?.value)

  const { score, components, biggestRisks } = await getReadiness(supabase, user.id, examType)

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <Link href="/practice" className="flex items-center gap-1.5 text-sm mb-6" style={{ color: 'var(--text-ter)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to Practice
      </Link>

      <div className="rounded-2xl p-6 mb-6 text-center" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-ter)' }}>Tarmac Readiness</p>
        <p className="text-6xl font-extrabold" style={{ color: score == null ? 'var(--text-ter)' : barColor(score) }}>{score ?? '--'}<span className="text-2xl" style={{ color: 'var(--text-ter)' }}>/100</span></p>
        <p className="text-xs mt-2" style={{ color: 'var(--text-ter)' }}>Based on your Tarmac performance — not a predicted pass rate.</p>
      </div>

      <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <h2 className="text-sm font-bold text-white mb-4">Breakdown</h2>
        <div className="space-y-4">
          {COMPONENT_LABELS.map(({ key, label, note }) => {
            const value = components[key]
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{label}</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: value == null ? 'var(--text-ter)' : barColor(value) }}>
                    {value == null ? 'Not enough data' : `${Math.round(value)}%`}
                  </span>
                </div>
                <p className="text-xs mb-1.5" style={{ color: 'var(--text-ter)' }}>{note}</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${value ?? 0}%`, background: value == null ? 'var(--border-1)' : barColor(value) }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {biggestRisks.length > 0 && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
          <h2 className="text-sm font-bold text-white mb-3">Your Biggest Risks</h2>
          <ol className="space-y-2">
            {biggestRisks.map((r, i) => (
              <li key={r.conceptId} className="flex items-center gap-3 text-sm">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>{i + 1}</span>
                <span style={{ color: 'var(--text-sec)' }}>{r.conceptName}</span>
                <span className="ml-auto text-xs tabular-nums" style={{ color: 'var(--text-ter)' }}>{Math.round(r.masteryPct)}%</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <Link
        href="/practice/weakness"
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463', boxShadow: '0 4px 20px rgba(255,182,39,0.35)' }}
      >
        <Play className="w-4 h-4" /> Train on your biggest risks
      </Link>
    </div>
  )
}
