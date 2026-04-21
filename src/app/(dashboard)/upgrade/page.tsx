'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function UpgradeContent() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'study_pass'
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.url) {
          window.location.href = d.url
        } else {
          setError(d.error || 'Could not start checkout. Please try from Settings.')
        }
      })
      .catch(() => setError('Network error. Please try again from Settings.'))
  }, [plan])

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
