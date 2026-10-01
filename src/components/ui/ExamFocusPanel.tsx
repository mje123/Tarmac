'use client'

import Link from 'next/link'
import { useExamType } from '@/components/ExamTypeProvider'
import { EXAM_QUESTION_DISTRIBUTION, IFR_EXAM_QUESTION_DISTRIBUTION } from '@/lib/utils'
import type { UserProgress } from '@/types'

function statusColor(accuracy: number): string {
  return accuracy >= 80 ? 'var(--ac-good)' : accuracy >= 60 ? 'var(--ac-brass)' : 'var(--ac-chart-wine)'
}

function CategoryRow({ category, accuracy, attempted }: { category: string; accuracy: number; attempted: number }) {
  const color = statusColor(accuracy)
  return (
    <div
      className="grid items-center gap-3 py-2.5"
      style={{ gridTemplateColumns: '1fr auto 96px', borderBottom: '1px solid var(--ac-rule)', fontFamily: 'var(--ac-sans)' }}
    >
      <span className="text-sm truncate" style={{ color: 'var(--ac-ivory-dim)' }}>{category}</span>
      <span
        className="text-sm text-right tabular-nums whitespace-nowrap"
        style={{ fontFamily: 'var(--ac-mono)', fontVariantNumeric: 'tabular-nums' }}
      >
        <span style={{ color }}>{Math.round(accuracy)}%</span>
        <span style={{ color: 'var(--ac-ivory-faint)', fontSize: 11 }}> · {attempted}Q</span>
      </span>
      <div style={{ height: 1, background: 'var(--ac-rule-strong)', position: 'relative' }}>
        <i style={{ position: 'absolute', top: -2, left: `calc(${accuracy}% - 2.5px)`, width: 5, height: 5, borderRadius: '50%', background: color }} />
      </div>
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
    <div>
      <div className="flex items-center gap-6 mb-7" style={{ borderBottom: '1px solid var(--ac-rule)', fontFamily: 'var(--ac-sans)' }}>
        <button
          onClick={() => examType !== 'ppl' && setExamType('ppl')}
          className="pb-3 text-sm font-semibold transition-colors"
          style={{
            color: examType === 'ppl' ? 'var(--ac-ivory)' : 'var(--ac-ivory-faint)',
            borderBottom: examType === 'ppl' ? '2px solid var(--ac-brass)' : '2px solid transparent',
            marginBottom: -1,
          }}
        >
          Private Pilot
        </button>
        <button
          onClick={() => examType !== 'ifr' && setExamType('ifr')}
          className="pb-3 text-sm font-semibold transition-colors"
          style={{
            color: examType === 'ifr' ? 'var(--ac-ivory)' : 'var(--ac-ivory-faint)',
            borderBottom: examType === 'ifr' ? '2px solid var(--ac-brass)' : '2px solid transparent',
            marginBottom: -1,
          }}
        >
          Instrument
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--ac-mono)', fontSize: 11, letterSpacing: '.03em', color: 'var(--ac-ivory-faint)' }}>
        <span style={{ width: 14, height: 1, background: 'var(--ac-brass)', display: 'inline-block' }} />
        {examType === 'ifr' ? 'INSTRUMENT' : 'PRIVATE PILOT'} READINESS
        {filtered.length > 0 && (
          <span className="ml-auto" style={{ color: statusColor(overallAccuracy) }}>{overallAccuracy}% OVERALL</span>
        )}
      </div>

      {weakest.length === 0 ? (
        <div className="py-6" style={{ fontFamily: 'var(--ac-sans)' }}>
          <p className="text-sm" style={{ color: 'var(--ac-ivory-faint)' }}>No {examType === 'ifr' ? 'Instrument' : 'Private Pilot'} questions practiced yet.</p>
          <Link href="/practice" className="text-sm mt-2 inline-block" style={{ color: 'var(--ac-brass)' }}>
            Start the diagnostic
          </Link>
        </div>
      ) : (
        <div style={{ borderTop: '1px solid var(--ac-rule)' }}>
          {weakest.map(p => (
            <CategoryRow key={p.category} category={p.category} accuracy={p.accuracy_percentage} attempted={p.questions_attempted} />
          ))}
        </div>
      )}

      <Link
        href="/study-plan"
        className="flex items-center justify-between mt-8 pt-4 transition-opacity hover:opacity-75"
        style={{ borderTop: '1px solid var(--ac-brass-dim)', fontFamily: 'var(--ac-sans)' }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--ac-ivory)' }}>Continue the Test Runway</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ac-ivory-faint)' }}>Diagnostic — foundation — transfer — test-ready</p>
        </div>
        <span style={{ fontFamily: 'var(--ac-mono)', fontSize: 13, color: 'var(--ac-brass)' }}>CONTINUE</span>
      </Link>
    </div>
  )
}
