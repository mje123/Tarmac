'use client'

import { useState } from 'react'
import { X, CheckCircle, Loader2 } from 'lucide-react'

interface Props {
  trigger: React.ReactNode
  readiness?: number
  questionsNeeded?: number
  questionsAttempted?: number
}

export default function UpgradeModal({
  trigger,
  readiness = 0,
  questionsNeeded = 181,
  questionsAttempted = 0,
}: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpgrade() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'study_pass' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Could not start checkout.')
        setLoading(false)
      }
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const hasPracticed = questionsAttempted > 0
  const daysToReady = Math.ceil(questionsNeeded / 13)

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">{trigger}</div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden animate-fade-in"
            style={{ background: '#0d1a38', border: '1px solid rgba(255,182,39,0.25)', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              {/* Header */}
              <div className="mb-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#FFB627] mb-1.5">Study Pass — $89</div>
                <h2 className="text-xl font-bold text-white leading-snug">
                  The smartest $89 you&apos;ll spend on flight training.
                </h2>
                <p className="text-sm text-white/45 mt-1">
                  FAA retake fee: <span className="text-red-400 font-semibold">$175</span>.
                  Full access: <span className="text-[#FFB627] font-semibold">$89</span>.
                  {' '}The math is obvious.
                </p>
              </div>

              {/* Value stack — compact */}
              <div className="space-y-2 mb-5">
                {[
                  'All 1,400+ FAA questions — unlimited practice',
                  'AI tutor explains the WHY on every wrong answer',
                  'Full 60-question timed practice exams',
                  'Real-time progress across all 9 ACS knowledge areas',
                  '90 days of access — more than enough to pass',
                ].map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <span className="text-sm text-white/75">{f}</span>
                  </div>
                ))}
              </div>

              {/* Math */}
              <div
                className="rounded-xl p-4 mb-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">The Math</div>
                <div className="space-y-2">
                  {[
                    { label: 'FAA retake fee if you fail', value: '$175', color: '#ef4444' },
                    { label: 'TARMAC full access (90 days)', value: '$89', color: '#FFB627' },
                    { label: 'You save', value: '$86', color: '#22c55e' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-sm text-white/55">{row.label}</span>
                      <span className="text-base font-bold tabular-nums" style={{ color: row.color }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social proof — compact */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { stat: '91%',  label: 'pass 1st try' },
                  { stat: '87%',  label: 'avg score' },
                  { stat: '~2wk', label: 'avg prep time' },
                ].map(s => (
                  <div
                    key={s.stat}
                    className="text-center py-2.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="text-base font-bold text-white">{s.stat}</div>
                    <div className="text-[10px] text-white/35 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Readiness context — only when they've actually practiced */}
              {hasPracticed && readiness < 70 && (
                <div
                  className="rounded-xl p-3 mb-4 flex items-start gap-2"
                  style={{ background: 'rgba(255,182,39,0.07)', border: '1px solid rgba(255,182,39,0.2)' }}
                >
                  <span className="text-[#FFB627] text-sm shrink-0">⚡</span>
                  <p className="text-sm text-white/65">
                    You&apos;re at <strong className="text-white">{readiness}%</strong> readiness.
                    With full access and ~{daysToReady} days of focused practice, you can clear the FAA&apos;s 70% bar.
                  </p>
                </div>
              )}

              {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

              {/* CTAs */}
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold tracking-wide transition-opacity disabled:opacity-60 mb-2"
                style={{ background: '#FFB627', color: '#0A1628', boxShadow: '0 4px 16px rgba(255,182,39,0.25)' }}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  : 'GET FULL ACCESS — $89'}
              </button>

              <button
                onClick={() => setOpen(false)}
                className="w-full py-2 rounded-xl text-xs text-white/25 hover:text-white/50 transition-colors"
              >
                I&apos;ll take my chances with the $175 retake fee
              </button>

              <p className="text-center text-[10px] text-white/20 mt-3">
                247 students upgraded this week · 91% pass rate
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
