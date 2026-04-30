'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

function UpdatePasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exchanging, setExchanging] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setError('Invalid or expired reset link. Please request a new one.')
      setExchanging(false)
      return
    }
    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setError('This reset link has expired or already been used. Please request a new one.')
      }
      setExchanging(false)
    })
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2500)
    }
  }

  if (exchanging) {
    return (
      <div className="glass-card p-10 text-center">
        <Loader2 className="w-8 h-8 text-[#FFB627] animate-spin mx-auto mb-3" />
        <p className="text-white/50 text-sm">Verifying your reset link…</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="glass-card p-10 text-center animate-fade-in">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Password updated</h2>
        <p className="text-white/50 text-sm">Taking you to your dashboard…</p>
      </div>
    )
  }

  if (error && !password) {
    return (
      <div className="glass-card p-10 text-center animate-fade-in">
        <div className="px-4 py-3 rounded-lg text-sm text-red-300 mb-6" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
        <Link href="/forgot-password" className="btn-primary inline-flex justify-center">
          Request New Link
        </Link>
      </div>
    )
  }

  return (
    <div className="glass-card p-8 animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
              style={{ paddingRight: '48px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Confirm Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat your new password"
            required
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Set New Password'}
        </button>
      </form>
    </div>
  )
}

export default function UpdatePasswordPage() {
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Set a new password</h1>
        <p className="text-white/60">Choose something you'll actually remember this time</p>
      </div>
      <Suspense fallback={
        <div className="glass-card p-10 text-center">
          <Loader2 className="w-8 h-8 text-[#FFB627] animate-spin mx-auto" />
        </div>
      }>
        <UpdatePasswordForm />
      </Suspense>
    </div>
  )
}
