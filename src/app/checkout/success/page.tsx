'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle } from 'lucide-react'

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'redirect' | 'login'>('checking')

  useEffect(() => {
    let attempts = 0
    const MAX = 8

    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setStatus('redirect')
        router.replace('/dashboard?checkout=success')
        return
      }
      attempts++
      if (attempts < MAX) {
        setTimeout(check, 600)
      } else {
        setStatus('login')
        router.replace('/login?redirect=/dashboard?checkout=success')
      }
    }

    check()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A2463' }}>
      <div className="text-center">
        {status === 'redirect' ? (
          <>
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-white font-semibold text-lg">You&apos;re in! Taking you to your dashboard…</p>
          </>
        ) : status === 'login' ? (
          <>
            <CheckCircle className="w-12 h-12 text-[#FFB627] mx-auto mb-4" />
            <p className="text-white font-semibold text-lg mb-2">Subscription confirmed!</p>
            <p className="text-white/60 text-sm">Redirecting you to sign in…</p>
          </>
        ) : (
          <>
            <Loader2 className="w-10 h-10 text-[#FFB627] animate-spin mx-auto mb-4" />
            <p className="text-white/70 text-sm">Confirming your subscription…</p>
          </>
        )}
      </div>
    </div>
  )
}
