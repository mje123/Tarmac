'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, X } from 'lucide-react'

export default function CheckoutSuccessBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setShow(true)
      // Clean URL without reloading
      const url = new URL(window.location.href)
      url.searchParams.delete('checkout')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  if (!show) return null

  return (
    <div className="flex items-center gap-3 px-5 py-4 rounded-xl mb-6 animate-fade-in"
      style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
      <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
      <div className="flex-1">
        <div className="text-white font-semibold text-sm">Welcome to Study Pass!</div>
        <div className="text-white/60 text-xs mt-0.5">Your subscription is active. Full access unlocked — let's get you test-ready. ✈️</div>
      </div>
      <button onClick={() => setShow(false)} className="text-white/40 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
