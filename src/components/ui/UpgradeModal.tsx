'use client'

import { useState } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface Props {
  trigger: React.ReactNode
  readiness?: number
  questionsNeeded?: number
}

export default function UpgradeModal({ trigger, readiness = 0, questionsNeeded = 181 }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

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

  const daysToReady = Math.ceil(questionsNeeded / 13)

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">{trigger}</div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="relative w-full max-w-lg my-4 rounded-2xl overflow-hidden animate-fade-in"
            style={{ background: '#0d1a38', border: '1px solid rgba(255,182,39,0.35)' }}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-[#FFB627] mb-2">Full Access — $89</p>
                <h2 className="text-xl font-bold text-white leading-snug">
                  The smartest $89 you&apos;ll spend on flight training.
                </h2>
                <p className="text-sm text-white/50 mt-1">
                  The FAA retake fee is $175. Full access is $89.{' '}
                  <span className="text-white/70 font-medium">The math is obvious.</span>
                </p>
              </div>

              {/* Value stack */}
              <div className="space-y-2.5 mb-6">
                {[
                  'All 1,400+ official FAA questions — no limits',
                  'AI tutor explains the WHY on every wrong answer',
                  'Drill your weakest categories until they\'re locked in',
                  'Full 60-question timed exams, just like the real FAA test',
                  'Real-time progress across all 9 ACS knowledge areas',
                  '90 days of access — more than enough time to pass',
                ].map(f => (
                  <div key={f} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-white/80">{f}</span>
                  </div>
                ))}
              </div>

              {/* Math section */}
              <div
                className="rounded-lg p-4 mb-6"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">The Math</div>
                <div className="space-y-2">
                  {[
                    { label: 'FAA retake fee if you fail', value: '$175', color: '#ef4444' },
                    { label: 'TARMAC full access (90 days)', value: '$89', color: '#FFB627' },
                    { label: 'You save', value: '$86', color: '#22c55e' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-sm text-white/60">{row.label}</span>
                      <span className="text-base font-bold tabular-nums" style={{ color: row.color }}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/40 mt-3">
                  Plus: 2–4 weeks of training time you won&apos;t waste retaking the written.
                </p>
              </div>

              {/* Social proof */}
              <div className="mb-6 grid grid-cols-3 gap-3 text-center">
                {[
                  { stat: '91%', label: 'pass on first attempt' },
                  { stat: '87%', label: 'avg exam score' },
                  { stat: '~2 wks', label: 'avg time to ready' },
                ].map(s => (
                  <div key={s.stat} className="rounded-lg py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-lg font-bold text-white">{s.stat}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Current readiness context */}
              {readiness < 70 && (
                <div
                  className="rounded-lg p-3 mb-5 flex items-start gap-2"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <span className="text-red-400 text-sm font-bold shrink-0">⚠</span>
                  <p className="text-sm text-red-300/80">
                    Your current readiness is <strong className="text-red-400">{readiness}%</strong> — below the FAA passing threshold.
                    With full access and ~{daysToReady} days of practice, you can flip that.
                  </p>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-400 mb-4">{error}</p>
              )}

              {/* CTAs */}
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-opacity disabled:opacity-60 mb-3"
                style={{ background: '#FFB627', color: '#0A1628', boxShadow: '0 4px 20px rgba(255,182,39,0.3)' }}
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'GET FULL ACCESS — $89'}
              </button>

              <button
                onClick={() => setOpen(false)}
                className="w-full py-2.5 rounded-xl text-xs font-medium text-white/30 hover:text-white/60 transition-colors"
              >
                I&apos;ll take my chances with the $175 retake fee
              </button>

              {/* Live proof */}
              <div className="mt-4 pt-4 flex items-center justify-center gap-4 text-[10px] text-white/25" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span>⚡ 247 students upgraded this week</span>
                <span>·</span>
                <span>91% pass rate on first attempt</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
