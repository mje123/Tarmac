'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle } from 'lucide-react'
import { isBeta, BETA_PLAN, FULL_PLANS } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/client'

function UpgradeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = searchParams.get('plan')
  const [error, setError] = useState('')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [trialEligible, setTrialEligible] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setTrialEligible(true); return }
      supabase.from('users').select('stripe_customer_id, subscription_status').eq('id', user.id).single()
        .then(({ data }) => {
          // Eligible for trial only if they've never been through Stripe checkout
          setTrialEligible(!data?.stripe_customer_id)
        })
    })
  }, [])

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

  if (isBeta) {
    if (trialEligible === null) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFB627]" />
        </div>
      )
    }

    return (
      <div className="px-4 md:px-8 py-12 max-w-lg mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block" style={{ background: 'rgba(255,182,39,0.15)', color: '#FFB627', border: '1px solid rgba(255,182,39,0.3)' }}>
            BETA
          </span>
          <h1 className="text-3xl font-extrabold text-white mb-2 mt-3">
            {trialEligible ? 'Start Your Free Trial' : 'Get Tarmac Membership'}
          </h1>
          <p className="text-white/50">
            {trialEligible ? BETA_PLAN.tagline : `$${BETA_PLAN.price.replace('$', '')}${BETA_PLAN.period} — cancel anytime`}
          </p>
        </div>

        {error && <p className="text-center text-red-400 text-sm mb-6">{error}</p>}

        <div
          className="rounded-2xl p-8"
          style={{ background: 'rgba(255,182,39,0.06)', border: '2px solid rgba(255,182,39,0.4)' }}
        >
          <div className="text-center mb-6">
            <div className="text-xs font-bold uppercase tracking-widest text-[#FFB627] mb-3">{BETA_PLAN.name}</div>
            <div className="flex items-end justify-center gap-1 mb-1">
              <span className="text-5xl font-extrabold text-white">{BETA_PLAN.price}</span>
              <span className="text-white/40 text-lg mb-1">{BETA_PLAN.period}</span>
            </div>
            {trialEligible
              ? <p className="text-sm text-green-400 font-semibold">7 days free — no charge until trial ends</p>
              : <p className="text-sm text-white/50">Billed monthly — cancel anytime</p>
            }
          </div>

          <ul className="space-y-3 mb-8">
            {BETA_PLAN.features
              .filter(f => trialEligible || !f.includes('free trial'))
              .map(f => (
                <li key={f} className="flex items-start gap-3 text-sm text-white/75">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
          </ul>

          <button
            onClick={() => handleSelect(BETA_PLAN.stripePlanKey)}
            disabled={!!loadingPlan}
            className="w-full py-4 rounded-xl text-base font-bold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#FFB627', color: '#0A1628', boxShadow: '0 4px 20px rgba(255,182,39,0.3)' }}
          >
            {loadingPlan
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              : trialEligible ? 'Start Free Trial' : 'Subscribe — $14.99/mo'
            }
          </button>

          <p className="text-center text-xs text-white/25 mt-4">
            {trialEligible
              ? "Cancel anytime before trial ends — you won't be charged"
              : 'Cancel anytime from your account settings'}
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.15)' }}>
          Not affiliated with the FAA. Beta pricing subject to change.
        </p>
      </div>
    )
  }

  // Full pricing (non-beta)
  return (
    <div className="px-4 md:px-8 py-10 max-w-5xl mx-auto animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-white mb-2">Unlock Full Access</h1>
        <p className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>
          The FAA retake fee is $175. Pick the plan that makes sense.
        </p>
      </div>

      {error && <p className="text-center text-red-400 text-sm mb-6">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {FULL_PLANS.map(p => (
          <div
            key={p.id}
            className="rounded-2xl p-6 flex flex-col relative"
            style={{
              background: p.highlighted ? 'rgba(255,182,39,0.06)' : 'rgba(255,255,255,0.04)',
              border: p.highlighted ? '2px solid rgba(255,182,39,0.5)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {p.badge && (
              <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: '#FFB627', color: '#0A1628' }}>
                  {p.badge}
                </span>
              </div>
            )}

            <div className={p.badge ? 'mt-3 mb-5' : 'mb-5'}>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: p.highlighted ? '#FFB627' : 'rgba(255,255,255,0.35)' }}>
                {p.name}
              </div>
              <div className="flex items-baseline gap-0.5 mb-1">
                <span className="text-3xl font-extrabold text-white">{p.price}</span>
                <span className="text-sm ml-1 text-white/35">{p.period}</span>
              </div>
              <p className="text-xs font-medium" style={{ color: p.highlighted ? '#FFB627' : 'rgba(255,255,255,0.3)' }}>
                {p.duration}
              </p>
            </div>

            <ul className="space-y-2 flex-1 mb-5">
              {p.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: p.highlighted ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.55)' }}>
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: p.highlighted ? '#FFB627' : 'rgba(255,255,255,0.3)' }} />
                  {f}
                </li>
              ))}
            </ul>

            {'note' in p && p.note && (
              <p className="text-xs mb-3 text-white/20">{p.note}</p>
            )}

            <button
              onClick={() => handleSelect(p.id)}
              disabled={!!loadingPlan}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={p.highlighted
                ? { background: '#FFB627', color: '#0A1628' }
                : { border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', background: 'transparent' }
              }
            >
              {loadingPlan === p.id ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</> : `Get ${p.name}`}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs mt-6 text-white/15">
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
