'use client'

import { useState } from 'react'
import { Loader2, ArrowRight, ExternalLink } from 'lucide-react'

export default function SettingsClient({ hasBilling, isUpgrade }: { hasBilling: boolean; isUpgrade?: boolean }) {
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setLoading(false)
    }
  }

  async function handlePortal() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setLoading(false)
    }
  }

  if (isUpgrade) {
    return (
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="btn-primary flex items-center gap-2 px-6 py-3 text-sm font-semibold disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        Upgrade to Study Pass
      </button>
    )
  }

  return (
    <button
      onClick={handlePortal}
      disabled={!hasBilling || loading}
      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
      style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
      Manage Billing
    </button>
  )
}
