'use client'

import { useState } from 'react'
import { User, PAID_STATUSES } from '@/types'
import { Loader2, CheckCircle, AlertTriangle, CreditCard, UserIcon, KeyRound, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [portalLoading, setPortalLoading] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')

  const isPaid = PAID_STATUSES.includes(user.subscription_status)
  const isSubscription = ['tarmac_member', 'trialing'].includes(user.subscription_status)
  const canManageBilling = isPaid // show portal button for ALL paid users, not just those with saved customer ID

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save failed'); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (newPassword.length < 8) { setPwError('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return }
    setPwSaving(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) { setPwError(updateError.message); return }
      setNewPassword('')
      setConfirmPassword('')
      setPwSaved(true)
      setTimeout(() => setPwSaved(false), 2000)
    } finally { setPwSaving(false) }
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

      {/* Password */}
      <form onSubmit={changePassword} className="rounded-xl p-5 mt-5" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-4 h-4" style={{ color: 'var(--text-ter)' }} />
          <h2 className="text-sm font-bold text-white">Change Password</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-ter)' }}>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-ter)' }}>Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              autoComplete="new-password"
              className="text-sm"
            />
          </div>
        </div>
        {pwError && <p className="text-sm text-red-400 mt-3">{pwError}</p>}
        <button
          type="submit"
          disabled={pwSaving || !newPassword || !confirmPassword}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 mt-4"
          style={{ background: 'var(--surface-2)', color: 'var(--text-pri)', border: '1px solid var(--border-2)' }}
        >
          {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : pwSaved ? <CheckCircle className="w-4 h-4" /> : null}
          {pwSaved ? 'Password updated!' : 'Update Password'}
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
