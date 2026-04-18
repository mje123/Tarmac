'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, #0A2463 0%, #0d1f4a 100%)' }}>
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Something went wrong</h2>
        <p className="text-white/50 mb-8">An unexpected error occurred. Please try again.</p>
        <button onClick={reset} className="btn-gold px-8 py-3">
          Try Again
        </button>
      </div>
    </div>
  )
}
