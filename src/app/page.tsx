'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  CheckCircle, Brain, BarChart3, Smartphone, Target,
  ChevronDown, ChevronUp, ArrowRight, Plane, MessageSquare,
  Zap, TrendingUp, AlertTriangle,
} from 'lucide-react'

// ─── ANIMATION HELPERS ───────────────────────────────────────────────────────
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

// ─── DEMO ────────────────────────────────────────────────────────────────────
const DEMO_QUESTION = {
  text: 'What is the minimum fuel requirement for a day VFR flight?',
  options: [
    { key: 'A', text: 'Enough fuel to reach the destination only' },
    { key: 'B', text: 'Enough fuel to reach destination plus 30 minutes at normal cruise' },
    { key: 'C', text: 'Enough fuel to reach destination plus 45 minutes at normal cruise' },
  ],
  correct: 'B',
  explanation: `✅ Correct!\n\n14 CFR 91.151 requires that you carry enough fuel to reach your first intended landing point, plus at least 30 minutes of fuel at normal cruise speed — for day VFR flights.\n\nThe 45-minute reserve applies to night VFR. Think of it this way: more darkness = more buffer. Day = 30 min, Night = 45 min.\n\nMemory trick: "30 by day, 45 at night — more darkness, fuel it right." ✈️`,
  wrongExplanation: (picked: string) =>
    `❌ Not quite — but this one trips up a lot of students!\n\nYou chose ${picked}. The correct answer is B.\n\n14 CFR 91.151 requires fuel to reach your destination PLUS 30 minutes at normal cruise speed for day VFR. The 45-minute rule is for night VFR.\n\nThink of it: "30 by day, 45 at night." The extra buffer at night accounts for reduced visibility and higher risk.\n\nMake sense? This is exactly how TARMAC teaches — not just "B is correct," but WHY.`,
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: 'Are these the actual FAA test questions?',
    a: 'No — and that\'s intentional. The FAA changes question wording. If you memorize exact questions, you\'re gambling. TARMAC teaches you the underlying concepts across all 9 ACS knowledge areas so you can answer any version of a question, even one you\'ve never seen.',
  },
  {
    q: 'How is this different from other test prep tools?',
    a: 'Other tools show you a question, tell you the right answer, and move on. TARMAC gives you an AI that explains exactly WHY the answer is correct, what makes the other choices wrong, and lets you ask follow-up questions until you genuinely understand. It\'s a conversation — not a flashcard.',
  },
  {
    q: 'How long until I\'m test-ready?',
    a: 'Most students are test-ready in 3–6 weeks with 20–30 questions per day. The best signal: when you\'re consistently 80%+ across all categories and you can explain WHY each answer is correct — not just which letter it is.\n\nNote: TARMAC is designed to work alongside your flight training, not replace it. You still need a CFI endorsement to take the FAA written.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'All purchases are final and non-refundable. We\'re confident TARMAC works — that\'s why we offer 10 free questions with full AI explanations before you ever pay. Try it first, then decide.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from Settings at any time. You keep access through the end of your billing period. No hoops, no fees.',
  },
]

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
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
        <span className="text-xs text-white/30 font-mono">tarmac.study — live demo</span>
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
                <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>{opt.key}</span>
                <span className="text-sm leading-relaxed transition-colors" style={{ color: textColor }}>{opt.text}</span>
                {picked && opt.key === DEMO_QUESTION.correct && <CheckCircle className="w-4 h-4 text-green-400 ml-auto shrink-0 mt-0.5" />}
              </button>
            )
          })}
        </div>
        {picked && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-line"
            style={{
              background: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: isCorrect ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.25)',
              color: 'rgba(255,255,255,0.8)'
            }}>
            {isCorrect ? DEMO_QUESTION.explanation : DEMO_QUESTION.wrongExplanation(picked)}
          </motion.div>
        )}
        {picked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-5 text-center"
          >
            <Link href="/signup" className="btn-gold inline-flex px-6 py-2.5 text-sm">
              Get more questions free <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#060e1f' }}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-10 py-4"
        style={{ background: 'rgba(6,14,31,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image src="/logo-white.png" alt="TARMAC" width={30} height={30} />
          <span className="text-base font-bold text-white tracking-tight">TARMAC</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wider" style={{ background: 'rgba(255,182,39,0.15)', color: '#FFB627', border: '1px solid rgba(255,182,39,0.3)' }}>BETA</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <a href="#why" className="hover:text-white transition-colors">Why TARMAC</a>
          <a href="#demo" className="hover:text-white transition-colors">Try demo</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-sm px-4 py-2 transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>Log in</Link>
          <Link href="/signup" className="btn-gold text-sm px-4 py-2">Start Free</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image src="/hero.png" alt="" fill className="object-cover object-center" priority />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(6,14,31,0.65) 0%, rgba(6,14,31,0.5) 40%, rgba(6,14,31,0.85) 85%, #060e1f 100%)' }} />
        </div>

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }} />

        <div className="relative max-w-4xl mx-auto px-6 pt-28 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-semibold uppercase tracking-widest" style={{ background: 'rgba(255,182,39,0.12)', border: '1px solid rgba(255,182,39,0.25)', color: '#FFB627' }}>
              FAA Private Pilot Written Test Prep
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-[1.05] mb-6 tracking-tight"
          >
            Know It.<br />
            <span style={{ color: '#5ab8f5' }}>Don&apos;t Memorize It.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            The FAA changes how questions are worded. TARMAC makes sure that doesn&apos;t matter.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6"
          >
            <Link href="/signup" className="btn-gold text-base px-8 py-4 rounded-xl w-full sm:w-auto text-center justify-center font-bold">
              Try 10 Questions Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#demo"
              className="text-sm px-8 py-4 rounded-xl font-semibold w-full sm:w-auto text-center transition-all"
              style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}>
              See how it works ↓
            </a>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ color: 'rgba(255,255,255,0.3)' }}
            className="text-xs tracking-wide"
          >
            No credit card · No time limit · Cancel anytime
          </motion.p>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.2)' }} />
        </motion.div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ background: '#0d1a38', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <FadeUp>
          <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-3 gap-6 text-center">
            {[
              { value: '1,400+', label: 'Practice questions' },
              { value: '9', label: 'ACS knowledge areas' },
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

      {/* ── The one difference ── */}
      <section style={{ background: '#060e1f' }} className="py-24 px-6">
        <FadeUp>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: '#FFB627' }}>The TARMAC difference</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-snug mb-6">
              Most practice tools expose you to questions.
              <br />
              <span style={{ color: '#5ab8f5' }}>TARMAC makes sure you&apos;re ready for all of them.</span>
            </h2>
            <p className="text-base leading-relaxed max-w-2xl mx-auto mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Random question banks don&apos;t know what you don&apos;t know. TARMAC does. It tracks your accuracy across every ACS knowledge area, finds exactly where your gaps are, and routes you back to those concepts — repeatedly — until they stop being gaps.
            </p>
            <p className="text-base leading-relaxed max-w-2xl mx-auto mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
              By the time you sit for the FAA written, you&apos;ve already encountered every concept that can appear on it — multiple times, from multiple angles, in the areas where you were weakest. The exam doesn&apos;t feel new. It feels familiar. That&apos;s not luck. That&apos;s what a structured training system produces.
            </p>
            <p className="text-sm font-semibold tracking-wide" style={{ color: '#FFB627' }}>
              Walk in knowing you&apos;ve already beaten the hard parts.
            </p>
          </div>
        </FadeUp>
      </section>

      {/* ── Why students fail ── */}
      <section id="why" className="py-24 px-6" style={{ background: '#0d1a38' }}>
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FFB627' }}>Why most students fail</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">The written test has a 20% failure rate.<br className="hidden sm:block" /> Here's the real reason.</h2>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 gap-6">
            <FadeUp delay={0.1}>
              <div className="rounded-2xl p-7 h-full" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)' }}>
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="font-bold text-white text-sm">How most students study</span>
                </div>
                <ul className="space-y-4">
                  {[
                    'See a question → pick an answer → move on',
                    'Get it wrong → see "Correct answer: B" → move on',
                    'Practice 200 questions, understand maybe 60 of them',
                    'Test day: question is worded differently → panic',
                    'Fail. Pay $175 to retake. Repeat.',
                  ].map(t => (
                    <li key={t} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      <span className="text-red-400 font-bold shrink-0 mt-0.5 text-base leading-none">✗</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>

            <FadeUp delay={0.2}>
              <div className="rounded-2xl p-7 h-full" style={{ background: 'rgba(62,146,204,0.06)', border: '1px solid rgba(62,146,204,0.2)' }}>
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(62,146,204,0.15)' }}>
                    <Brain className="w-4 h-4 text-[#5ab8f5]" />
                  </div>
                  <span className="font-bold text-white text-sm">How TARMAC students study</span>
                </div>
                <ul className="space-y-4">
                  {[
                    'Answer a question → AI explains the full concept',
                    'Ask "why 30 minutes and not 45?" → get a real answer',
                    'Practice 200 questions, understand all 200 of them',
                    'Test day: question is worded differently → no problem',
                    'Pass. Done. On to the ramp.',
                  ].map(t => (
                    <li key={t} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <CheckCircle className="w-4 h-4 text-[#5ab8f5] shrink-0 mt-0.5" />{t}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6" style={{ background: '#060e1f' }}>
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FFB627' }}>What you get</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Everything built around one goal</h2>
              <p className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>You walk out of that test with a passing score.</p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 gap-px rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            {[
              {
                icon: <MessageSquare className="w-5 h-5" />,
                color: '#5ab8f5',
                title: 'An AI you can actually talk to',
                body: 'Not a tooltip. Not a paragraph. A real back-and-forth conversation about every question. Ask follow-ups. Challenge the answer. Keep going until the concept clicks. Like a patient tutor who never gets frustrated.',
              },
              {
                icon: <TrendingUp className="w-5 h-5" />,
                color: '#FFB627',
                title: 'Knows exactly where you\'re weak',
                body: 'TARMAC tracks your accuracy across all 9 ACS knowledge areas in real time. When Weather Theory is at 54%, you see it. Your next session routes you back there automatically. No more studying what you already know.',
              },
              {
                icon: <Target className="w-5 h-5" />,
                color: '#5ab8f5',
                title: '1,400+ questions — never run dry',
                body: 'A massive bank of FAA-style questions across every topic the test can throw at you. Regulations, airspace, weather, weight & balance, navigation — all of it. You\'ll never run out of material before test day.',
              },
              {
                icon: <Zap className="w-5 h-5" />,
                color: '#FFB627',
                title: 'Full exam simulation',
                body: '60 questions. 2.5-hour timer. No AI assist during the exam — just like the real thing. Then review every answer with the AI afterward. By test day, you\'ve already sat through the experience a dozen times.',
              },
            ].map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.08}>
                <div className="p-8 h-full" style={{ background: '#060e1f' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: f.color + '18', color: f.color }}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-white mb-2 text-base">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Demo ── */}
      <section id="demo" className="py-24 px-6 relative overflow-hidden" style={{ background: '#0d1a38' }}>
        <div className="absolute inset-0">
          <Image src="/aerial-view.jpeg" alt="" fill className="object-cover object-center opacity-20" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #0d1a38, rgba(13,26,56,0.7), #0d1a38)' }} />
        </div>
        <div className="max-w-2xl mx-auto relative">
          <FadeUp>
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FFB627' }}>Live demo</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Try it right now</h2>
              <p className="text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>Answer a real question. See exactly how the AI explains it. No signup.</p>
            </div>
          </FadeUp>
          <FadeUp delay={0.15}>
            <DemoWidget />
          </FadeUp>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6" style={{ background: '#060e1f' }}>
        <div className="max-w-3xl mx-auto">
          <FadeUp>
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FFB627' }}>Pricing</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Less than one failed test retake.</h2>
              <p className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>
                The FAA charges $175 to retake the written. One month of TARMAC is $34.99. Do the math.
              </p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 gap-5">
            <FadeUp delay={0.1}>
              <div className="rounded-2xl p-7 flex flex-col h-full" style={{ background: '#0d1a38', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="mb-7">
                  <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Free Trial</div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-extrabold text-white">$0</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>forever</span>
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Try before you commit</p>
                </div>
                <ul className="space-y-3 flex-1 mb-7">
                  {['10 practice questions', 'Full AI explanations', 'No credit card', 'No time limit'].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }} />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block text-center py-3 rounded-xl text-sm font-semibold transition-all" style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
                  Start Free Trial
                </Link>
              </div>
            </FadeUp>

            <FadeUp delay={0.2}>
              <div className="rounded-2xl p-7 flex flex-col h-full relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #1a3a7a, #0e2560)', border: '1px solid rgba(90,184,245,0.25)' }}>
                {/* Subtle glow */}
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: '#3E92CC' }} />

                <div className="mb-7 relative">
                  <div className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4" style={{ background: '#FFB627', color: '#0A2463' }}>Study Pass</div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-extrabold text-white">$34.99</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>/month</span>
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Everything until you pass</p>
                </div>
                <ul className="space-y-3 flex-1 mb-7 relative">
                  {[
                    'Unlimited practice questions',
                    'All 9 ACS knowledge areas',
                    'AI tutor — ask follow-ups on every question',
                    'Real-time progress by category',
                    'Focused drill mode by topic',
                    '60-question timed practice exams',
                    'FAA supplement figures included',
                    'Cancel anytime',
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                      <CheckCircle className="w-4 h-4 text-[#FFB627] shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup?plan=study_pass" className="btn-gold text-center py-3 rounded-xl font-semibold relative">
                  Get Study Pass — $34.99/mo
                </Link>
                <p className="text-xs text-center mt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Most students only need 1–2 months.</p>
              </div>
            </FadeUp>
          </div>
          <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.2)' }}>
            All sales final. Not affiliated with the FAA. Results not guaranteed. See <Link href="/terms" className="underline">Terms</Link>.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6" style={{ background: '#0d1a38' }}>
        <div className="max-w-2xl mx-auto">
          <FadeUp>
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FFB627' }}>FAQ</p>
              <h2 className="text-3xl font-extrabold text-white">Questions</h2>
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div className="rounded-2xl px-7 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {FAQ_ITEMS.map(item => <FAQItem key={item.q} {...item} />)}
            </div>
            <p className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Something else?{' '}
              <a href="mailto:mewing713@gmail.com" className="text-[#5ab8f5] hover:underline">Email us</a>
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/mountains.jpeg" alt="" fill className="object-cover object-center" priority={false} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #0d1a38, rgba(5,12,40,0.6) 30%, rgba(5,12,40,0.6) 70%, #060e1f)' }} />
        </div>
        <FadeUp>
          <div className="max-w-lg mx-auto text-center relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-7" style={{ background: 'rgba(90,184,245,0.12)', border: '1px solid rgba(90,184,245,0.2)' }}>
              <Plane className="w-7 h-7 text-[#5ab8f5]" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
              The ramp is waiting.<br />
              <span style={{ color: '#FFB627' }}>The test is next.</span>
            </h2>
            <p className="text-lg mb-9 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Start with 10 free questions. You'll know in 5 minutes if TARMAC is different from anything you've tried.
            </p>
            <Link href="/signup" className="btn-gold text-base px-10 py-4 rounded-xl inline-flex items-center gap-2">
              Start Practicing Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No credit card. Cancel anytime.</p>
          </div>
        </FadeUp>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6" style={{ background: '#060e1f', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <Image src="/logo-white.png" alt="TARMAC" width={26} height={26} />
            <span className="font-bold text-white text-sm">TARMAC</span>
            <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <a href="#why" className="hover:text-white/60 transition-colors">Why TARMAC</a>
            <a href="#pricing" className="hover:text-white/60 transition-colors">Pricing</a>
            <a href="mailto:mewing713@gmail.com" className="hover:text-white/60 transition-colors">Support</a>
            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/partners" className="hover:text-white/60 transition-colors">Creator Program</Link>
            <a href="https://www.instagram.com/tarmac_writtentestprep/" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              Instagram
            </a>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>Legion Systems LLC · Not affiliated with the FAA.</p>
        </div>
      </footer>
    </div>
  )
}
