'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Play, CheckCircle2 } from 'lucide-react'
import { PHASE_LABELS, type RunwayPhase } from '@/lib/runway'

// A plain "YYYY-MM-DD" DATE-column value has no time component. Parsing it with
// `new Date(str)` treats it as UTC midnight, which `.toLocaleDateString()` then
// renders in the viewer's local zone — shifting it a day earlier for anyone west of
// UTC. Building the Date from local y/m/d components instead avoids that entirely.
function formatDateOnly(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString()
}

const MODE_HREF: Record<string, string> = {
  learn: '/practice/learn',
  practice: '/practice/practice?autoStart=weak',
  transfer: '/practice/transfer',
  diagnostic: '/practice/diagnostic',
  weakness: '/practice/weakness',
  exam: '/exam',
}

interface RunwayTodayProps {
  dayIndex: number
  totalDays: number
  phase: RunwayPhase
  compressed: boolean
  examDate: string | null
  today: { mode: string; label: string; estimatedMinutes: number; completed: boolean }
}

export default function RunwayToday({ dayIndex, totalDays, phase, compressed, examDate, today }: RunwayTodayProps) {
  const [editingDate, setEditingDate] = useState(false)
  const [dateValue, setDateValue] = useState(examDate ?? '')
  const [saving, setSaving] = useState(false)
  const [savedDate, setSavedDate] = useState(examDate)

  async function saveDate() {
    setSaving(true)
    try {
      await fetch('/api/runway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examDate: dateValue || null }),
      })
      setSavedDate(dateValue || null)
      setEditingDate(false)
    } finally {
      setSaving(false)
    }
  }

  const progressPct = Math.round((dayIndex / totalDays) * 100)

  return (
    <div className="rounded-2xl p-6 mb-8" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-ter)' }}>
          Day {dayIndex} of {totalDays} — {PHASE_LABELS[phase]}
          {compressed && <span className="ml-1.5 normal-case font-normal" style={{ color: '#FFB627' }}>(compressed to your test date)</span>}
        </p>
        <button onClick={() => setEditingDate(e => !e)} className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-ter)' }}>
          <Calendar className="w-3.5 h-3.5" />
          {savedDate ? formatDateOnly(savedDate) : 'Set test date'}
        </button>
      </div>

      <div className="progress-bar mb-5">
        <div className="progress-fill" style={{ width: `${progressPct}%`, background: '#FFB627', boxShadow: '0 0 6px #FFB62755' }} />
      </div>

      {editingDate && (
        <div className="flex items-center gap-2 mb-5">
          <input
            type="date"
            value={dateValue}
            onChange={e => setDateValue(e.target.value)}
            className="text-sm px-3 py-2 rounded-lg"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', color: 'var(--text-pri)' }}
          />
          <button onClick={saveDate} disabled={saving} className="text-xs font-bold px-3 py-2 rounded-lg" style={{ background: 'rgba(255,182,39,0.15)', color: '#FFB627' }}>
            Save
          </button>
        </div>
      )}

      {today.completed ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: '#22c55e' }}>
          <CheckCircle2 className="w-4 h-4" /> Today&apos;s training complete. Good work.
        </div>
      ) : (
        <>
          <p className="text-white font-semibold mb-1">{today.label}</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-ter)' }}>~{today.estimatedMinutes} min</p>
          <Link
            href={MODE_HREF[today.mode] ?? '/practice'}
            className="inline-flex items-center gap-2 py-3 px-6 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463', boxShadow: '0 4px 20px rgba(255,182,39,0.35)' }}
          >
            <Play className="w-4 h-4" /> Start
          </Link>
        </>
      )}
    </div>
  )
}
