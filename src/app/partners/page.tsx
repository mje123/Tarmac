'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Loader2, ArrowLeft } from 'lucide-react'

export default function PartnersPage() {
  const [form, setForm] = useState({
    name: '', email: '', instagram_handle: '', tiktok_handle: '', youtube_handle: '',
    other_platforms: '', requested_code: '', audience_size: '', why_tarmac: '',
  })
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/influencer-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSuccess(true)
      } else {
        const d = await res.json()
        setError(d.error || 'Something went wrong. Try again.')
      }
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #051237 0%, #0A2463 60%, #0d2d6b 100%)' }}>
      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between max-w-3xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="TARMAC" width={32} height={32} />
          <span className="font-bold text-white text-lg tracking-tight">TARMAC</span>
        </Link>
        <Link href="/" className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </nav>

      <main className="px-6 py-10 max-w-2xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#FFB627] mb-3 block">Creator Program</span>
          <h1 className="text-4xl font-extrabold text-white mb-3">Partner with TARMAC</h1>
          <p className="text-white/60 text-base leading-relaxed">
            Share TARMAC with your audience — they get <strong className="text-white">30% off</strong> their first month,
            you earn <strong className="text-white">30% commission</strong> (~$7.35 per referral). Commission-only, no guarantees.
          </p>
        </div>

        {success ? (
          <div className="glass-card p-10 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Application received!</h2>
            <p className="text-white/60 mb-6">We'll review your application and reach out if it's a fit. Thanks for your interest in partnering with TARMAC.</p>
            <Link href="/" className="text-[#3E92CC] hover:text-[#5aabdf] text-sm font-medium">← Back to TARMAC</Link>
          </div>
        ) : (
          <div className="glass-card p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Full Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" required />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Instagram</label>
                  <input type="text" value={form.instagram_handle} onChange={e => setForm(p => ({ ...p, instagram_handle: e.target.value }))} placeholder="@yourhandle" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">TikTok</label>
                  <input type="text" value={form.tiktok_handle} onChange={e => setForm(p => ({ ...p, tiktok_handle: e.target.value }))} placeholder="@yourhandle" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">YouTube</label>
                  <input type="text" value={form.youtube_handle} onChange={e => setForm(p => ({ ...p, youtube_handle: e.target.value }))} placeholder="Channel name" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Other Platforms</label>
                  <input type="text" value={form.other_platforms} onChange={e => setForm(p => ({ ...p, other_platforms: e.target.value }))} placeholder="Twitter, podcast, blog…" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Audience Size</label>
                  <input type="text" value={form.audience_size} onChange={e => setForm(p => ({ ...p, audience_size: e.target.value }))} placeholder="e.g. 5,000 followers" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Requested Promo Code *</label>
                <input type="text" value={form.requested_code} onChange={e => setForm(p => ({ ...p, requested_code: e.target.value.toUpperCase() }))} placeholder="e.g. YOURNAME30" required style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }} />
                <p className="text-white/35 text-xs mt-1">Your audience gets 30% off their first month with this code.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Why do you want to partner with TARMAC?</label>
                <textarea value={form.why_tarmac} onChange={e => setForm(p => ({ ...p, why_tarmac: e.target.value }))} placeholder="Tell us about your audience and why TARMAC would resonate…" rows={3} />
              </div>

              {/* Legal */}
              <div className="rounded-xl p-4 text-xs text-white/50 leading-relaxed space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-white/70 font-semibold text-sm">Partnership Terms — TARMAC by Legion Systems LLC</p>
                <p>By submitting this application, you acknowledge and agree to all of the following:</p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>This application does <strong className="text-white/70">not</strong> guarantee acceptance or promo code approval.</li>
                  <li>If accepted, you earn a <strong className="text-white/70">30% commission on the first month's payment only</strong> (~$7.35/referral). No minimums, no ongoing commissions.</li>
                  <li>Commissions are paid via <strong className="text-white/70">Venmo or a mutually agreed platform</strong>. You must contact TARMAC to confirm payment details — TARMAC does not initiate payment automatically.</li>
                  <li>TARMAC may <strong className="text-white/70">modify, pause, or terminate the program at any time</strong> without notice.</li>
                  <li>You are an <strong className="text-white/70">independent creator</strong>, not an employee or agent of TARMAC.</li>
                  <li>You agree to <strong className="text-white/70">clearly disclose this partnership</strong> in every post, video, or story featuring your code, per FTC guidelines.</li>
                  <li>You will not make claims beyond what is stated on TARMAC's website, and will not guarantee exam results.</li>
                  <li>All commission disputes are subject to TARMAC's sole discretion. TARMAC's records are authoritative.</li>
                  <li>TARMAC may deactivate your promo code at any time without liability.</li>
                </ul>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '16px 1fr', gap: '12px', alignItems: 'start' }}>
                <input
                  id="inf-terms"
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: '#FFB627', flexShrink: 0 }}
                  required
                />
                <label htmlFor="inf-terms" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', cursor: 'pointer', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  I have read and agree to the partnership terms above. I understand this is a commission-only arrangement with no guaranteed earnings, and that Legion Systems LLC may modify or terminate the program at any time.
                </label>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-lg text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading || !agreed} className="btn-gold w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Application'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
