'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface Props {
  hasBilling: boolean
  isUpgrade?: boolean
}

export default function SettingsClient({ hasBilling, isUpgrade }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function openCheckout() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError(data.error || 'Could not start checkout.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function openBillingPortal() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError(data.error || 'Could not open billing portal.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {isUpgrade ? (
        <button
          onClick={openCheckout}
          disabled={loading}
          className="btn-gold text-sm px-5 py-2 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Upgrade to Study Pass — $34.99/mo
        </button>
      ) : hasBilling ? (
        <button
          onClick={openBillingPortal}
          disabled={loading}
          className="btn-ghost text-sm px-5 py-2 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Manage / Cancel Subscription
        </button>
      ) : (
        <div className="text-white/40 text-xs">No billing account linked. Contact support to manage your subscription.</div>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
