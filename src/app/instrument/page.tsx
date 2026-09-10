import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CheckCircle, Sparkles, RefreshCw, Brain, Clock, Route } from 'lucide-react'
import MarketingNav from '@/components/layout/MarketingNav'
import MarketingFooter from '@/components/layout/MarketingFooter'

export const metadata: Metadata = {
  title: 'Instrument Rating Written Test Prep (IRA)',
  description: 'Stop memorizing IFR questions. AI-generated approach, holding, navigation, and weather scenarios for the FAA Instrument Rating Airplane written exam.',
}

const STEPS = [
  { icon: Sparkles, title: 'Diagnostic', body: 'A short mixed-topic assessment across IFR regulations, navigation, approaches, weather, and systems finds your real starting point.' },
  { icon: Brain, title: 'Concept training', body: 'Weak areas — approach minimums, alternate requirements, holding — get a short explanation and a worked example before you\'re asked to apply it.' },
  { icon: RefreshCw, title: 'AI-generated practice', body: 'New approach scenarios, new weather, new navigation situations — generated from the same verified FAA source material, not a fixed bank.' },
  { icon: CheckCircle, title: 'Novel-question mode', body: 'Scenario-based decision-making built to look unfamiliar — the real test of whether you can apply IFR rules, not just recall them.' },
  { icon: Clock, title: 'Timed exams', body: 'Full-length, timed simulations of the FAA Instrument Rating written — fresh question set every attempt.' },
  { icon: Route, title: 'Test Runway', body: 'A structured day-by-day arc from diagnostic to test-ready, weighted toward your weakest IFR concepts.' },
]

export default function InstrumentPage() {
  return (
    <div className="min-h-screen" style={{ background: '#060e1f' }}>
      <MarketingNav />

      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/mountains.jpeg" alt="" fill className="object-cover object-center opacity-25" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(6,14,31,0.7), rgba(6,14,31,0.85) 60%, #060e1f 100%)' }} />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-7 text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'rgba(255,182,39,0.12)', border: '1px solid rgba(255,182,39,0.25)', color: '#FFB627' }}>
            Instrument Rating Airplane (IRA)
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
            Instrument written<br />test prep.
          </h1>
          <p className="text-lg leading-relaxed mb-10 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Stop memorizing IFR questions. Learn to solve them — approaches, holding, navigation, weather, and alternate requirements, trained through scenario-based decision-making.
          </p>
          <Link href="/start?exam=ifr" className="btn-gold inline-flex px-8 py-4 rounded-xl text-base font-bold">
            Start Instrument Prep <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <section className="py-20 px-6" style={{ background: '#0d1a38' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FFB627' }}>What's included</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Everything for the IFR written, in order.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 divide-x divide-y rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            {STEPS.map(s => (
              <div key={s.title} className="p-7" style={{ background: '#0d1a38' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,182,39,0.15)' }}>
                  <s.icon className="w-5 h-5 text-[#FFB627]" />
                </div>
                <h3 className="font-bold text-white mb-2 text-sm">{s.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 text-center" style={{ background: '#060e1f' }}>
        <h2 className="text-3xl font-extrabold text-white mb-4">Start your Instrument prep, free.</h2>
        <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>7-day free trial. Private + Instrument both included.</p>
        <Link href="/start?exam=ifr" className="btn-gold inline-flex px-8 py-4 rounded-xl text-base font-bold">
          Start Instrument Prep <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      <MarketingFooter />
    </div>
  )
}
