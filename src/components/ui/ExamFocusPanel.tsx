'use client'

import Link from 'next/link'
import { ArrowRight, Route } from 'lucide-react'
import { useExamType } from '@/components/ExamTypeProvider'
import { EXAM_QUESTION_DISTRIBUTION, IFR_EXAM_QUESTION_DISTRIBUTION } from '@/lib/utils'
import type { UserProgress } from '@/types'

function CategoryBar({ category, accuracy, attempted }: { category: string; accuracy: number; attempted: number }) {
  const color = accuracy >= 80 ? '#22c55e' : accuracy >= 60 ? '#FFB627' : '#ef4444'
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 sm:w-32 text-xs font-medium truncate" style={{ color: 'var(--text-sec)' }}>{category}</div>
      <div className="flex-1 progress-bar">
        <div className="progress-fill" style={{ width: `${accuracy}%`, background: color, boxShadow: `0 0 6px ${color}55` }} />
      </div>
      <div className="text-sm font-bold w-10 text-right tabular-nums" style={{ color }}>{Math.round(accuracy)}%</div>
      <div className="text-xs w-10 text-right tabular-nums" style={{ color: 'var(--text-ter)' }}>{attempted}Q</div>
    </div>
  )
}

export default function ExamFocusPanel({ progress }: { progress: UserProgress[] }) {
  const { examType, setExamType } = useExamType()

  const categories = examType === 'ifr'
    ? Object.keys(IFR_EXAM_QUESTION_DISTRIBUTION)
    : Object.keys(EXAM_QUESTION_DISTRIBUTION)

  const filtered = progress.filter(p => categories.includes(p.category))
  const overallAccuracy = filtered.length
    ? Math.round(filtered.reduce((s, p) => s + p.accuracy_percentage, 0) / filtered.length)
    : 0
  const weakest = [...filtered].sort((a, b) => a.accuracy_percentage - b.accuracy_percentage).slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-ter)' }}>What are you preparing for?</p>
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-1)' }}>
          <button
            onClick={() => examType !== 'ppl' && setExamType('ppl')}
            className="flex-1 py-2.5 text-sm font-bold transition-all"
            style={examType === 'ppl' ? { background: '#3E92CC', color: 'white' } : { background: 'transparent', color: 'var(--text-ter)' }}
          >
            Private Pilot
          </button>
          <button
            onClick={() => examType !== 'ifr' && setExamType('ifr')}
            className="flex-1 py-2.5 text-sm font-bold transition-all"
            style={examType === 'ifr' ? { background: '#FFB627', color: '#060e1c' } : { background: 'transparent', color: 'var(--text-ter)' }}
          >
            Instrument
          </button>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-ter)' }}>
            {examType === 'ifr' ? 'Instrument' : 'Private Pilot'} readiness
          </p>
          {filtered.length > 0 && (
            <span className="text-sm font-bold" style={{ color: overallAccuracy >= 80 ? '#22c55e' : overallAccuracy >= 60 ? '#FFB627' : '#ef4444' }}>
              {overallAccuracy}% overall
            </span>
          )}
        </div>
        {weakest.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm" style={{ color: 'var(--text-ter)' }}>No {examType === 'ifr' ? 'Instrument' : 'Private Pilot'} questions practiced yet.</p>
            <Link href="/practice" className="text-sm text-[#3E92CC] hover:underline mt-1 inline-block">
              Start the diagnostic →
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {weakest.map(p => (
              <CategoryBar key={p.category} category={p.category} accuracy={p.accuracy_percentage} attempted={p.questions_attempted} />
            ))}
          </div>
        )}
      </div>

      <Link
        href="/study-plan"
        className="flex items-center gap-3 rounded-xl p-4 transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, rgba(255,182,39,0.14), rgba(255,182,39,0.05))', border: '1px solid rgba(255,182,39,0.3)' }}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,182,39,0.15)' }}>
          <Route className="w-4 h-4 text-[#FFB627]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Continue the 30-Day Runway</p>
          <p className="text-xs" style={{ color: 'var(--text-ter)' }}>Diagnostic → foundation → transfer → test-ready</p>
        </div>
        <ArrowRight className="w-4 h-4 text-[#FFB627] shrink-0" />
      </Link>
    </div>
  )
}
