'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, ExternalLink } from 'lucide-react'
import { TARMAC_PLAN } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/client'
import { PAID_STATUSES } from '@/types'

function UpgradeContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')
  const [trialEligible, setTrialEligible] = useState<boolean | null>(null)
  const [alreadySubscribed, setAlreadySubscribed] = useState(false)
  const [canManageBilling, setCanManageBilling] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setTrialEligible(true); return }
      supabase.from('users').select('stripe_customer_id,subscription_status').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.subscription_status && PAID_STATUSES.includes(data.subscription_status as never)) {
            setAlreadySubscribed(true)
            setCanManageBilling(!!data.stripe_customer_id)
            return
          }
          setTrialEligible(!data?.stripe_customer_id)
          setCanManageBilling(!!data?.stripe_customer_id)
        })
    })
  }, [router])

  async function startCheckout() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError(data.error || 'Could not start checkout. Please try again.')
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError('Could not open billing portal.')
    } finally { setPortalLoading(false) }
  }

  if (alreadySubscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full rounded-2xl p-8 text-center"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
          <h2 className="text-xl font-bold text-white mb-2">You're already a member</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-sec)' }}>
            You have full access to all TARMAC features.
          </p>
          <div className="space-y-2">
            <button onClick={() => router.push('/dashboard')}
              className="w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: 'var(--sky)', color: 'white' }}>
              Go to Dashboard
            </button>
            {canManageBilling && (
              <button onClick={openPortal} disabled={portalLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'var(--surface-2)', color: 'var(--text-sec)', border: '1px solid var(--border-2)' }}>
                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Manage Billing
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">TARMAC Membership</h1>
          <p className="text-sm" style={{ color: 'var(--text-sec)' }}>
            {trialEligible
              ? 'Start free for 7 days. Cancel anytime before the trial ends.'
              : 'Full access to everything TARMAC.'}
          </p>
        </div>

        <div className="rounded-2xl p-6 mb-5"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-black text-white">$29.99</span>
            <span className="text-sm" style={{ color: 'var(--text-ter)' }}>/month</span>
          </div>
          {trialEligible && (
            <p className="text-sm mb-5" style={{ color: '#FFB627' }}>7 days free, then $29.99/mo · Cancel anytime</p>
          )}

          <div className="space-y-2.5 mb-6">
            {TARMAC_PLAN.features.map(f => (
              <div key={f} className="flex items-start gap-2.5 text-sm">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--sky)' }} />
                <span style={{ color: 'var(--text-sec)' }}>{f}</span>
              </div>
            ))}
          </div>

          <button
            onClick={startCheckout}
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'var(--sky)', color: 'white' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {trialEligible ? 'Start Free Trial' : 'Subscribe — $29.99/mo'}
          </button>

          {error && <p className="text-xs text-red-400 mt-3 text-center">{error}</p>}

          <p className="text-xs text-center mt-3" style={{ color: 'var(--text-ter)' }}>
            Secure checkout via Stripe · Cancel anytime from Settings
          </p>
        </div>
      </div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>}>
      <UpgradeContent />
    </Suspense>
  )
}
