import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import MarketingNav from '@/components/layout/MarketingNav'
import MarketingFooter from '@/components/layout/MarketingFooter'
import { TARMAC_PLAN } from '@/lib/pricing'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'One membership, both written tests. $29.99/month with a 7-day free trial — Private Pilot and Instrument Rating FAA written test prep included.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#060e1f' }}>
      <MarketingNav />

      <section className="pt-40 pb-24 px-6">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FFB627' }}>Pricing</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Private + Instrument included.</h1>
            <p className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>
              One membership. No tiers. Less than the cost of one FAA retake.
            </p>
          </div>
          <div className="rounded-2xl p-8 relative" style={{ background: 'rgba(255,182,39,0.06)', border: '2px solid rgba(255,182,39,0.5)' }}>
            <div className="text-center mb-6">
              <div className="text-xs font-bold uppercase tracking-widest text-[#FFB627] mb-3">{TARMAC_PLAN.name}</div>
              <div className="flex items-end justify-center gap-1 mb-1">
                <span className="text-5xl font-extrabold text-white">{TARMAC_PLAN.price}</span>
                <span className="text-white/40 text-lg mb-1">{TARMAC_PLAN.period}</span>
              </div>
              <p className="text-sm text-green-400 font-semibold mt-1">7 days free — no charge until trial ends</p>
            </div>
            <ul className="space-y-3 mb-8">
              {TARMAC_PLAN.features.map(f => (
                <li key={f} className="flex items-start gap-3 text-sm text-white/75">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
            <Link href="/start" className="btn-gold block w-full text-center py-4 rounded-xl font-bold text-base">
              Start Free Trial
            </Link>
            <p className="text-center text-xs text-white/25 mt-3">
              Cancel before 7 days — you won&apos;t be charged
            </p>
          </div>
          <p className="text-center text-xs mt-8" style={{ color: 'rgba(255,255,255,0.25)' }}>
            TARMAC is not affiliated with or endorsed by the FAA, and cannot guarantee a passing score.
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
