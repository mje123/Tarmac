'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle } from 'lucide-react'

const PLANS = [
  {
    id: 'quick_prep',
    name: 'Quick Prep',
    price: '$69',
    period: 'one-time',
    duration: '60-day access',
    features: ['All 1,400+ questions', 'AI tutor on every question', 'Progress by knowledge area', 'Timed practice exams'],
    accent: 'rgba(255,255,255,0.15)',
    cta: 'Get Quick Prep',
    ctaStyle: { border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', background: 'transparent' },
  },
  {
    id: 'study_pass',
    name: 'Study Pass',
    price: '$89',
    period: 'one-time',
    duration: '90 days · Half the cost of failing',
    features: ['All 1,400+ questions', 'AI tutor — unlimited follow-ups', 'Progress by knowledge area', 'Unlimited timed exams', 'FAA supplement figures'],
    accent: '#FFB627',
    badge: 'Most Popular',
    cta: 'Get Study Pass',
    ctaStyle: { background: '#FFB627', color: '#0A1628', fontWeight: 700 },
    highlight: true,
  },
  {
    id: 'founding_member',
    name: 'Founding Member',
    price: '$199',
    period: 'one-time',
    duration: 'Lifetime access',
    features: ['Everything in Study Pass', 'Lifetime access', 'Future ratings included†', 'Price locks in now'],
    accent: '#5ab8f5',
    note: 'Increases to $299 at Instrument launch.',
    cta: 'Get Founding Member',
    ctaStyle: { background: 'rgba(90,184,245,0.12)', border: '1px solid rgba(90,184,245,0.3)', color: '#5ab8f5' },
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$44.99',
    period: '/mo',
    duration: 'Cancel anytime',
    features: ['All 1,400+ questions', 'AI tutor on every question', 'Progress by knowledge area', 'Timed practice exams'],
    accent: 'rgba(255,255,255,0.15)',
    cta: 'Get Monthly',
    ctaStyle: { border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', background: 'transparent' },
  },
]

function UpgradeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = searchParams.get('plan')
  const [error, setError] = useState('')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  // If a plan was passed directly, auto-checkout
  useEffect(() => {
    if (!plan) return
    setLoadingPlan(plan)
    fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.url) window.location.href = d.url
        else setError(d.error || 'Could not start checkout. Please try again.')
      })
      .catch(() => setError('Network error. Please try again.'))
  }, [plan])

  async function handleSelect(planId: string) {
    setLoadingPlan(planId)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Could not start checkout.')
        setLoadingPlan(null)
      }
    } catch {
      setError('Network error. Please try again.')
      setLoadingPlan(null)
    }
  }

  // Show spinner while auto-redirecting
  if (plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {error ? (
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={() => router.push('/upgrade')} className="text-[#3E92CC] underline text-sm">
              Choose a plan →
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-white/60">
            <Loader2 className="w-8 h-8 animate-spin text-[#FFB627]" />
            <p className="text-sm">Redirecting to checkout...</p>
          </div>
        )}
      </div>
    )
  }

  // Plan selection UI
  return (
    <div className="px-4 md:px-8 py-10 max-w-5xl mx-auto animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-white mb-2">Unlock Full Access</h1>
          <p className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>
            The FAA retake fee is $175. Pick the plan that makes sense.
          </p>
        </div>

        {error && (
          <p className="text-center text-red-400 text-sm mb-6">{error}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {PLANS.map(p => (
            <div
              key={p.id}
              className="rounded-2xl p-6 flex flex-col relative"
              style={{
                background: p.highlight ? 'rgba(255,182,39,0.06)' : 'rgba(255,255,255,0.04)',
                border: p.highlight ? `2px solid ${p.accent}` : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {p.badge && (
                <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                  <span
                    className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{ background: p.accent as string, color: '#0A1628' }}
                  >
                    {p.badge}
                  </span>
                </div>
              )}

              <div className={p.badge ? 'mt-3 mb-5' : 'mb-5'}>
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: p.accent as string }}>
                  {p.name}
                </div>
                <div className="flex items-baseline gap-0.5 mb-1">
                  <span className="text-3xl font-extrabold text-white">{p.price}</span>
                  <span className="text-sm ml-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{p.period}</span>
                </div>
                <p className="text-xs font-medium" style={{ color: p.highlight ? (p.accent as string) : 'rgba(255,255,255,0.3)' }}>
                  {p.duration}
                </p>
              </div>

              <ul className="space-y-2 flex-1 mb-5">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: p.highlight ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.55)' }}>
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: p.accent as string }} />
                    {f}
                  </li>
                ))}
              </ul>

              {p.note && (
                <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>{p.note}</p>
              )}

              <button
                onClick={() => handleSelect(p.id)}
                disabled={!!loadingPlan}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                style={p.ctaStyle as React.CSSProperties}
              >
                {loadingPlan === p.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                ) : p.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.15)' }}>
          †Instrument, Commercial &amp; CFI prep coming soon. Founding members get access at no extra cost.
          All one-time sales final. Not affiliated with the FAA.
        </p>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFB627]" />
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  )
}
