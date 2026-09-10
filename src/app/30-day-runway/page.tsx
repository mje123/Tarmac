import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Search, Hammer, Layers, Repeat, ClipboardCheck, Award } from 'lucide-react'
import MarketingNav from '@/components/layout/MarketingNav'
import MarketingFooter from '@/components/layout/MarketingFooter'

export const metadata: Metadata = {
  title: 'The Test Runway',
  description: '30 days from first question to test-ready — a diagnostic, foundation, application, transfer, and simulation arc for the FAA Private Pilot and Instrument written tests.',
}

const PHASES = [
  { days: 'Days 1–3', title: 'Diagnostic', color: '#3E92CC', icon: Search, body: 'A broad mix of questions across every knowledge area establishes your real starting point — accuracy, recurring errors, and where you can already apply knowledge to a new scenario.' },
  { days: 'Days 4–10', title: 'Foundation', color: '#8B5CF6', icon: Hammer, body: 'Weak concepts get a short explanation, a worked example, a retrieval question, and a novel scenario — with immediate feedback and a scheduled review, not a wall of reading.' },
  { days: 'Days 11–17', title: 'Application', color: '#FFB627', icon: Layers, body: 'Scenario complexity increases. Questions start combining concepts — weather with airspace, navigation with performance — forcing you to figure out what knowledge actually applies.' },
  { days: 'Days 18–23', title: 'Transfer', color: '#5ab8f5', icon: Repeat, body: 'Wording, numbers, scenarios, and information change deliberately, so the same concept keeps showing up looking unfamiliar. This is where memorization stops working and understanding takes over.' },
  { days: 'Days 24–27', title: 'Exam Simulation', color: '#E8593C', icon: ClipboardCheck, body: 'Full-length, timed, mixed simulations you can\'t predict question-to-question — tracking score, pacing, and which concepts keep tripping you up.' },
  { days: 'Days 28–30', title: 'Remediation & Readiness', color: '#10B981', icon: Award, body: 'Your highest-risk gaps get targeted practice, then a final readiness test tells you — specifically — whether you\'re ready, and exactly what to fix if you\'re not.' },
]

export default function ThirtyDayRunwayPage() {
  return (
    <div className="min-h-screen" style={{ background: '#060e1f' }}>
      <MarketingNav />

      <section className="pt-40 pb-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#FFB627' }}>The Test Runway</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
            30 days from first question<br />to test-ready.
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Not "50 questions a day." A structured arc that builds the foundation, applies it under pressure, then proves you can handle a question you've never seen.
          </p>
        </div>
      </section>

      <section className="py-16 px-6" style={{ background: '#0d1a38' }}>
        <div className="max-w-3xl mx-auto space-y-5">
          {PHASES.map(p => (
            <div key={p.title} className="rounded-2xl p-6 flex gap-5"
              style={{ background: `${p.color}0d`, border: `1px solid ${p.color}30` }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${p.color}22` }}>
                <p.icon className="w-5 h-5" style={{ color: p.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold" style={{ color: p.color }}>{p.days}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1.5">{p.title}</h3>
                <p className="text-sm leading-relaxed text-white/55">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6 text-center" style={{ background: '#060e1f' }}>
        <h2 className="text-3xl font-extrabold text-white mb-4">Day 1 starts whenever you're ready.</h2>
        <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>Free to start. Private + Instrument both included.</p>
        <Link href="/start" className="btn-gold inline-flex px-8 py-4 rounded-xl text-base font-bold">
          Start Training Free <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      <MarketingFooter />
    </div>
  )
}
