import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Brain, RefreshCw, Layers, MessageCircle, Target, Repeat } from 'lucide-react'
import MarketingNav from '@/components/layout/MarketingNav'
import MarketingFooter from '@/components/layout/MarketingFooter'

export const metadata: Metadata = {
  title: 'How TARMAC Works — AI FAA Written Test Prep',
  description: 'FAA written testing is moving toward dynamic, scenario-based questions. See how TARMAC generates source-grounded practice questions and figures to train real understanding, not memorization.',
}

const OLD_STEPS = ['See question', 'Memorize answer', 'Recognize question', 'Pass (maybe)']

const LEARNING_PRINCIPLES = [
  { icon: Brain, title: 'Retrieval', body: "You don't learn by rereading. You learn by pulling the answer from memory — so TARMAC makes you answer before it explains anything." },
  { icon: RefreshCw, title: 'Spacing', body: 'Concepts come back over time instead of getting crammed into one session. What you\'re shaky on resurfaces before you forget it.' },
  { icon: Layers, title: 'Interleaving', body: "Different knowledge areas get mixed together, so you have to identify what actually applies — not just what you studied five minutes ago." },
  { icon: Target, title: 'Variable practice', body: 'The same concept shows up in different scenarios, with different numbers and wording, so you learn the concept — not the pattern of one question.' },
  { icon: MessageCircle, title: 'Feedback', body: 'Every mistake explains what went wrong and which concept to fix — not just which letter was correct.' },
  { icon: Repeat, title: 'Application', body: 'Questions ask you to use the knowledge in a realistic scenario, not just recall a definition.' },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen" style={{ background: '#060e1f' }}>
      <MarketingNav />

      {/* Hero */}
      <section className="pt-36 pb-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#FFB627' }}>How it works</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
            Questions you haven't<br />seen before.
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            FAA testing is moving toward more digitally presented, scenario-based questions — less reliant on a fixed, memorizable set. The direction is clear: students need to understand the knowledge behind the question, not just memorize the question itself. TARMAC is built for that.
          </p>
        </div>
      </section>

      {/* The old way */}
      <section className="py-20 px-6" style={{ background: '#0d1a38' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-center" style={{ color: '#FFB627' }}>The old way</p>
          <h2 className="text-3xl font-extrabold text-white text-center mb-10">Built around memorization.</h2>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {OLD_STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white/70"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {s}
                </div>
                {i < OLD_STEPS.length - 1 && <ArrowRight className="w-4 h-4 text-white/20" />}
              </div>
            ))}
          </div>
          <p className="text-center text-base leading-relaxed max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
            If the wording changes, the numbers change, the chart changes, or the scenario changes — recognition isn't enough. That's the problem TARMAC is built to solve.
          </p>
        </div>
      </section>

      {/* Old vs new question */}
      <section className="py-20 px-6" style={{ background: '#060e1f' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-center" style={{ color: '#FFB627' }}>The new testing environment</p>
          <h2 className="text-3xl font-extrabold text-white text-center mb-12">Same knowledge. Different question.</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-white/35">Old style</p>
              <p className="text-sm leading-relaxed text-white/60">
                "What is the minimum flight visibility required for VFR flight in Class G airspace below 1,200 ft AGL during the day?"
              </p>
            </div>
            <div className="rounded-2xl p-6" style={{ background: 'rgba(90,184,245,0.06)', border: '1px solid rgba(90,184,245,0.25)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#5ab8f5' }}>New style</p>
              <p className="text-sm leading-relaxed text-white/80">
                "You depart a non-towered airport at dusk in Class G airspace, 800 ft AGL, with 2 SM visibility. Based on the airspace and time of day, are you legal to continue VFR?"
              </p>
            </div>
          </div>
          <p className="text-center text-sm mt-8 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
            The underlying knowledge is the same — 14 CFR 91.155. The way you're asked to apply it is different.
          </p>
        </div>
      </section>

      {/* What TARMAC does */}
      <section className="py-20 px-6" style={{ background: '#0d1a38' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FFB627' }}>What TARMAC does</p>
          <h2 className="text-3xl font-extrabold text-white mb-6">TARMAC creates a new test for you.</h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Every practice session is generated from the knowledge you need to master — new wording, new numbers, new scenarios, new aircraft situations, new distractors, and different difficulty levels.
          </p>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            The AI creates the question. It doesn't create the underlying FAA rule — every question is grounded in current FAA source material, and answers are checked before you ever see them.
          </p>
        </div>
      </section>

      {/* Figures */}
      <section className="py-20 px-6" style={{ background: '#060e1f' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FFB627' }}>Figures</p>
          <h2 className="text-3xl font-extrabold text-white mb-6">The figure can change too.</h2>
          <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
            TARMAC doesn't rely on you memorizing one picture. Where a figure helps — airspace diagrams, performance charts, VOR and approach diagrams, weather scenarios — TARMAC can vary it alongside the question.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>
            Labeled "Tarmac Training Figure" — never presented as an official FAA chart
          </div>
        </div>
      </section>

      {/* Learning science */}
      <section className="py-20 px-6" style={{ background: '#0d1a38' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FFB627' }}>Why this works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Train the way you'll be tested.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LEARNING_PRINCIPLES.map(p => (
              <div key={p.title} className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(62,146,204,0.15)' }}>
                  <p.icon className="w-4 h-4 text-[#5ab8f5]" />
                </div>
                <h3 className="font-bold text-white mb-1.5 text-sm">{p.title}</h3>
                <p className="text-xs leading-relaxed text-white/50">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center" style={{ background: '#060e1f' }}>
        <h2 className="text-3xl font-extrabold text-white mb-4">Ready to train differently?</h2>
        <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>Private Pilot and Instrument Rating written test prep. Free to start.</p>
        <Link href="/start" className="btn-gold inline-flex px-8 py-4 rounded-xl text-base font-bold">
          Start Training Free <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      <MarketingFooter />
    </div>
  )
}
