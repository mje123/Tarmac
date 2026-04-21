'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')

  // Always redirect to /start so users go through the quiz
  useEffect(() => {
    router.replace(plan ? `/start?plan=${plan}` : '/start')
  }, [router, plan])

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [marketingEmails, setMarketingEmails] = useState(true)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, marketing_emails: marketingEmails },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (!marketingEmails && data.user) {
      await supabase.from('users').update({ marketing_emails: false }).eq('id', data.user.id)
    }

    if (data.session) {
      router.push(plan ? `/upgrade?plan=${plan}` : '/dashboard')
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <span className="text-3xl">✉️</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Check your email</h1>
        <p className="text-white/60 mb-6">We sent a confirmation link to <strong className="text-white">{email}</strong>. Click it to activate your account.</p>
        <Link href="/login" className="text-[#3E92CC] hover:text-[#5aabdf] text-sm font-medium">Back to login →</Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
        <p className="text-white/60">
          {plan === 'monthly' ? 'Getting started with Monthly ($44.99/mo)' :
           plan === 'quick_prep' ? 'Getting started with Quick Prep ($69)' :
           plan === 'study_pass' ? 'Getting started with Study Pass ($89)' :
           plan === 'founding_member' ? 'Getting started with Founding Member ($199)' :
           'Start with 10 free questions'}
        </p>
      </div>

      <div className="glass-card p-6 md:p-8">
        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="John Smith"
              required
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '16px 1fr', gap: '12px', alignItems: 'start' }}>
            <input
              id="terms"
              type="checkbox"
              checked={agreedToTerms}
              onChange={e => setAgreedToTerms(e.target.checked)}
              style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#FFB627', flexShrink: 0 }}
              required
            />
            <label htmlFor="terms" className="text-xs text-white/60 leading-relaxed cursor-pointer" style={{ wordBreak: 'break-word', minWidth: 0 }}>
              I have read and agree to the{' '}
              <Link href="/terms" target="_blank" className="text-[#3E92CC] underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" target="_blank" className="text-[#3E92CC] underline">Privacy Policy</Link>.
              I understand that <strong className="text-white/80">all sales are final and non-refundable</strong>, and that TARMAC does not guarantee passing any FAA exam.
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '16px 1fr', gap: '12px', alignItems: 'start' }}>
            <input
              id="marketing"
              type="checkbox"
              checked={marketingEmails}
              onChange={e => setMarketingEmails(e.target.checked)}
              style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#FFB627', flexShrink: 0 }}
            />
            <label htmlFor="marketing" className="text-xs text-white/60 leading-relaxed cursor-pointer" style={{ wordBreak: 'break-word', minWidth: 0 }}>
              Send me weekly progress updates and study tips. Unsubscribe anytime.
            </label>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !agreedToTerms} className="btn-gold w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
          </button>
        </form>
      </div>

      <p className="text-center mt-6 text-white/60 text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-[#3E92CC] hover:text-[#5aabdf] font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="animate-fade-in text-center text-white/60 py-10">Loading...</div>}>
      <SignupForm />
    </Suspense>
  )
}
