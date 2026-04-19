'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import {
  CheckCircle,
  Brain,
  BarChart3,
  Smartphone,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Plane,
  Target,
} from 'lucide-react'

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
    q: 'How is this different from King Schools or Sporty\'s?',
    a: 'Traditional test prep gives you a question, tells you the answer, and moves on. TARMAC gives you an AI that explains exactly WHY the answer is correct, what makes the other choices wrong, and lets you ask follow-up questions until you actually understand. It\'s the difference between memorizing and learning.',
  },
  {
    q: 'How long until I\'m test-ready?',
    a: 'Most students are test-ready in 3–6 weeks with 20–30 questions per day. The best signal: when you\'re consistently 80%+ across all categories on your progress dashboard, and you can explain WHY each answer is correct — not just which letter it is.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'All purchases are final and non-refundable. We\'re confident TARMAC works — that\'s why we offer 10 free questions with full AI explanations before you ever pay. Try it first.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from Settings at any time. You keep access through the end of your billing period. No hoops, no fees, no guilt trip.',
  },
]

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#0A2463]/10 py-4 cursor-pointer" onClick={() => setOpen(!open)}>
      <div className="flex items-start justify-between gap-4">
        <span className="font-medium text-[#0A2463] text-sm leading-relaxed">{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-[#3E92CC] shrink-0 mt-0.5" />
          : <ChevronDown className="w-4 h-4 text-[#3E92CC] shrink-0 mt-0.5" />}
      </div>
      {open && <p className="mt-3 text-[#0A2463]/80 text-sm leading-relaxed whitespace-pre-line">{a}</p>}
    </div>
  )
}

function DemoWidget() {
  const [picked, setPicked] = useState<string | null>(null)
  const isCorrect = picked === DEMO_QUESTION.correct

  return (
    <div className="glass-card p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(62,146,204,0.15)', color: '#3E92CC' }}>Regulations</span>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>medium</span>
        <span className="ml-auto text-xs text-[#0A2463]/50">Live demo — no signup needed</span>
      </div>

      <p className="text-[#0A2463] text-base font-medium leading-relaxed mb-5">{DEMO_QUESTION.text}</p>

      <div className="space-y-2.5 mb-4">
        {DEMO_QUESTION.options.map(opt => {
          let bg = 'rgba(10,36,99,0.04)'
          let border = '1px solid rgba(10,36,99,0.12)'
          if (picked) {
            if (opt.key === DEMO_QUESTION.correct) { bg = 'rgba(34,197,94,0.1)'; border = '1px solid rgba(34,197,94,0.4)' }
            else if (opt.key === picked) { bg = 'rgba(239,68,68,0.1)'; border = '1px solid rgba(239,68,68,0.4)' }
          }
          return (
            <button
              key={opt.key}
              disabled={!!picked}
              onClick={() => setPicked(opt.key)}
              className="w-full text-left p-3.5 rounded-xl flex items-start gap-3 transition-all hover:opacity-80 disabled:cursor-default"
              style={{ background: bg, border }}
            >
              <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ background: 'rgba(10,36,99,0.1)', color: '#0A2463' }}>{opt.key}</span>
              <span className="text-[#0A2463]/85 text-sm leading-relaxed">{opt.text}</span>
              {picked && opt.key === DEMO_QUESTION.correct && <CheckCircle className="w-4 h-4 text-green-500 ml-auto shrink-0 mt-0.5" />}
            </button>
          )
        })}
      </div>

      {picked && (
        <div className="mt-4 p-4 rounded-xl animate-fade-in text-sm leading-relaxed whitespace-pre-line" style={{ background: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: isCorrect ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)', color: '#0A2463' }}>
          {isCorrect ? DEMO_QUESTION.explanation : DEMO_QUESTION.wrongExplanation(picked)}
        </div>
      )}

      {picked && (
        <div className="mt-5 text-center">
          <Link href="/signup" className="btn-gold inline-flex px-6 py-2.5 text-sm">
            Get more questions free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="light-page min-h-screen">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3 md:py-4" style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(10,36,99,0.08)', boxShadow: '0 1px 20px rgba(10,36,99,0.07)' }}>
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/logo.png" alt="TARMAC" width={32} height={32} />
          <span className="text-lg font-bold text-[#0A2463] tracking-tight">TARMAC</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-[#0A2463]/70">
          <a href="#how" className="hover:text-[#0A2463] transition-colors">How it works</a>
          <a href="#demo" className="hover:text-[#0A2463] transition-colors">Try demo</a>
          <a href="#pricing" className="hover:text-[#0A2463] transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-[#0A2463]/70 hover:text-[#0A2463] text-sm px-3 py-2 transition-colors">Log in</Link>
          <Link href="/signup" className="btn-gold text-sm px-4 py-2">Start Free</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Image src="/hero.png" alt="" fill className="object-cover object-center" priority />
          <div className="absolute inset-0" style={{ background: 'rgba(5,18,55,0.72)' }} />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-sm font-medium" style={{ background: 'rgba(255,182,39,0.15)', border: '1px solid rgba(255,182,39,0.3)', color: '#FFB627' }}>
            <Plane className="w-4 h-4" />
            FAA Private Pilot Written Test Prep
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.1] mb-5" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
            Pass your FAA written.<br />
            <span style={{ color: '#5ab8f5' }}>First try.</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/85 max-w-xl mx-auto mb-8 leading-relaxed">
            Practice questions + AI that explains exactly <em>why</em> every answer is right or wrong — like having a patient CFI available 24/7.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5 w-full">
            <Link href="/signup" className="btn-gold text-lg px-8 py-4 rounded-xl w-full sm:w-auto text-center justify-center">
              Start Free — 10 Questions
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#demo" className="text-base px-8 py-4 rounded-xl font-semibold w-full sm:w-auto text-center transition-all hover:bg-white/15" style={{ color: 'white', border: '2px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.08)' }}>
              Try the demo first
            </a>
          </div>
          <p className="text-white/50 text-sm">No credit card. No time limit. No fluff.</p>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="py-8 px-6" style={{ background: '#ffffff', borderBottom: '1px solid rgba(10,36,99,0.08)' }}>
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-4 text-center">
          {[
            { val: '1,400+', label: 'Practice Questions' },
            { val: '9', label: 'ACS Knowledge Areas' },
            { val: '24/7', label: 'AI Tutor Access' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0A2463]">{s.val}</div>
              <div className="text-xs sm:text-sm text-[#0A2463]/60 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-20 px-6" style={{ background: '#EDF4FC' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0A2463] mb-3">Two things traditional test prep gets wrong</h2>
            <p className="text-[#0A2463]/70 max-w-lg mx-auto">Most tools make you memorize answers. Memorization breaks the moment the FAA rephrases a question. TARMAC makes you understand.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                color: '#3E92CC',
                title: 'Answer realistic questions',
                body: 'Work through FAA-style questions across all 9 ACS knowledge areas. Same topics, different angles — just like the real test. Repetition builds pattern recognition.',
              },
              {
                num: '02',
                color: '#FFB627',
                title: 'AI explains the why',
                body: 'Every answer — right or wrong — triggers a full explanation. Ask follow-ups. "Why 30 and not 45?" Keep going until it clicks. Like a CFI who never gets tired.',
              },
              {
                num: '03',
                color: '#22c55e',
                title: 'Track and drill weak spots',
                body: 'Your dashboard shows accuracy by category. When you see Airspace at 58%, you know exactly where to focus. No guessing. No wasted time.',
              },
            ].map(s => (
              <div key={s.num} className="glass-card p-6">
                <div className="text-3xl font-black mb-3" style={{ color: s.color }}>{s.num}</div>
                <h3 className="font-bold text-[#0A2463] mb-2">{s.title}</h3>
                <p className="text-[#0A2463]/70 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Brain className="w-6 h-6 text-[#3E92CC]" />, title: 'AI Tutor on Every Question', body: 'Explains WHY — not just what. Ask follow-ups anytime.' },
              { icon: <BarChart3 className="w-6 h-6 text-[#FFB627]" />, title: 'Progress by Category', body: 'Know exactly which of the 9 ACS areas need work.' },
              { icon: <Target className="w-6 h-6 text-[#3E92CC]" />, title: 'Practice Exams', body: '60 questions, timed — mirrors the real FAA experience.' },
              { icon: <Smartphone className="w-6 h-6 text-[#FFB627]" />, title: 'Any Device', body: 'Phone, tablet, laptop. Progress syncs everywhere.' },
            ].map(f => (
              <div key={f.title} className="glass-card p-4">
                <div className="mb-3">{f.icon}</div>
                <h3 className="font-semibold text-[#0A2463] text-sm mb-1">{f.title}</h3>
                <p className="text-[#0A2463]/65 text-xs leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Demo ── */}
      <section id="demo" className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Image src="/cockpit.jpeg" alt="" fill className="object-cover object-top opacity-90" />
          <div className="absolute inset-0" style={{ background: 'rgba(10,36,99,0.75)' }} />
        </div>
        <div className="max-w-2xl mx-auto relative">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Try it right now</h2>
            <p className="text-white/70">Answer a real question. See how the AI explains it.</p>
          </div>
          <DemoWidget />
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0A2463] mb-3">Simple pricing</h2>
            <p className="text-[#0A2463]/65">Most students only need 1–2 months. Start free.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="glass-card p-7 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[#0A2463] mb-1">Free Trial</h3>
                <p className="text-[#0A2463]/65 text-sm mb-4">No credit card required</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#0A2463]">$0</span>
                  <span className="text-[#0A2463]/50">forever</span>
                </div>
              </div>
              <ul className="space-y-2.5 flex-1 mb-7">
                {['10 practice questions', 'Full AI explanations on every answer', 'No time limit', 'No credit card'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#0A2463]/70">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-ghost text-center py-3 rounded-xl font-semibold">Start Free Trial</Link>
            </div>

            {/* Paid */}
            <div className="flex flex-col p-7 rounded-2xl" style={{ background: 'linear-gradient(135deg, #0A2463, #1a4f96)', border: '2px solid rgba(62,146,204,0.3)' }}>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold text-[#0A2463] mb-4 self-start" style={{ background: '#FFB627' }}>STUDY PASS</div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">Study Pass</h3>
                <p className="text-white/55 text-sm mb-4">Everything you need to pass</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$34.99</span>
                  <span className="text-white/45">/month</span>
                </div>
              </div>
              <ul className="space-y-2.5 flex-1 mb-7">
                {[
                  'Unlimited practice questions',
                  'All 9 ACS knowledge areas',
                  'AI tutor on every question',
                  'Progress tracking by category',
                  'Category drill mode',
                  '60-question timed practice exams',
                  'FAA supplement figures included',
                  'Cancel anytime',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/85">
                    <CheckCircle className="w-4 h-4 text-[#FFB627] shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup?plan=study_pass" className="btn-gold text-center py-3 rounded-xl font-semibold">
                Get Study Pass
              </Link>
            </div>
          </div>
          <p className="text-center text-[#0A2463]/40 text-xs mt-4">All sales final. Not affiliated with the FAA. Results not guaranteed. See <Link href="/terms" className="underline">Terms</Link>.</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-6" style={{ background: '#EDF4FC' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0A2463] mb-10 text-center">Questions</h2>
          <div className="glass-card px-6 py-2">
            {FAQ_ITEMS.map(item => <FAQItem key={item.q} {...item} />)}
          </div>
          <p className="text-center text-[#0A2463]/50 text-sm mt-6">
            Something else?{' '}
            <a href="mailto:mewing713@gmail.com" className="text-[#3E92CC] hover:underline">Email us</a>
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Image src="/mountains.jpeg" alt="" fill className="object-cover object-center opacity-95" />
          <div className="absolute inset-0" style={{ background: 'rgba(5,18,55,0.68)' }} />
        </div>
        <div className="max-w-lg mx-auto text-center relative">
          <Plane className="w-10 h-10 text-[#5ab8f5] mx-auto mb-5" />
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">Your written test<br />is waiting.</h2>
          <p className="text-white/75 text-lg mb-8">Start with 10 free questions — no credit card, no commitment. You'll know within 5 minutes if TARMAC is right for you.</p>
          <Link href="/signup" className="btn-gold text-lg px-10 py-4 rounded-xl inline-flex items-center gap-2">
            Start Practicing Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-white/50 text-sm">10 free questions. Upgrade anytime. Cancel anytime.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6" style={{ background: '#ffffff', borderTop: '1px solid rgba(10,36,99,0.08)' }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="TARMAC" width={28} height={28} />
            <span className="font-bold text-[#0A2463] text-sm">TARMAC</span>
            <span className="text-[#0A2463]/40 text-xs ml-2">© 2025</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[#0A2463]/55 text-sm">
            <a href="#how" className="hover:text-[#0A2463]/70 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-[#0A2463]/70 transition-colors">Pricing</a>
            <a href="mailto:mewing713@gmail.com" className="hover:text-[#0A2463]/70 transition-colors">Support</a>
            <Link href="/terms" className="hover:text-[#0A2463]/70 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-[#0A2463]/70 transition-colors">Privacy</Link>
          </div>
          <p className="text-[#0A2463]/35 text-xs text-center">Not affiliated with the FAA.</p>
        </div>
      </footer>
    </div>
  )
}
