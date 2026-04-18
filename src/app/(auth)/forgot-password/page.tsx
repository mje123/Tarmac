'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="animate-fade-in text-center">
        <div className="glass-card p-10">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Email sent</h2>
          <p className="text-white/60">Check {email} for a password reset link.</p>
          <Link href="/login" className="btn-primary mt-6 inline-flex justify-center">Back to sign in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Reset your password</h1>
        <p className="text-white/60">We'll send you a link to reset it</p>
      </div>
      <div className="glass-card p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          {error && (
            <div className="px-4 py-3 rounded-lg text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
          </button>
        </form>
      </div>
      <p className="text-center mt-6 text-white/60 text-sm">
        Remember your password? <Link href="/login" className="text-[#3E92CC] font-medium">Sign in</Link>
      </p>
    </div>
  )
}
