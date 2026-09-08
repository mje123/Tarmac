'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, ChevronDown, ChevronUp, ArrowRight, Plane,
  Sparkles, RefreshCw, Brain, Clock, Layers, Send, Loader2,
} from 'lucide-react'
import { TARMAC_PLAN } from '@/lib/pricing'
import MarketingNav from '@/components/layout/MarketingNav'
import MarketingFooter from '@/components/layout/MarketingFooter'

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const DEMO_QUESTION = {
  text: 'What is the minimum flight visibility required for VFR flight in Class G airspace below 1,200 ft AGL during the day?',
  options: [
    { key: 'A', text: '3 statute miles' },
    { key: 'B', text: '1 statute mile' },
    { key: 'C', text: '5 statute miles' },
  ],
  correct: 'B',
  explanation: `Correct. 14 CFR 91.155 — In Class G airspace below 1,200 ft AGL during the day, VFR minimums are 1 SM visibility and clear of clouds. Above 1,200 ft AGL (but below 10,000 ft MSL), it becomes 1 SM with 500/1000/2000 cloud clearances. This is one of the most-tested airspace minimums on the FAA written.`,
  wrongExplanation: (picked: string) =>
    `Not quite. You chose ${picked}. The correct answer is B — 1 statute mile.\n\n14 CFR 91.155 sets VFR minimums by airspace class. In Class G below 1,200 ft AGL during the day, only 1 SM and clear of clouds is required. The 3 SM rule applies in Class E and above. This is a common trap — memorize minimums by airspace class, not by feel.`,
}

const VARIANT_EXAMPLES = [
  { label: 'Direct recall', text: 'What is the minimum flight visibility for VFR flight in Class G airspace below 1,200 ft AGL during the day?' },
  { label: 'Scenario application', text: 'You depart a non-towered airport at dusk in Class G airspace, 800 ft AGL, with 2 SM visibility. Are you legal to continue VFR?' },
  { label: 'Comparison', text: 'Airspace A is Class G below 1,200 ft AGL. Airspace B is Class E starting at 700 ft AGL. Which requires greater visibility at 500 ft AGL, and why?' },
]

const FAQ_ITEMS = [
  {
    q: 'Who is TARMAC for?',
    a: 'Student pilots working toward their Private Pilot or Instrument Rating written test. Whether you\'re just starting ground school or a week from test day, the product adapts to where you are right now.',
  },
  {
    q: 'Why does TARMAC generate questions instead of using a fixed bank?',
    a: 'FAA testing is moving toward more dynamic, scenario-based questions, digitally presented and less reliant on a static, memorizable set. A fixed bank teaches you to recognize questions you\'ve already seen. TARMAC generates new scenarios, numbers, and wording from the same underlying knowledge, so you build the understanding to handle a question you\'ve never seen — because that\'s increasingly what the real test looks like.',
  },
  {
    q: 'Is TARMAC affiliated with the FAA?',
    a: 'No. TARMAC is not affiliated with, endorsed by, or approved by the FAA. Practice questions are FAA-style and built around current ACS standards and FAA source material — they are not official FAA test questions, and TARMAC cannot guarantee a passing score.',
  },
  {
    q: 'What\'s included in the membership?',
    a: 'Private Pilot and Instrument Rating written test prep — AI-generated practice questions, novel-question mode, adaptive difficulty, spaced repetition, the 30-Day Runway, and full timed exam simulations. One membership, both exams.',
  },
  {
    q: 'What happens after the 7-day free trial?',
    a: "You're charged $29.99/month when the trial ends. Cancel any time before that in Settings — no charge, no questions asked.",
  },
  {
    q: 'How do I cancel?',
    a: 'Settings → Subscription & Billing → Manage Billing. That opens the Stripe portal where you can cancel instantly. You keep access through the end of your paid period.',
  },
  {
    q: 'Does this replace ground school?',
    a: "TARMAC covers the knowledge areas tested on the FAA Private Pilot and Instrument written exams, with AI explanations on every question. Most members use it as their primary written-test prep. You'll still need a CFI endorsement before taking the FAA test.",
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="border-b border-white/10 py-5 cursor-pointer group"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="font-semibold text-white text-sm leading-relaxed group-hover:text-[#5ab8f5] transition-colors">{q}</span>
        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
          {open
            ? <ChevronUp className="w-3 h-3 text-[#5ab8f5]" />
            : <ChevronDown className="w-3 h-3 text-white/50" />}
        </div>
      </div>
      {open && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-3 text-white/55 text-sm leading-relaxed whitespace-pre-line"
        >
          {a}
        </motion.p>
      )}
    </div>
  )
}

function DemoWidget() {
  const [picked, setPicked] = useState<string | null>(null)
  const isCorrect = picked === DEMO_QUESTION.correct

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}>
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        </div>
        <span className="text-xs text-white/30 font-mono">tarmac.study — practice mode</span>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(62,146,204,0.15)', color: '#5ab8f5' }}>Regulations</span>
      </div>
      <div className="p-6">
        <p className="text-white text-base font-medium leading-relaxed mb-5">{DEMO_QUESTION.text}</p>
        <div className="space-y-2.5 mb-4">
          {DEMO_QUESTION.options.map(opt => {
            let bg = 'rgba(255,255,255,0.04)'
            let border = '1px solid rgba(255,255,255,0.1)'
            let textColor = 'rgba(255,255,255,0.75)'
            if (picked) {
              if (opt.key === DEMO_QUESTION.correct) { bg = 'rgba(34,197,94,0.1)'; border = '1px solid rgba(34,197,94,0.4)'; textColor = 'white' }
              else if (opt.key === picked) { bg = 'rgba(239,68,68,0.1)'; border = '1px solid rgba(239,68,68,0.4)'; textColor = 'rgba(255,255,255,0.5)' }
            }
            return (
              <button key={opt.key} disabled={!!picked} onClick={() => setPicked(opt.key)}
                className="w-full text-left p-3.5 rounded-xl flex items-start gap-3 transition-all hover:bg-white/8 disabled:cursor-default"
                style={{ background: bg, border }}>
                <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>{opt.key}</span>
                <span className="text-sm leading-relaxed transition-colors" style={{ color: textColor }}>{opt.text}</span>
                {picked && opt.key === DEMO_QUESTION.correct && <CheckCircle className="w-4 h-4 text-green-400 ml-auto shrink-0 mt-0.5" />}
              </button>
            )
          })}
        </div>
        <AnimatePresence>
          {picked && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-line"
              style={{
                background: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                border: isCorrect ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.25)',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              {isCorrect ? DEMO_QUESTION.explanation : DEMO_QUESTION.wrongExplanation(picked)}
            </motion.div>
          )}
        </AnimatePresence>
        {picked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-5 text-center"
          >
            <Link href="/start" className="btn-gold inline-flex px-6 py-2.5 text-sm">
              Get full access free <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
        {!picked && (
          <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.2)' }}>Pick an answer above</p>
        )}
      </div>
    </div>
  )
}

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { setStatus('sent'); setForm({ name: '', email: '', message: '' }) }
      else setStatus('error')
    } catch { setStatus('error') }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">Name</label>
          <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Your name" required
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-[#5ab8f5]/50 transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">Email</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            placeholder="you@example.com" required
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-[#5ab8f5]/50 transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5">Message</label>
        <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
          placeholder="What's on your mind?" required rows={5}
          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-[#5ab8f5]/50 transition-all resize-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
      </div>
      {status === 'error' && <p className="text-sm text-red-400">Something went wrong — try again or email us directly.</p>}
      {status === 'sent' ? (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-green-400 font-medium"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          Got it — we'll be in touch soon.
        </motion.div>
      ) : (
        <button type="submit" disabled={status === 'sending'} className="btn-gold px-7 py-3 text-sm font-bold disabled:opacity-60">
          {status === 'sending'
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            : <><Send className="w-4 h-4" /> Send Message</>}
        </button>
      )}
    </form>
  )
}

const FEATURES = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    color: '#3E92CC',
    label: 'AI-Generated Practice',
    body: 'Every session pulls from the same verified FAA knowledge but generates new wording, numbers, and scenarios — not a fixed bank you can memorize your way through.',
  },
  {
    icon: <RefreshCw className="w-5 h-5" />,
    color: '#2ECC71',
    label: 'New Questions, Every Session',
    body: 'Come back tomorrow and the concept is the same — the question isn\'t. That\'s the difference between recognizing an answer and actually knowing the material.',
  },
  {
    icon: <Brain className="w-5 h-5" />,
    color: '#F39C12',
    label: 'Understand Why',
    body: 'Get one wrong and the AI breaks down the concept, the trap, and the source — not just which letter was correct.',
  },
  {
    icon: <Layers className="w-5 h-5" />,
    color: '#9B59B6',
    label: 'Remember What You Learn',
    body: 'Spaced repetition brings weak concepts back before you forget them, and lets the ones you\'ve mastered fade from rotation.',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    color: '#E8593C',
    label: 'Simulate the Test',
    body: 'Full-length, timed exam simulations with fresh questions every attempt — so you walk in on test day having already handled the pressure.',
  },
  {
    icon: <Plane className="w-5 h-5" />,
    color: '#3E92CC',
    label: 'The 30-Day Runway',
    body: 'A structured arc from diagnostic to test-ready: build the foundation, apply it under pressure, then prove you can handle questions you\'ve never seen.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#060e1f' }}>
      <MarketingNav />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/formation.png" alt="" fill className="object-cover object-center" priority />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(6,14,31,0.65) 0%, rgba(6,14,31,0.5) 40%, rgba(6,14,31,0.85) 85%, #060e1f 100%)' }} />
        </div>

        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />

        <div className="relative max-w-4xl mx-auto px-6 pt-28 pb-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-semibold uppercase tracking-widest"
              style={{ background: 'rgba(255,182,39,0.12)', border: '1px solid rgba(255,182,39,0.25)', color: '#FFB627' }}>
              Built for Private Pilot + Instrument Rating
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.08] mb-6 tracking-tight"
          >
            The FAA test is changing.<br />
            <span style={{ color: '#5ab8f5' }}>Your study method should too.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            Static question banks train you to recognize answers you've already seen. TARMAC uses AI-generated practice questions and scenarios to train you for the ones you haven't.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6"
          >
            <Link href="/start" className="btn-gold text-base px-8 py-4 rounded-xl w-full sm:w-auto text-center justify-center font-bold">
              Start Training Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/how-it-works"
              className="text-sm px-8 py-4 rounded-xl font-semibold w-full sm:w-auto text-center transition-all"
              style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}>
              See how it works
            </Link>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ color: 'rgba(255,255,255,0.3)' }} className="text-xs tracking-wide"
          >
            Cancel anytime · Not affiliated with the FAA
          </motion.p>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.2)' }} />
        </motion.div>
      </section>

      {/* Stats bar */}
      <section style={{ background: '#0d1a38', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <FadeUp>
          <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-3 gap-6 text-center">
            {[
              { value: '2', label: 'Private + Instrument' },
              { value: 'New', label: 'Questions every session' },
              { value: '$175', label: 'Cost of one FAA retake' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mb-1">{s.value}</div>
                <div className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* The problem */}
      <section className="py-24 px-6" style={{ background: '#060e1f' }}>
        <div className="max-w-3xl mx-auto text-center">
          <FadeUp>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FFB627' }}>The old way</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-snug mb-5">
              Built around memorization.
            </h2>
            <p className="text-base leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Traditional written-test prep teaches you to recognize a fixed question, remember the answer, and repeat it until test day.
            </p>
            <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              But if the wording changes, the numbers change, or the scenario changes — recognition isn't enough. That's the problem TARMAC is built to solve.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6" style={{ background: '#0d1a38' }}>
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FFB627' }}>How TARMAC trains you</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-snug mb-4">
                Train the concept.<br />
                <span style={{ color: '#5ab8f5' }}>Not the question.</span>
              </h2>
              <p className="text-base max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Everything built around one goal — being ready for a question you've never seen.
              </p>
            </div>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-[rgba(255,255,255,0.07)] rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            {FEATURES.map((f, i) => (
              <FadeUp key={f.label} delay={i * 0.07}>
                <div className="p-8 h-full" style={{ background: '#0d1a38' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: f.color + '18', color: f.color }}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-white mb-2 text-base">{f.label}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="py-24 px-6 relative overflow-hidden" style={{ background: '#060e1f' }}>
        <div className="absolute inset-0">
          <Image src="/aerial-view.jpeg" alt="" fill className="object-cover object-center opacity-20" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #060e1f, rgba(6,14,31,0.7), #060e1f)' }} />
        </div>
        <div className="max-w-2xl mx-auto relative">
          <FadeUp>
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FFB627' }}>Same concept. Different question.</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Try it right now</h2>
              <p className="text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>Answer a real FAA-style question. See exactly how the AI explains it. No signup.</p>
            </div>
          </FadeUp>

          <FadeUp delay={0.1} className="mb-8">
            <div className="grid sm:grid-cols-3 gap-3">
              {VARIANT_EXAMPLES.map(v => (
                <div key={v.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#5ab8f5' }}>{v.label}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{v.text}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
              All three test the same regulation — 14 CFR 91.155 — from a different angle. None of them reward memorizing the first one.
            </p>
          </FadeUp>

          <FadeUp delay={0.15}>
            <DemoWidget />
          </FadeUp>
        </div>
      </section>

      {/* What TARMAC does */}
      <section className="py-24 px-6" style={{ background: '#0d1a38' }}>
        <div className="max-w-4xl mx-auto">
          <FadeUp>
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FFB627' }}>Why this works</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-snug mb-4">
                Train the way<br />
                <span style={{ color: '#5ab8f5' }}>you'll be tested.</span>
              </h2>
              <p className="text-base max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Built on retrieval practice, spaced review, and variable practice — not passive reading.
              </p>
            </div>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-x rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { icon: <Brain className="w-5 h-5" />, color: '#3E92CC', title: 'Retrieval, not rereading', body: "You don't learn by rereading a question. TARMAC makes you pull the answer from memory every time, then explains the concept, the trap, and the source when you miss it." },
              { icon: <RefreshCw className="w-5 h-5" />, color: '#2ECC71', title: 'Spaced, not crammed', body: 'Concepts you\'re shaky on come back on a schedule instead of all at once. The ones you\'ve locked in fade out of rotation automatically.' },
              { icon: <Clock className="w-5 h-5" />, color: '#FFB627', title: 'Full timed simulations', body: 'Simulate the real FAA test with a fresh question set every attempt — timer, full coverage, no repeats to memorize.' },
            ].map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.07}>
                <div className="p-8 h-full" style={{ background: '#0d1a38' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: f.color + '18', color: f.color }}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-white mb-2 text-sm">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6" style={{ background: '#060e1f' }}>
        <div className="max-w-lg mx-auto">
          <FadeUp>
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FFB627' }}>Pricing</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Private + Instrument included.</h2>
              <p className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>
                One membership. No tiers. Both written tests.
              </p>
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
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
          </FadeUp>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6" style={{ background: '#0d1a38' }}>
        <div className="max-w-2xl mx-auto">
          <FadeUp>
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FFB627' }}>FAQ</p>
              <h2 className="text-3xl font-extrabold text-white">Common questions</h2>
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div className="rounded-2xl px-7 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {FAQ_ITEMS.map(item => <FAQItem key={item.q} {...item} />)}
            </div>
            <p className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Something else?{' '}
              <a href="#contact" className="text-[#5ab8f5] hover:underline">Get in touch</a>
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 px-6" style={{ background: '#060e1f' }}>
        <div className="max-w-2xl mx-auto">
          <FadeUp>
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FFB627' }}>Get in touch</p>
              <h2 className="text-3xl font-extrabold text-white mb-3">Have a question?</h2>
              <p className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Pricing, your account, or feedback — we read everything.
              </p>
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <ContactForm />
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/mountains.jpeg" alt="" fill className="object-cover object-center" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #0d1a38, rgba(5,12,40,0.6) 30%, rgba(5,12,40,0.6) 70%, #060e1f)' }} />
        </div>
        <FadeUp>
          <div className="max-w-lg mx-auto text-center relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-7"
              style={{ background: 'rgba(90,184,245,0.12)', border: '1px solid rgba(90,184,245,0.2)' }}>
              <Plane className="w-7 h-7 text-[#5ab8f5]" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
              Don't memorize the test.<br />
              <span style={{ color: '#FFB627' }}>Prepare for what's next.</span>
            </h2>
            <p className="text-lg mb-9 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Start your 7-day free trial. Private Pilot and Instrument written test prep, built for questions you haven't seen yet.
            </p>
            <Link href="/start" className="btn-gold text-base px-10 py-4 rounded-xl inline-flex items-center gap-2">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No credit card. Cancel anytime.</p>
          </div>
        </FadeUp>
      </section>

      <MarketingFooter />
    </div>
  )
}
