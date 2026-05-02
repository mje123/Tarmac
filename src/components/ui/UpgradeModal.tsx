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
        body: JSON.stringify({ plan: 'beta_monthly' }),
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
              <div className="mb-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#FFB627] mb-1.5">Beta — 7-Day Free Trial</div>
                <h2 className="text-xl font-bold text-white leading-snug">
                  Start free. Pass on your first try.
                </h2>
                <p className="text-sm text-white/45 mt-1">
                  Try everything free for 7 days — no charge until your trial ends.
                  Then just <span className="text-[#FFB627] font-semibold">$14.99/mo</span>. Cancel anytime.
                </p>
              </div>

              <div className="space-y-2 mb-5">
                {[
                  'All 1,400+ FAA questions — unlimited practice',
                  'AI tutor explains every wrong answer',
                  'Full 60-question timed practice exams',
                  'Real-time progress across all 9 knowledge areas',
                  '7-day free trial — no charge until trial ends',
                ].map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <span className="text-sm text-white/75">{f}</span>
                  </div>
                ))}
              </div>

              {hasPracticed && readiness < 70 && (
                <div
                  className="rounded-xl p-3 mb-4 flex items-start gap-2"
                  style={{ background: 'rgba(255,182,39,0.07)', border: '1px solid rgba(255,182,39,0.2)' }}
                >
                  <span className="text-[#FFB627] text-sm shrink-0">⚡</span>
                  <p className="text-sm text-white/65">
                    You&apos;re at <strong className="text-white">{readiness}%</strong> readiness.
                    Students who use the full question bank pass at 91%.
                  </p>
                </div>
              )}

              {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold tracking-wide transition-opacity disabled:opacity-40 mb-2"
                style={{ background: '#FFB627', color: '#0A1628', boxShadow: '0 4px 16px rgba(255,182,39,0.25)' }}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  : 'START FREE TRIAL — 7 DAYS FREE'}
              </button>

              <p className="text-center text-[10px] text-white/25 mt-2">
                $14.99/mo charged after trial. By starting, you agree to our <a href="/terms" target="_blank" className="underline text-white/35">billing terms</a>.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
