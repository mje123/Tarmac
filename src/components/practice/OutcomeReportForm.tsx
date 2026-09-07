'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

interface OutcomeReportFormProps {
  examType: 'ppl' | 'ifr'
}

/** Voluntary self-reported real FAA outcome — collection only, feeds no prediction
 *  today (see exam_outcomes migration comment). This is how a future validated
 *  readiness/pass-probability model would eventually get its ground truth. */
export default function OutcomeReportForm({ examType }: OutcomeReportFormProps) {
  const [open, setOpen] = useState(false)
  const [passed, setPassed] = useState<boolean | null>(null)
  const [score, setScore] = useState('')
  const [comparisonDifficulty, setComparisonDifficulty] = useState<string | null>(null)
  const [questionsFamiliarity, setQuestionsFamiliarity] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    try {
      await fetch('/api/outcomes/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType,
          passed,
          score: score ? Number(score) : null,
          comparisonDifficulty,
          questionsFamiliarity,
        }),
      })
      setSubmitted(true)
    } finally {
      setSaving(false)
    }
  }

  if (submitted) {
    return (
      <div className="glass-card p-5 flex items-center gap-3 mt-4">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <p className="text-sm text-white/70">Thanks — this helps Tarmac get more accurate for everyone.</p>
      </div>
    )
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-[#3E92CC] hover:underline mt-4">
        I took my FAA test →
      </button>
    )
  }

  const optionButton = (active: boolean) => ({
    background: active ? 'rgba(62,146,204,0.2)' : 'var(--surface-2)',
    border: active ? '1px solid rgba(62,146,204,0.5)' : '1px solid var(--border-1)',
    color: active ? 'white' : 'var(--text-sec)',
  })

  return (
    <div className="glass-card p-5 mt-4 space-y-4">
      <h3 className="text-sm font-bold text-white">How did the real test go?</h3>

      <div>
        <p className="text-xs mb-2" style={{ color: 'var(--text-ter)' }}>Pass/fail</p>
        <div className="flex gap-2">
          <button onClick={() => setPassed(true)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={optionButton(passed === true)}>Passed</button>
          <button onClick={() => setPassed(false)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={optionButton(passed === false)}>Failed</button>
        </div>
      </div>

      <div>
        <p className="text-xs mb-2" style={{ color: 'var(--text-ter)' }}>Score (%)</p>
        <input
          type="number"
          min={0}
          max={100}
          value={score}
          onChange={e => setScore(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', color: 'var(--text-pri)' }}
        />
      </div>

      <div>
        <p className="text-xs mb-2" style={{ color: 'var(--text-ter)' }}>How did the real test compare to Tarmac?</p>
        <div className="flex gap-2">
          {[['easier', 'Easier'], ['about_same', 'About the same'], ['harder', 'Harder']].map(([val, label]) => (
            <button key={val} onClick={() => setComparisonDifficulty(val)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={optionButton(comparisonDifficulty === val)}>{label}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs mb-2" style={{ color: 'var(--text-ter)' }}>Were the questions unfamiliar?</p>
        <div className="flex gap-2">
          {[['mostly', 'Mostly'], ['somewhat', 'Somewhat'], ['not_really', 'Not really']].map(([val, label]) => (
            <button key={val} onClick={() => setQuestionsFamiliarity(val)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={optionButton(questionsFamiliarity === val)}>{label}</button>
          ))}
        </div>
      </div>

      <button
        onClick={submit}
        disabled={saving || passed === null}
        className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463' }}
      >
        Submit
      </button>
    </div>
  )
}
