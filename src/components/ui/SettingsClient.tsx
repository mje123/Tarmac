'use client'

import { useState } from 'react'
import { Loader2, ArrowRight, ExternalLink, AlertCircle } from 'lucide-react'

export default function SettingsClient({ hasBilling, isUpgrade }: { hasBilling: boolean; isUpgrade?: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCheckout() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'No checkout URL returned. Check Stripe env vars in Vercel.')
      }
    } catch (e) {
      setError('Network error — could not reach checkout API.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePortal() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Could not open billing portal.')
      }
    } catch {
      setError('Network error — could not reach billing portal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-3">
      {isUpgrade ? (
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="btn-primary flex items-center gap-2 px-6 py-3 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Upgrade to Study Pass — $34.99/mo
        </button>
      ) : (
        <button
          onClick={handlePortal}
          disabled={!hasBilling || loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
          style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
          Manage Billing
        </button>
      )}

      {error && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
    </div>
  )
}
