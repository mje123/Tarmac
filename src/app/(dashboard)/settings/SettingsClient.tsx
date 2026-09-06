'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, PAID_STATUSES } from '@/types'
import { Loader2, CheckCircle, AlertTriangle, CreditCard, UserIcon, BadgeCheck, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const PROFANITY_LIST = ['fuck', 'shit', 'ass', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'nigger', 'faggot']
const CALLSIGN_RE = /^[A-Z0-9]{3,12}$/

function hasProfanity(s: string) {
  return PROFANITY_LIST.some(w => s.toLowerCase().includes(w))
}

function planLabel(status: string, expires: string | null): string {
  const expiry = expires ? new Date(expires).toLocaleDateString() : null
  switch (status) {
    case 'tarmac_member': return `TARMAC Membership · $29.99/mo${expiry ? ` · renews ${expiry}` : ''}`
    case 'trialing': return `Free Trial${expiry ? ` · ends ${expiry}` : ''}`
    case 'study_pass': return `TARMAC Member (legacy)${expiry ? ` · expires ${expiry}` : ''}`
    case 'checkride_prep': return `TARMAC Member (legacy)${expiry ? ` · expires ${expiry}` : ''}`
    case 'annual': return `TARMAC Member (annual)${expiry ? ` · expires ${expiry}` : ''}`
    default: return 'Free'
  }
}

interface Props { user: User }

export default function SettingsClient({ user }: Props) {
  const [fullName, setFullName] = useState(user.full_name || '')
  const [callsign, setCallsign] = useState(user.callsign || '')
  const [callsignStatus, setCallsignStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [debriefAnon, setDebriefAnon] = useState(user.debrief_anonymous)
  const [isCfi, setIsCfi] = useState(user.is_cfi)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [portalLoading, setPortalLoading] = useState(false)

  const isPaid = PAID_STATUSES.includes(user.subscription_status)
  const isSubscription = ['tarmac_member', 'trialing'].includes(user.subscription_status)
  const canManageBilling = isPaid // show portal button for ALL paid users, not just those with saved customer ID

  // Callsign availability check (debounced)
  const checkCallsign = useCallback(async (value: string) => {
    if (!value) { setCallsignStatus('idle'); return }
    const upper = value.toUpperCase()
    if (!CALLSIGN_RE.test(upper)) { setCallsignStatus('invalid'); return }
    if (hasProfanity(upper)) { setCallsignStatus('invalid'); return }
    if (upper === user.callsign?.toUpperCase()) { setCallsignStatus('available'); return }
    setCallsignStatus('checking')
    try {
      const res = await fetch(`/api/user/profile?checkCallsign=${encodeURIComponent(upper)}`)
      const data = await res.json()
      setCallsignStatus(data.available ? 'available' : 'taken')
    } catch { setCallsignStatus('idle') }
  }, [user.callsign])

  useEffect(() => {
    const t = setTimeout(() => { if (callsign) checkCallsign(callsign) }, 400)
    return () => clearTimeout(t)
  }, [callsign, checkCallsign])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (callsign && callsignStatus === 'invalid') { setError('Invalid callsign'); return }
    if (callsign && callsignStatus === 'taken') { setError('Callsign already taken'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          callsign: callsign ? callsign.toUpperCase() : null,
          debrief_anonymous: debriefAnon,
          is_cfi: isCfi,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save failed'); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError('Could not open billing portal. Contact support@tarmac.study')
    } finally { setPortalLoading(false) }
  }

  const callsignIndicator = {
    idle: null,
    checking: <Loader2 className="w-3.5 h-3.5 animate-spin text-white/30" />,
    available: <CheckCircle className="w-3.5 h-3.5 text-green-400" />,
    taken: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
    invalid: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-6">Settings</h1>

      <form onSubmit={saveProfile} className="space-y-5">
        {/* Profile */}
        <section className="rounded-xl p-5" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="w-4 h-4" style={{ color: 'var(--text-ter)' }} />
            <h2 className="text-sm font-bold text-white">Profile</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-ter)' }}>Full name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" className="text-sm" />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-ter)' }}>Email</label>
              <input value={user.email} disabled className="text-sm opacity-50 cursor-not-allowed" />
            </div>
          </div>
        </section>

        {/* Community Identity */}
        <section className="rounded-xl p-5" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm">✈️</span>
            <h2 className="text-sm font-bold text-white">Debrief Identity</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-ter)' }}>
                Callsign <span style={{ color: 'var(--text-qua)' }}>(3–12 chars, letters and numbers only)</span>
              </label>
              <div className="relative">
                <input
                  value={callsign}
                  onChange={e => setCallsign(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12))}
                  placeholder="e.g. ALPHA7 or N2381X"
                  maxLength={12}
                  className="text-sm pr-8 font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {callsignIndicator[callsignStatus]}
                </span>
              </div>
              {callsignStatus === 'taken' && <p className="text-xs text-red-400 mt-1">This callsign is already taken</p>}
              {callsignStatus === 'invalid' && <p className="text-xs text-red-400 mt-1">Callsign must be 3–12 letters/numbers, no special characters</p>}
              {callsign && callsignStatus === 'available' && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-ter)' }}>
                  Your comments will appear as: <span className="font-mono font-bold text-white">{callsign.toUpperCase()}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between py-3 px-0">
              <div>
                <p className="text-sm font-medium text-white">Post anonymously</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-ter)' }}>
                  Your Accident Debrief comments will show as "Anonymous Pilot"
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDebriefAnon(v => !v)}
                className="w-11 h-6 rounded-full transition-all shrink-0"
                style={{
                  background: debriefAnon ? 'var(--sky)' : 'var(--surface-3)',
                  position: 'relative',
                }}
              >
                <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: debriefAnon ? '24px' : '4px' }} />
              </button>
            </div>

            <div className="text-xs pt-1" style={{ color: 'var(--text-ter)' }}>
              Preview: Your comments appear as{' '}
              <span className="font-bold" style={{ color: 'var(--text-sec)' }}>
                {debriefAnon ? 'Anonymous Pilot' : (callsign || user.callsign || user.full_name?.split(' ')[0] || 'Pilot')}
              </span>
            </div>
          </div>
        </section>

        {/* CFI */}
        <section className="rounded-xl p-5" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
          <div className="flex items-center gap-2 mb-4">
            <BadgeCheck className="w-4 h-4" style={{ color: 'var(--sky)' }} />
            <h2 className="text-sm font-bold text-white">Flight Instructor</h2>
          </div>
          <div className="flex items-center justify-between py-1">
            <div style={{ flex: 1, paddingRight: '16px' }}>
              <p className="text-sm font-medium text-white" style={{ marginBottom: '2px' }}>I am a Certificated Flight Instructor (CFI)</p>
              <p className="text-xs" style={{ color: 'var(--text-ter)', lineHeight: 1.5 }}>
                Your answers in Ask a CFI will display a CFI badge pending verification.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCfi(v => !v)}
              className="rounded-full transition-all"
              style={{
                width: '44px', height: '24px', flexShrink: 0, position: 'relative',
                background: isCfi ? 'var(--sky)' : 'var(--surface-3)',
              }}
            >
              <span className="absolute top-1 rounded-full bg-white transition-all"
                style={{ width: '16px', height: '16px', left: isCfi ? '24px' : '4px' }} />
            </button>
          </div>
          {user.cfi_verified && (
            <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--sky)' }}>
              <CheckCircle className="w-3.5 h-3.5" /> Verified CFI
            </div>
          )}
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          style={{ background: 'var(--sky)', color: 'white' }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </form>

      {/* Subscription / Billing — ALWAYS shown if has stripe_customer_id */}
      <section className="rounded-xl p-5 mt-5" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4" style={{ color: 'var(--text-ter)' }} />
          <h2 className="text-sm font-bold text-white">Subscription & Billing</h2>
        </div>

        <div className="mb-4">
          <p className="text-sm text-white font-medium mb-0.5">
            {isPaid ? planLabel(user.subscription_status, user.subscription_expires_at) : 'Free plan'}
          </p>
          {user.subscription_status === 'trialing' && user.subscription_expires_at && (
            <p className="text-xs" style={{ color: '#FFB627' }}>
              ⚠ Trial ends {new Date(user.subscription_expires_at).toLocaleDateString()} — cancel before then to avoid charges
            </p>
          )}
        </div>

        {canManageBilling ? (
          <div className="space-y-2">
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: 'var(--surface-2)', color: 'var(--text-pri)', border: '1px solid var(--border-2)' }}
            >
              {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Manage Billing & Cancel Subscription
            </button>
            <p className="text-xs text-center" style={{ color: 'var(--text-ter)' }}>
              Opens Stripe secure billing portal — cancel, update card, or view invoices
            </p>
          </div>
        ) : !isPaid ? (
          <Link href="/upgrade"
            className="block w-full text-center py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'rgba(255,182,39,0.15)', color: '#FFB627', border: '1px solid rgba(255,182,39,0.35)' }}>
            ⚡ Start Free Trial — $29.99/mo
          </Link>
        ) : null}
      </section>

      {/* Danger zone */}
      <section className="rounded-xl p-5 mt-5" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
        <h2 className="text-sm font-bold text-red-400 mb-3">Danger Zone</h2>
        <p className="text-xs mb-3" style={{ color: 'var(--text-ter)' }}>
          To delete your account, email <a href="mailto:support@tarmac.study" className="text-red-400 hover:underline">support@tarmac.study</a> from your registered email address.
        </p>
      </section>
    </div>
  )
}
