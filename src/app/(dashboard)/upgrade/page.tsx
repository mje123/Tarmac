'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function UpgradePage() {
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/stripe/checkout', { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (d.url) {
          window.location.href = d.url
        } else {
          setError(d.error || 'Could not start checkout. Please try from Settings.')
        }
      })
      .catch(() => setError('Network error. Please try again from Settings.'))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      {error ? (
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <a href="/dashboard/settings" className="text-[#3E92CC] underline text-sm">Go to Settings →</a>
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
