'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  CheckCircle, Brain, Target,
  ChevronDown, ChevronUp, ArrowRight, Plane, MessageSquare,
  Zap, TrendingUp, AlertTriangle,
} from 'lucide-react'

function FadeUp({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

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

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="py-5 cursor-pointer group"
      style={{ borderBottom: '1px solid #E8E4DC' }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className="font-semibold text-sm leading-relaxed transition-colors"
          style={{ color: open ? '#1D6FA4' : '#111827' }}
        >
          {q}
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#1D6FA4' }} />
          : <ChevronDown className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#9CA3AF' }} />}
      </div>
      {open && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-3 text-sm leading-relaxed whitespace-pre-line"
          style={{ color: '#6B7280' }}
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
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}
    >
      {/* Browser chrome */}
      <div
        className="px-5 py-3 flex items-center gap-2"
        style={{ background: '#1A2435', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#FEBC2E' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#28C840' }} />
        <span className="mx-auto text-xs font-mono" style={{ color: 'rgba(255,255,255,0.28)' }}>
          tarmac.study — Practice
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded font-medium"
          style={{ background: 'rgba(29,111,164,0.2)', color: '#7EC8E3' }}
        >
          Regulations
        </span>
      </div>

      <div className="p-6">
        <p className="text-base font-medium leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.88)' }}>
          {DEMO_QUESTION.text}
        </p>
        <div className="space-y-2 mb-4">
          {DEMO_QUESTION.options.map(opt => {
            let bg = 'rgba(255,255,255,0.04)'
            let border = 'rgba(255,255,255,0.09)'
            let textColor = 'rgba(255,255,255,0.65)'
            if (picked) {
              if (opt.key === DEMO_QUESTION.correct) {
                bg = 'rgba(22,163,74,0.1)'; border = 'rgba(22,163,74,0.3)'; textColor = 'rgba(255,255,255,0.9)'
              } else if (opt.key === picked) {
                bg = 'rgba(220,38,38,0.08)'; border = 'rgba(220,38,38,0.25)'; textColor = 'rgba(255,255,255,0.4)'
              }
            }
            return (
              <button
                key={opt.key}
                disabled={!!picked}
                onClick={() => setPicked(opt.key)}
                className="w-full text-left p-4 rounded-xl flex items-start gap-3 transition-colors disabled:cursor-default"
                style={{ background: bg, border: `1px solid ${border}` }}
              >
                <span
                  className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}
                >
                  {opt.key}
                </span>
                <span className="text-sm leading-relaxed" style={{ color: textColor }}>{opt.text}</span>
                {picked && opt.key === DEMO_QUESTION.correct && (
                  <CheckCircle className="w-4 h-4 text-green-400 ml-auto shrink-0 mt-0.5" />
                )}
              </button>
            )
          })}
        </div>

        {picked && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-line"
            style={{
              background: isCorrect ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.07)',
              border: `1px solid ${isCorrect ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`,
              color: 'rgba(255,255,255,0.72)',
            }}
          >
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
            <Link href="/signup" className="btn-gold inline-flex px-6 py-2.5 text-sm rounded-xl">
              Get more questions free <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F5F2EC' }}>

      {/* ── Nav ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(245,242,236,0.94)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #E4E0D8',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo.png" alt="TARMAC" width={28} height={28} />
            <span className="text-base font-bold tracking-tight" style={{ color: '#0D1117' }}>TARMAC</span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wider"
              style={{ background: 'rgba(197,149,32,0.1)', color: '#9A7010', border: '1px solid rgba(197,149,32,0.2)' }}
            >
              BETA
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: '#6B7280' }}>
            <a href="#why" className="hover:text-gray-900 transition-colors">Why TARMAC</a>
            <a href="#demo" className="hover:text-gray-900 transition-colors">Try demo</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm px-4 py-2 transition-colors" style={{ color: '#6B7280' }}>
              Log in
            </Link>
            <Link href="/signup" className="btn-gold text-sm px-4 py-2 rounded-lg">Start Free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/hero.png" alt="" fill className="object-cover object-center" priority />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(7,16,31,0.42) 0%, rgba(7,16,31,0.28) 50%, rgba(7,16,31,0.72) 85%, #F5F2EC 100%)',
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 pt-32 pb-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-10"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.18)' }}
            >
              FAA Private Pilot Written Test Prep
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="font-extrabold text-white leading-[1.04] tracking-tight mb-6"
            style={{ fontSize: 'clamp(44px, 8vw, 80px)' }}
          >
            Stop guessing.<br />
            Start understanding.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            Most student pilots memorize answer letters. Then test day comes and the wording changes. TARMAC's AI explains every answer — and keeps explaining until you genuinely get it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5"
          >
            <Link
              href="/signup"
              className="btn-gold text-base px-8 py-3.5 rounded-xl w-full sm:w-auto text-center justify-center font-bold"
            >
              Start Free — 10 Questions <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#demo"
              className="text-sm px-8 py-3.5 rounded-xl font-semibold w-full sm:w-auto text-center transition-all"
              style={{ color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)' }}
            >
              See how it works ↓
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs tracking-wide"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            No credit card · No time limit · Try free right now
          </motion.p>
        </div>

        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.22)' }} />
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section style={{ background: '#F5F2EC', borderBottom: '1px solid #E4E0D8' }}>
        <FadeUp>
          <div className="max-w-3xl mx-auto px-6 py-12">
            <div className="grid grid-cols-3 text-center">
              {[
                { value: '1,400+', label: 'Practice questions' },
                { value: '9', label: 'ACS knowledge areas' },
                { value: '$175', label: 'Cost of one retake' },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="px-4 py-2"
                  style={i > 0 ? { borderLeft: '1px solid #E4E0D8' } : {}}
                >
                  <div
                    className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-1"
                    style={{ color: '#0D1117' }}
                  >
                    {s.value}
                  </div>
                  <div
                    className="text-xs uppercase tracking-widest font-medium"
                    style={{ color: '#9CA3AF' }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── The one difference ── */}
      <section style={{ background: '#FFFFFF' }} className="py-24 px-6">
        <FadeUp>
          <div className="max-w-3xl mx-auto text-center">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-5"
              style={{ color: '#C59520' }}
            >
              The TARMAC difference
            </p>
            <h2
              className="font-extrabold leading-[1.1] tracking-tight mb-6"
              style={{ fontSize: 'clamp(28px, 5vw, 46px)', color: '#0D1117' }}
            >
              Every other practice test tells you what&apos;s right.
              <br />
              TARMAC tells you{' '}
              <span style={{ color: '#1D6FA4' }}>WHY</span>
              {' '}— and won&apos;t stop until you get it.
            </h2>
            <p className="text-base leading-relaxed max-w-lg mx-auto" style={{ color: '#6B7280' }}>
              That one difference is why students who use TARMAC walk into the exam room with genuine confidence — not crossed fingers.
            </p>
          </div>
        </FadeUp>
      </section>

      {/* ── Why students fail ── */}
      <section id="why" className="py-24 px-6" style={{ background: '#F5F2EC' }}>
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#C59520' }}>
                Why most students fail
              </p>
              <h2
                className="font-extrabold tracking-tight"
                style={{ fontSize: 'clamp(26px, 4vw, 38px)', color: '#0D1117' }}
              >
                The written test has a 20% failure rate.
                <br className="hidden sm:block" /> Here&apos;s the real reason.
              </h2>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 gap-5">
            <FadeUp delay={0.08}>
              <div
                className="rounded-2xl p-8 h-full bg-white"
                style={{ borderTop: '3px solid #EF4444', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)' }}
              >
                <div className="flex items-center gap-2.5 mb-6">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.08)' }}
                  >
                    <AlertTriangle className="w-4 h-4" style={{ color: '#EF4444' }} />
                  </div>
                  <span className="font-bold text-sm" style={{ color: '#0D1117' }}>How most students study</span>
                </div>
                <ul className="space-y-4">
                  {[
                    'See a question → pick an answer → move on',
                    'Get it wrong → see "Correct answer: B" → move on',
                    'Practice 200 questions, understand maybe 60 of them',
                    'Test day: question is worded differently → panic',
                    'Fail. Pay $175 to retake. Repeat.',
                  ].map(t => (
                    <li key={t} className="flex items-start gap-3 text-sm" style={{ color: '#6B7280' }}>
                      <span style={{ color: '#EF4444', fontWeight: 700, lineHeight: '1.5', flexShrink: 0 }}>✗</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>

            <FadeUp delay={0.14}>
              <div
                className="rounded-2xl p-8 h-full bg-white"
                style={{ borderTop: '3px solid #1D6FA4', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)' }}
              >
                <div className="flex items-center gap-2.5 mb-6">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(29,111,164,0.08)' }}
                  >
                    <Brain className="w-4 h-4" style={{ color: '#1D6FA4' }} />
                  </div>
                  <span className="font-bold text-sm" style={{ color: '#0D1117' }}>How TARMAC students study</span>
                </div>
                <ul className="space-y-4">
                  {[
                    'Answer a question → AI explains the full concept',
                    'Ask "why 30 minutes and not 45?" → get a real answer',
                    'Practice 200 questions, understand all 200 of them',
                    'Test day: question is worded differently → no problem',
                    'Pass. Done. On to the ramp.',
                  ].map(t => (
                    <li key={t} className="flex items-start gap-3 text-sm" style={{ color: '#374151' }}>
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#1D6FA4' }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6" style={{ background: '#FFFFFF' }}>
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#C59520' }}>
                What you get
              </p>
              <h2
                className="font-extrabold tracking-tight mb-3"
                style={{ fontSize: 'clamp(26px, 4vw, 38px)', color: '#0D1117' }}
              >
                Everything built around one goal
              </h2>
              <p className="text-base" style={{ color: '#9CA3AF' }}>
                You walk out of that test with a passing score.
              </p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: <MessageSquare className="w-5 h-5" />,
                color: '#1D6FA4',
                title: 'An AI you can actually talk to',
                body: 'Not a tooltip. Not a paragraph. A real back-and-forth conversation about every question. Ask follow-ups. Challenge the answer. Keep going until the concept clicks. Like a patient tutor who never gets frustrated.',
              },
              {
                icon: <TrendingUp className="w-5 h-5" />,
                color: '#C59520',
                title: 'Knows exactly where you\'re weak',
                body: 'TARMAC tracks your accuracy across all 9 ACS knowledge areas in real time. When Weather Theory is at 54%, you see it. Your next session routes you back there automatically. No more studying what you already know.',
              },
              {
                icon: <Target className="w-5 h-5" />,
                color: '#1D6FA4',
                title: '1,400+ questions — never run dry',
                body: 'A massive bank of FAA-style questions across every topic the test can throw at you. Regulations, airspace, weather, weight & balance, navigation — all of it. You\'ll never run out of material before test day.',
              },
              {
                icon: <Zap className="w-5 h-5" />,
                color: '#C59520',
                title: 'Full exam simulation',
                body: '60 questions. 2.5-hour timer. No AI assist during the exam — just like the real thing. Then review every answer with the AI afterward. By test day, you\'ve already sat through the experience a dozen times.',
              },
            ].map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.07}>
                <div
                  className="rounded-2xl p-7 h-full"
                  style={{ background: '#F5F2EC', border: '1px solid #E8E4DC' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: f.color + '14', color: f.color }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-base mb-2" style={{ color: '#0D1117' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{f.body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Demo ── */}
      <section id="demo" className="py-24 px-6 relative overflow-hidden" style={{ background: '#07101F' }}>
        <div className="absolute inset-0">
          <Image src="/aerial-view.jpeg" alt="" fill className="object-cover object-center opacity-15" />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, #07101F, rgba(7,16,31,0.55), #07101F)' }}
          />
        </div>
        <div className="max-w-2xl mx-auto relative">
          <FadeUp>
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#C59520' }}>
                Live demo
              </p>
              <h2
                className="font-extrabold text-white mb-3"
                style={{ fontSize: 'clamp(26px, 4vw, 38px)' }}
              >
                Try it right now
              </h2>
              <p className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Answer a real question. See exactly how the AI explains it. No signup.
              </p>
            </div>
          </FadeUp>
          <FadeUp delay={0.12}>
            <DemoWidget />
          </FadeUp>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6" style={{ background: '#F5F2EC' }}>
        <div className="max-w-3xl mx-auto">
          <FadeUp>
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#C59520' }}>
                Pricing
              </p>
              <h2
                className="font-extrabold mb-3 tracking-tight"
                style={{ fontSize: 'clamp(26px, 4vw, 38px)', color: '#0D1117' }}
              >
                Less than one failed test retake.
              </h2>
              <p className="text-base" style={{ color: '#6B7280' }}>
                The FAA charges $175 to retake the written. One month of TARMAC is $34.99. Do the math.
              </p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 gap-5">
            <FadeUp delay={0.08}>
              <div
                className="rounded-2xl p-7 flex flex-col h-full bg-white"
                style={{ border: '1px solid #E4E0D8', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              >
                <div className="mb-7">
                  <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9CA3AF' }}>
                    Free Trial
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-extrabold tracking-tight" style={{ color: '#0D1117' }}>$0</span>
                    <span className="text-sm" style={{ color: '#9CA3AF' }}>forever</span>
                  </div>
                  <p className="text-sm" style={{ color: '#9CA3AF' }}>Try before you commit</p>
                </div>
                <ul className="space-y-3 flex-1 mb-7">
                  {['10 practice questions', 'Full AI explanations', 'No credit card', 'No time limit'].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: '#6B7280' }}>
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#D1D5DB' }} />{f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block text-center py-3 rounded-xl text-sm font-semibold transition-colors"
                  style={{ border: '1.5px solid #E4E0D8', color: '#6B7280' }}
                >
                  Start Free Trial
                </Link>
              </div>
            </FadeUp>

            <FadeUp delay={0.14}>
              <div
                className="rounded-2xl p-7 flex flex-col h-full"
                style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.22)' }}
              >
                <div className="mb-7">
                  <span
                    className="inline-block text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded mb-4"
                    style={{ background: '#FFB627', color: '#0A1628' }}
                  >
                    Study Pass
                  </span>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-extrabold text-white tracking-tight">$34.99</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>/month</span>
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Everything until you pass</p>
                </div>
                <ul className="space-y-3 flex-1 mb-7">
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
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.72)' }}>
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#FFB627' }} />{f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup?plan=study_pass"
                  className="btn-gold block text-center py-3 rounded-xl font-semibold text-sm"
                >
                  Get Study Pass — $34.99/mo
                </Link>
                <p className="text-xs text-center mt-3" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  Most students only need 1–2 months.
                </p>
              </div>
            </FadeUp>
          </div>

          <p className="text-center text-xs mt-5" style={{ color: '#B0A898' }}>
            All sales final. Not affiliated with the FAA. Results not guaranteed. See{' '}
            <Link href="/terms" className="underline">Terms</Link>.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6" style={{ background: '#FFFFFF' }}>
        <div className="max-w-2xl mx-auto">
          <FadeUp>
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#C59520' }}>FAQ</p>
              <h2
                className="font-extrabold tracking-tight"
                style={{ fontSize: 'clamp(26px, 4vw, 38px)', color: '#0D1117' }}
              >
                Questions
              </h2>
            </div>
          </FadeUp>
          <FadeUp delay={0.08}>
            <div style={{ borderTop: '1px solid #E8E4DC' }}>
              {FAQ_ITEMS.map(item => <FAQItem key={item.q} {...item} />)}
            </div>
            <p className="text-center text-sm mt-8" style={{ color: '#9CA3AF' }}>
              Something else?{' '}
              <a href="mailto:mewing713@gmail.com" style={{ color: '#1D6FA4' }} className="hover:underline">
                Email us
              </a>
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-32 px-6 relative overflow-hidden" style={{ background: '#07101F' }}>
        <div className="absolute inset-0">
          <Image src="/mountains.jpeg" alt="" fill className="object-cover object-center" />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, #07101F, rgba(7,16,31,0.42) 35%, rgba(7,16,31,0.42) 65%, #07101F)' }}
          />
        </div>
        <FadeUp>
          <div className="max-w-lg mx-auto text-center relative">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-7"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Plane className="w-7 h-7 text-white" />
            </div>
            <h2
              className="font-extrabold text-white mb-5 leading-tight tracking-tight"
              style={{ fontSize: 'clamp(36px, 6vw, 54px)' }}
            >
              The ramp is waiting.
              <br />
              <span style={{ color: '#FFB627' }}>The test is next.</span>
            </h2>
            <p className="text-lg mb-9 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Start with 10 free questions. You&apos;ll know in 5 minutes if TARMAC is different from anything you&apos;ve tried.
            </p>
            <Link href="/signup" className="btn-gold text-base px-10 py-4 rounded-xl inline-flex items-center gap-2">
              Start Practicing Free <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
              No credit card. Cancel anytime.
            </p>
          </div>
        </FadeUp>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#07101F', borderTop: '1px solid rgba(255,255,255,0.06)' }} className="py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <Image src="/logo-white.png" alt="TARMAC" width={24} height={24} />
            <span className="font-bold text-white text-sm">TARMAC</span>
            <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
              © {new Date().getFullYear()}
            </span>
          </div>
          <div
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            <a href="#why" className="hover:text-white/60 transition-colors">Why TARMAC</a>
            <a href="#pricing" className="hover:text-white/60 transition-colors">Pricing</a>
            <a href="mailto:mewing713@gmail.com" className="hover:text-white/60 transition-colors">Support</a>
            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/partners" className="hover:text-white/60 transition-colors">Creator Program</Link>
            <a
              href="https://www.instagram.com/tarmac_writtentestprep/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/60 transition-colors flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              Instagram
            </a>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>
            Legion Systems LLC · Not affiliated with the FAA.
          </p>
        </div>
      </footer>
    </div>
  )
}
