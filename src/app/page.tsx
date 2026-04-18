'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import {
  CheckCircle,
  Brain,
  BarChart3,
  BookOpen,
  MessageSquare,
  Target,
  Smartphone,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Plane,
  Clock,
  Shield,
  AlertTriangle,
  BookMarked,
  Repeat,
  Lightbulb,
  TrendingUp,
  XCircle,
  GraduationCap,
  Zap,
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

// ─── FAQ DATA ─────────────────────────────────────────────────────────────────
const FAQ_SECTIONS = [
  {
    section: 'General',
    items: [
      {
        q: 'What is TARMAC?',
        a: 'TARMAC is an AI-powered study tool for student pilots preparing for their FAA Private Pilot written knowledge test. It combines FAA-style practice questions with detailed AI explanations — so you practice repeatedly AND understand the concepts behind every answer.',
      },
      {
        q: 'Is this an official FAA product?',
        a: 'No. TARMAC is an independent study tool. We base our content on official FAA publications (FAR/AIM, Airman Certification Standards, PHAK, Aviation Weather Handbook), but we are not affiliated with or endorsed by the FAA.',
      },
      {
        q: 'How is TARMAC different from other test prep tools?',
        a: 'Most test prep tools give you questions with brief text answers — they encourage memorization. TARMAC combines two proven approaches: repetitive practice (which builds pattern recognition) and AI explanations (which ensure you understand the WHY). You get test readiness AND real knowledge.',
      },
      {
        q: 'Isn\'t this just memorizing the test bank?',
        a: 'No — and that\'s the key difference. Traditional test prep has you memorize specific answers. TARMAC has you practice similar questions repeatedly, but the AI ensures you understand the underlying concept each time.\n\nWhen you understand WHY an answer is correct, you\'re not memorizing — you\'re learning. That means even if the FAA changes question wording slightly, you can still answer correctly because you understand the concept. Plus, you\'ll actually be a knowledgeable pilot, not just someone who passed a test.',
      },
      {
        q: 'Why does TARMAC combine practice tests with AI explanations?',
        a: 'Research shows two things: (1) Practice testing is one of the most effective study methods — you remember information significantly better when you test yourself repeatedly and get immediate feedback. (2) Memorization alone fails when questions are rephrased or when real-world application is needed.\n\nTARMAC combines both: repetitive practice for pattern recognition and test confidence, plus AI explanations for lasting retention and genuine understanding.',
      },
    ],
  },
  {
    section: 'About the Questions',
    items: [
      {
        q: 'Are these the exact questions from the FAA test?',
        a: 'No. The FAA does not publish their current test bank. Our questions are FAA-style, based on the Airman Certification Standards, designed to teach the concepts you need to know. You\'ll see the same CONCEPTS on the real test — often in slightly different wording. That\'s why understanding > memorization.',
      },
      {
        q: 'Will I see the exact same questions on the real test?',
        a: 'Not the exact same questions — the FAA doesn\'t publish their current test bank. But you WILL see the exact same concepts.\n\nExample: TARMAC might ask "What\'s the minimum fuel reserve for day VFR?" The real test might ask "For VFR flight during daylight hours, what fuel reserve is required?" Same concept, slightly different wording. If you understand the concept (30 minutes at cruise speed), you\'ll get both right. That\'s why understanding matters more than memorization.',
      },
      {
        q: 'How many questions should I practice before taking the real test?',
        a: 'Most successful students practice 200–400 questions before their test. The magic happens around 200 questions — that\'s when patterns start clicking and concepts become automatic. After 400 questions, you\'ve likely seen every major concept multiple times in different contexts.\n\nOur recommended plan: 20–30 questions per day for 4 weeks. That\'s roughly 400–600 questions total, which gives excellent test readiness.',
      },
      {
        q: 'How many questions does TARMAC have?',
        a: 'Our question bank grows continuously. We use AI to generate high-quality questions covering all 9 ACS knowledge areas. Each practice session draws from a mix of database questions and freshly generated ones — so you\'re always seeing variety. You won\'t run out of questions.',
      },
      {
        q: 'Do questions include supplement figures?',
        a: 'Yes. Many questions reference figures from the FAA testing supplement (FAA-CT-8080-2H), just like the real test. You\'ll practice reading METARs, TAFs, sectional charts, density altitude charts, and performance tables — all with the actual supplement document available in-app.',
      },
      {
        q: 'Can I focus on specific topics?',
        a: 'Absolutely. Choose from all 9 ACS categories: Regulations, Airspace, Weather Theory, Weather Services, Aircraft Performance, Weight & Balance, Aerodynamics, Flight Instruments, and Navigation. You can also target your weakest areas specifically.',
      },
      {
        q: 'What if I get a question wrong multiple times?',
        a: 'That\'s actually a good thing — it means you\'ve identified a knowledge gap. When you miss a question, the AI explains the concept. If you still don\'t get it, ask follow-up questions. The AI will explain it differently, use different analogies, and break it down further.\n\nYou\'ll then see similar questions again in future sessions (that\'s the repetition part). Eventually it clicks — and once you understand it, it stays locked in memory. Getting it wrong is part of learning. The key is understanding WHY you got it wrong.',
      },
    ],
  },
  {
    section: 'About the AI',
    items: [
      {
        q: 'How does the AI work?',
        a: 'TARMAC uses Claude (by Anthropic), a leading AI system, for explanations and tutoring. It\'s been given detailed instructions about FAA regulations, aviation handbooks, and how to teach concepts effectively.',
      },
      {
        q: 'How is this different from just using ChatGPT for test prep?',
        a: 'ChatGPT is a general AI — it knows a little about everything. TARMAC is specifically built for FAA test prep.\n\nThe key differences:\n• Questions are designed to match FAA test format and difficulty\n• Explanations reference actual FAR/AIM regulations\n• Progress tracking shows your weak areas\n• The AI keeps context about the specific question you just answered\n• You\'re practicing in test-mode (not conversation mode)\n\nChatGPT is great for many things. For passing your FAA written? Use a tool built specifically for that purpose.',
      },
      {
        q: 'Is the AI always right?',
        a: 'The AI is very knowledgeable about aviation, but like any tool, it\'s not infallible. Always verify critical information with official FAA sources and your CFI. If you spot an error, please report it — we take accuracy seriously.',
      },
      {
        q: 'Can I ask follow-up questions?',
        a: 'Yes. After answering any question, you can open the AI chat and ask anything: "Why is it 30 minutes and not 45?" or "Can you explain VFR weather minimums again differently?" The AI maintains context about the specific question you just answered. Ask as many times as you need — it won\'t get impatient.',
      },
      {
        q: 'Does the AI remember previous conversations?',
        a: 'Within a session, yes — the AI can reference earlier questions. Between sessions, no — each practice session starts fresh. Your progress statistics are saved permanently, but conversation history is not.',
      },
    ],
  },
  {
    section: 'Technical',
    items: [
      {
        q: 'What devices does TARMAC work on?',
        a: 'Any device with a modern web browser — iPhone, Android, iPad, Mac, PC, Chromebook. Your progress syncs across all devices automatically.',
      },
      {
        q: 'Do I need to download an app?',
        a: 'No. TARMAC is a web application. No downloads, no app store, no updates to manage. Log in and start studying.',
      },
      {
        q: 'Does it work offline?',
        a: 'No. TARMAC requires an internet connection because the AI generates explanations in real time. Make sure you have WiFi or cellular data when studying.',
      },
      {
        q: 'Is my data secure?',
        a: 'Yes. All data is encrypted in transit and at rest. Payment processing is handled by Stripe — we never see or store your card number. We do not sell or share your personal information.',
      },
    ],
  },
  {
    section: 'Account & Billing',
    items: [
      {
        q: 'How does the free trial work?',
        a: 'You get 10 free questions with full AI explanations. No credit card required. No time limit. Try it at your own pace, see if the approach works for you, then decide.',
      },
      {
        q: 'What happens after the free trial?',
        a: 'You\'ll be prompted to upgrade to the Study Pass ($34.99/month) to continue practicing. Your progress from the free trial carries over automatically.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes. Cancel from your account settings at any time. You keep access through the end of your current billing period, then it stops. No cancellation fees.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'Refund requests are handled case-by-case. Contact us at support@tarmac.app if you have an issue and we\'ll work with you.',
      },
      {
        q: 'Can multiple students share one account?',
        a: 'Accounts are individual. Sharing means shared progress tracking, which defeats the purpose of personalized weak-area identification. Each student should have their own account.',
      },
      {
        q: 'Do you offer student discounts?',
        a: 'Not at this time. At $34.99/month, TARMAC is priced to be accessible — and most students only need one to two months to be fully test-ready.',
      },
    ],
  },
  {
    section: 'Studying & Learning',
    items: [
      {
        q: 'Can I just use TARMAC without ground school?',
        a: 'We don\'t recommend it. TARMAC is designed to supplement ground school, not replace it. You still need a CFI endorsement to take the test.\n\nThe best approach: Attend ground school to learn concepts initially → use TARMAC to practice and reinforce what you learned → ask the AI to clarify anything confusing from class.\n\nThink of it like: Ground school is learning to fly the airplane. TARMAC is practicing the maneuvers until they\'re automatic.',
      },
      {
        q: 'How long should I study before taking the written test?',
        a: 'It depends on your current knowledge, but most students benefit from 4 weeks of consistent practice (20–30 questions per day, 4–5 days per week). Watch your progress dashboard — when you\'re consistently 80%+ across all categories, you\'re likely ready.\n\nSee the "TARMAC Study Method" section on this page for a detailed week-by-week plan.',
      },
      {
        q: 'Should I read the AI explanations even when I get answers right?',
        a: 'Absolutely yes. This is one of the most important habits for maximizing retention. When you get a question right, reading the explanation reinforces the "why" — which helps you retain it under test pressure and apply it to slightly different wording.\n\nMany students who consistently read all explanations (not just wrong answers) report their scores improving significantly faster.',
      },
      {
        q: 'Can TARMAC help with my oral exam (checkride)?',
        a: 'Indirectly, yes. The depth of understanding TARMAC builds is exactly what DPEs look for during oral exams. However, TARMAC is specifically designed for the written knowledge test.',
      },
      {
        q: 'What if I\'m studying for Instrument Rating or Commercial?',
        a: 'TARMAC currently covers Private Pilot only. Instrument Rating and Commercial content is planned for the future.',
      },
      {
        q: 'How do I know when I\'m ready to take the real test?',
        a: 'Good indicators: (1) Consistently 80%+ on practice sessions across all categories. (2) You understand the explanations, not just the answer letters. (3) Your weak areas have improved on the progress dashboard. (4) Your CFI agrees you\'re ready. All four should be true.',
      },
    ],
  },
  {
    section: 'Content & Accuracy',
    items: [
      {
        q: 'How do I know the information is accurate?',
        a: 'All content is based on current FAA publications: FAR/AIM, Airman Certification Standards, Pilot\'s Handbook of Aeronautical Knowledge, and the Aviation Weather Handbook. Always cross-reference critical information with official FAA sources and your CFI.',
      },
      {
        q: 'What if I find an error?',
        a: 'Report it through the app or email support. We investigate and correct errors promptly. Aviation accuracy matters — your feedback directly improves the platform.',
      },
      {
        q: 'Are regulations kept up to date?',
        a: 'We monitor FAA regulatory updates and refresh content accordingly. However, aviation regulations can change. Always verify current rules with the latest FAR/AIM or faa.gov.',
      },
      {
        q: 'Do you cover all ACS knowledge areas?',
        a: 'Yes: Regulations, Airspace, Weather Theory, Weather Services, Aircraft Performance, Weight & Balance, Aerodynamics, Flight Instruments, and Navigation — all 9 areas of the Private Pilot ACS.',
      },
    ],
  },
  {
    section: 'Troubleshooting',
    items: [
      {
        q: 'The AI isn\'t responding. What do I do?',
        a: 'Try refreshing the page. Check your internet connection. Still having issues? Contact support with details about what you were doing when it stopped.',
      },
      {
        q: 'My progress isn\'t saving.',
        a: 'Make sure you\'re logged in (not the free demo). If logged in and still not saving, try logging out and back in. Contact support if it persists.',
      },
      {
        q: 'Can I reset my progress?',
        a: 'Yes — Settings → Reset Progress. Warning: this is permanent and cannot be undone.',
      },
      {
        q: 'I forgot my password.',
        a: 'Click "Forgot password" on the login page. Enter your email and we\'ll send a reset link.',
      },
    ],
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
  const [openSection, setOpenSection] = useState<string | null>('General')

  return (
    <div className="light-page min-h-screen">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4" style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(10,36,99,0.08)', boxShadow: '0 1px 20px rgba(10,36,99,0.07)' }}>
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="TARMAC" width={28} height={28} />
          <span className="text-xl font-bold text-[#0A2463] tracking-tight">TARMAC</span>
        </Link>
        <div className="hidden md:flex items-center gap-7 text-sm text-[#0A2463]/75">
          <a href="#method" className="hover:text-[#0A2463] transition-colors">The Method</a>
          <a href="#demo" className="hover:text-[#0A2463] transition-colors">Try Demo</a>
          <a href="#pricing" className="hover:text-[#0A2463] transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-[#0A2463] transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-[#0A2463]/75 hover:text-[#0A2463] text-sm px-4 py-2 transition-colors">Log in</Link>
          <Link href="/signup" className="btn-gold text-sm px-5 py-2.5">Start Free</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-28 px-6 overflow-hidden">
        {/* Hero background photo */}
        <div className="absolute inset-0 pointer-events-none">
          <Image src="/hero.png" alt="" fill className="object-cover object-center" priority />
          {/* Strong uniform dark overlay for text readability */}
          <div className="absolute inset-0" style={{ background: 'rgba(5,18,55,0.70)' }} />
          {/* Subtle vignette */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(5,18,55,0.45) 100%)' }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.92)' }}>
            <Plane className="w-4 h-4 text-[#FFB627]" />
            AI-powered Private Pilot written test prep
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-5" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
            Practice Tests Work.
            <span className="block" style={{ color: '#5ab8f5' }}>AI Makes Them Better.</span>
          </h1>

          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
            Practice repeatedly until the test feels automatic. Then understand every answer with an AI that explains the <em>why</em> — like a patient CFI available 24/7.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-5">
            <Link href="/signup" className="btn-gold text-lg px-8 py-4 rounded-xl">
              Start Practicing Free — 20 Questions
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#demo" className="text-lg px-8 py-4 rounded-xl font-semibold transition-all hover:bg-white/15" style={{ color: 'white', border: '2px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.08)' }}>
              Try the Demo First
            </a>
          </div>
          <p className="text-white/65 text-sm">No credit card required. No time limit on free trial.</p>

          <div className="grid grid-cols-3 gap-6 max-w-sm mx-auto mt-14 pt-14 border-t border-white/25">
            {[
              { val: '9', label: 'ACS Knowledge Areas' },
              { val: '24/7', label: 'AI Tutor Access' },
              { val: '20', label: 'Free Questions' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-3xl font-bold text-[#FFB627]">{s.val}</div>
                <div className="text-white/75 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Practice Effect Stats Callout ── */}
      <section className="py-10 px-6" style={{ background: 'rgba(62,146,204,0.07)', borderTop: '1px solid rgba(62,146,204,0.15)', borderBottom: '1px solid rgba(62,146,204,0.15)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-[#3E92CC] text-sm font-semibold mb-2">
              <TrendingUp className="w-4 h-4" />
              The Practice Effect
            </div>
            <h3 className="text-xl font-bold text-[#0A2463]">Why practice testing outperforms every other study method</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-5">
              <p className="text-xs font-semibold text-[#3E92CC] uppercase tracking-wider mb-3">Students who practice 200+ questions</p>
              <ul className="space-y-2">
                {[
                  'Remember information 2–3× better than passive reading',
                  'Build pattern recognition — test questions feel familiar',
                  'Walk in confident, not guessing',
                ].map(t => (
                  <li key={t} className="flex items-start gap-2 text-sm text-[#0A2463]/70">
                    <CheckCircle className="w-4 h-4 text-[#3E92CC] shrink-0 mt-0.5" />{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs font-semibold text-[#FFB627] uppercase tracking-wider mb-3">Students who understand concepts (not just memorize)</p>
              <ul className="space-y-2">
                {[
                  'Retain information far longer — not just until test day',
                  'Handle rephrased or unfamiliar question wording',
                  'Become safer, more knowledgeable pilots',
                ].map(t => (
                  <li key={t} className="flex items-start gap-2 text-sm text-[#0A2463]/70">
                    <CheckCircle className="w-4 h-4 text-[#FFB627] shrink-0 mt-0.5" />{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-center text-[#0A2463]/70 text-sm mt-6 font-medium">TARMAC gives you both: Practice + Understanding</p>
        </div>
      </section>

      {/* ── Modern Approach ── */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ background: '#0A2463' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(62,146,204,0.15) 0%, transparent 60%)' }} />
        <div className="max-w-5xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: 'rgba(255,182,39,0.15)', color: '#FFB627', border: '1px solid rgba(255,182,39,0.25)' }}>
                <Zap className="w-3.5 h-3.5" />
                A New Standard for Aviation Study
              </div>
              <h2 className="text-4xl font-black text-white leading-tight mb-5">
                Aviation study<br />
                <span style={{ color: '#FFB627' }}>finally modernized.</span>
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-6">
                The aviation industry demands precision, yet test prep has relied on the same approach for decades — print flashcards and PDF dumps. TARMAC brings it into the modern era: adaptive practice, instant AI explanations, and real-time progress tracking built specifically for student pilots.
              </p>
              <p className="text-white/50 text-base leading-relaxed">
                We believe that understanding the <em className="text-white/80">why</em> behind every answer isn't just good for your test score — it makes you a safer, more confident pilot.
              </p>
            </div>
            <div className="space-y-4">
              {[
                {
                  icon: <Brain className="w-5 h-5 text-[#FFB627]" />,
                  title: 'AI that teaches, not just corrects',
                  body: 'Every wrong answer triggers a personalized explanation that adapts to your understanding — not a generic "the answer is B."',
                },
                {
                  icon: <TrendingUp className="w-5 h-5 text-[#3E92CC]" />,
                  title: 'Adaptive weak-area targeting',
                  body: 'TARMAC tracks your performance across all 9 ACS knowledge areas and automatically routes you to where you need the most work.',
                },
                {
                  icon: <GraduationCap className="w-5 h-5 text-green-400" />,
                  title: 'Built around proven learning science',
                  body: 'Spaced repetition, retrieval practice, and interleaved testing — the same techniques top universities use, designed for FAA prep.',
                },
                {
                  icon: <Shield className="w-5 h-5 text-purple-400" />,
                  title: 'Real exam simulation included',
                  body: 'Full 60-question timed practice exams that mirror the actual FAA testing environment — so test day feels like practice.',
                },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm mb-1">{item.title}</div>
                    <div className="text-white/55 text-xs leading-relaxed">{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="py-20 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0A2463] mb-3">Why traditional test prep falls short</h2>
            <p className="text-[#0A2463]/75">Three problems every student pilot faces — and how TARMAC solves them.</p>
          </div>
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="lg:w-64 shrink-0">
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(10,36,99,0.1)', boxShadow: '0 4px 24px rgba(10,36,99,0.08)' }}>
                <Image src="/pilot-studying.png" alt="Student pilot studying" width={300} height={400} className="w-full object-cover" />
              </div>
              <p className="text-[#0A2463]/55 text-xs text-center mt-2">Sound familiar?</p>
            </div>
          <div className="flex-1 grid gap-6">
            {[
              { icon: <AlertTriangle className="w-6 h-6 text-[#FFB627]" />, title: 'Memorization breaks when wording changes', body: 'You can memorize answer letters, but what happens when the FAA rephrases a question slightly? Or when you\'re actually flying and need to apply weight & balance concepts? Memorization fails. Understanding doesn\'t.' },
              { icon: <Clock className="w-6 h-6 text-[#FFB627]" />, title: 'Questions at midnight, answers next week', body: 'You\'re studying late and something doesn\'t click. Your CFI won\'t be available until your next lesson. You stay stuck, confusion compounds, and test day approaches.' },
              { icon: <BookMarked className="w-6 h-6 text-[#FFB627]" />, title: 'No practice = not test-ready', body: 'Reading the PHAK builds knowledge, but it doesn\'t build test confidence. You need repetitive practice with realistic questions to build pattern recognition. Without it, the test format feels foreign.' },
            ].map(p => (
              <div key={p.title} className="glass-card p-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,182,39,0.1)' }}>{p.icon}</div>
                <h3 className="font-semibold text-[#0A2463] mb-2 text-base">{p.title}</h3>
                <p className="text-[#0A2463]/75 text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* ── Science Section ── */}
      <section className="py-20 px-6" style={{ background: '#EDF4FC' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-[#FFB627] text-xs font-semibold uppercase tracking-wider mb-3 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,182,39,0.12)' }}>
              The Science of Test Prep
            </div>
            <h2 className="text-3xl font-bold text-[#0A2463] mb-3">The proven way to pass: practice + understanding</h2>
            <p className="text-[#0A2463]/75 max-w-xl mx-auto">There's a reason practice tests work better than reading textbooks. But memorization alone isn't enough. You need both.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(62,146,204,0.15)' }}>
                  <Repeat className="w-5 h-5 text-[#3E92CC]" />
                </div>
                <h3 className="font-semibold text-[#0A2463]">Why practice tests work</h3>
              </div>
              <p className="text-xs font-semibold text-[#3E92CC] uppercase tracking-wider mb-3">The Testing Effect (Proven by Science)</p>
              <p className="text-[#0A2463]/80 text-sm leading-relaxed mb-4">
                Research shows you remember information 2–3× better when you test yourself repeatedly, get immediate feedback, and see the same material in different contexts. This is why practice tests outperform reading or highlighting — your brain learns by doing, not just consuming.
              </p>
              <p className="text-[#0A2463]/80 text-sm leading-relaxed">
                The FAA written exam draws from a limited set of concepts. The more you practice with realistic questions, the more familiar those concepts become. That's not cheating — that's smart studying.
              </p>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,182,39,0.15)' }}>
                  <Lightbulb className="w-5 h-5 text-[#FFB627]" />
                </div>
                <h3 className="font-semibold text-[#0A2463]">Why understanding matters</h3>
              </div>
              <p className="text-xs font-semibold text-[#FFB627] uppercase tracking-wider mb-3">But Memorization Has a Fatal Flaw</p>
              <p className="text-[#0A2463]/80 text-sm leading-relaxed mb-4">
                You can memorize "Answer B" for 100 questions. Then test day comes and the FAA changes the wording slightly. Suddenly you're guessing.
              </p>
              <p className="text-[#0A2463]/80 text-sm leading-relaxed">
                Worse: you pass the test but don't understand weight & balance. Now you're a pilot who can't actually calculate if your plane is safe to fly. You need to understand WHY Answer B is correct — the underlying aviation concept, and what makes the other answers wrong. That's where AI tutoring comes in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="method" className="py-20 px-6 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
        {/* Aerial photo background strip */}
        <div className="absolute inset-0 pointer-events-none">
          <Image src="/formation.png" alt="" fill className="object-cover object-center opacity-90" />
          <div className="absolute inset-0" style={{ background: 'rgba(10,36,99,0.72)' }} />
        </div>
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">
              Practice like you're taking the real test.<br />
              <span className="text-[#3E92CC]">Understand like you have a CFI on every question.</span>
            </h2>
            <p className="text-white/80">Three phases that build lasting knowledge — not just test scores.</p>
          </div>
          <div className="space-y-6">
            {[
              {
                step: '01',
                color: '#3E92CC',
                icon: <Repeat className="w-6 h-6" style={{ color: '#3E92CC' }} />,
                title: 'Repetition — Build Pattern Recognition',
                badge: 'Practice until it\'s automatic',
                body: 'Work through hundreds of FAA-style questions across all 9 ACS knowledge areas. The same topics appear multiple times in different ways — just like the real test. After 50–100 questions on a topic, your brain starts recognizing patterns: "Oh, this is another weight & balance question." "This is asking about VFR minimums in Class E." After enough practice, you walk into the test center thinking: "I\'ve seen this before." That confidence is everything.',
              },
              {
                step: '02',
                color: '#FFB627',
                icon: <Brain className="w-6 h-6" style={{ color: '#FFB627' }} />,
                title: 'Understanding — Learn the "Why"',
                badge: 'AI explains every answer',
                body: 'Every time you answer (right or wrong), the AI explains why the correct answer is correct, what makes the other answers wrong, and a real-world example you\'ll remember. You can ask follow-up questions: "Why is it 30 minutes and not 45?" "Can you explain that differently?" The AI keeps going until you GET it. No more moving on while still confused. No more wondering "why is B correct?"',
              },
              {
                step: '03',
                color: '#22c55e',
                icon: <TrendingUp className="w-6 h-6" style={{ color: '#22c55e' }} />,
                title: 'Retention — Lock It Into Memory',
                badge: 'Remember for flight, not just the test',
                body: 'When you understand WHY an answer is correct, you remember it far longer than when you just memorize. Traditional test prep: "The answer is B. Next question." You forget it in 3 days. TARMAC: "The answer is B because [concept]. Here\'s an analogy: [example]. Make sense?" You remember it for months. Plus, you practice the same topics repeatedly in different ways. Repetition + understanding = permanent retention. By test day, you\'re not recalling memorized answers. You\'re applying understood concepts.',
              },
            ].map(s => (
              <div key={s.step} className="glass-card p-6 flex gap-6 items-start">
                <div className="text-4xl font-bold shrink-0 w-12 text-right" style={{ color: s.color }}>{s.step}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {s.icon}
                    <h3 className="font-semibold text-[#0A2463]">{s.title}</h3>
                    <span className="ml-auto text-xs px-2.5 py-1 rounded-full font-medium hidden sm:block" style={{ background: s.color + '15', color: s.color }}>{s.badge}</span>
                  </div>
                  <p className="text-[#0A2463]/75 text-sm leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Demo ── */}
      <section id="demo" className="py-20 px-6 relative overflow-hidden">
        {/* Cockpit photo background */}
        <div className="absolute inset-0 pointer-events-none">
          <Image src="/cockpit.jpeg" alt="" fill className="object-cover object-top opacity-90" />
          <div className="absolute inset-0" style={{ background: 'rgba(10,36,99,0.7)' }} />
        </div>
        <div className="max-w-2xl mx-auto relative">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">Try TARMAC right now</h2>
            <p className="text-white/80">No signup. Answer a real question and see the AI explanation.</p>
          </div>
          <DemoWidget />
        </div>
      </section>

      {/* ── Why Other Methods Fall Short ── */}
      <section className="py-20 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0A2463] mb-3">The problem with other study methods</h2>
            <p className="text-[#0A2463]/75">Each approach has real value. Each also has a fatal flaw.</p>
          </div>
          <div className="space-y-4 mb-8">
            {[
              {
                method: 'Reading FAA Handbooks',
                pros: 'Builds deep conceptual knowledge',
                cons: ['1,000+ pages of dense technical writing', 'No practice with actual test questions', 'No way to know if you\'re retaining information', 'Test day still feels unfamiliar'],
                result: 'You understand concepts — but you\'re not test-ready.',
              },
              {
                method: 'Traditional Test Prep (Question Banks)',
                pros: 'Lots of practice questions',
                cons: ['Brief explanations ("The answer is B because...")', 'Can\'t ask follow-up questions', 'Encourages memorization over understanding', 'Fails when FAA rephrases questions'],
                result: 'You might pass — but you don\'t really understand aviation.',
              },
              {
                method: 'Video Courses',
                pros: 'Engaging format, covers concepts well',
                cons: ['40+ hours of passive watching', 'Can\'t customize to your weak areas', 'Separate test prep still required', 'Expensive ($200–400)'],
                result: 'You learn — but you still need separate practice.',
              },
            ].map(m => (
              <div key={m.method} className="glass-card p-5" style={{ borderLeft: '3px solid rgba(239,68,68,0.35)' }}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="font-semibold text-[#0A2463] text-sm">{m.method}</h3>
                  <span className="text-xs text-[#0A2463]/60 shrink-0">{m.pros}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 mb-3">
                  {m.cons.map(c => (
                    <div key={c} className="flex items-start gap-2 text-xs text-[#0A2463]/75">
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />{c}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#0A2463]/70 italic">{m.result}</p>
              </div>
            ))}

            {/* TARMAC highlight */}
            <div className="glass-card p-5" style={{ borderLeft: '3px solid #3E92CC', background: 'rgba(62,146,204,0.05)' }}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="font-semibold text-[#0A2463] text-sm">TARMAC: Practice + Understanding</h3>
                <span className="text-xs text-[#3E92CC] shrink-0 font-medium">The best of both</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 mb-3">
                {[
                  'Realistic FAA-style questions for repetition',
                  'AI explains every answer in plain English',
                  'Ask unlimited follow-up questions',
                  'Auto-focuses on your weak areas',
                  'Repetition builds pattern recognition',
                  'Understanding ensures lasting retention',
                  'Affordable ($34.99/month)',
                  'FAA supplement figures included',
                ].map(c => (
                  <div key={c} className="flex items-start gap-2 text-xs text-[#0A2463]/75">
                    <CheckCircle className="w-3.5 h-3.5 text-[#3E92CC] shrink-0 mt-0.5" />{c}
                  </div>
                ))}
              </div>
              <p className="text-sm text-[#0A2463] font-semibold">You understand aviation AND you're test-ready. Both.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Best of Both Worlds ── */}
      <section className="py-20 px-6" style={{ background: '#EDF4FC' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0A2463] mb-3">You don't have to choose</h2>
            <p className="text-[#0A2463]/75 max-w-xl mx-auto">Between test-readiness and genuine knowledge. TARMAC is the only tool built to deliver both.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: <Repeat className="w-7 h-7 text-[#3E92CC]" />,
                title: 'The Repetition of Practice Tests',
                color: '#3E92CC',
                points: ['Hundreds of realistic questions', 'Practice same topics until automatic', 'Build pattern recognition + test confidence'],
              },
              {
                icon: <Brain className="w-7 h-7 text-[#FFB627]" />,
                title: 'The Depth of AI Understanding',
                color: '#FFB627',
                points: ['AI explains every answer in plain English', 'Ask "why?" as many times as you need', 'Learn concepts, not just answer choices'],
              },
              {
                icon: <GraduationCap className="w-7 h-7 text-[#22c55e]" />,
                title: 'The Result',
                color: '#22c55e',
                points: ['Pass the test with confidence', 'Actually understand aviation', 'Retain knowledge for your flying career'],
              },
            ].map(col => (
              <div key={col.title} className="glass-card p-5 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: col.color + '15' }}>
                  {col.icon}
                </div>
                <h3 className="font-semibold text-[#0A2463] text-sm mb-3">{col.title}</h3>
                <ul className="space-y-2">
                  {col.points.map(p => (
                    <li key={p} className="text-xs text-[#0A2463]/75 leading-relaxed">{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0A2463] mb-3">Everything you need to study effectively</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-5">
            {[
              { icon: <Brain className="w-6 h-6 text-[#3E92CC]" />, title: 'AI Tutor 24/7', body: 'Explains concepts differently until they click. Patient, clear, always available.' },
              { icon: <BarChart3 className="w-6 h-6 text-[#FFB627]" />, title: 'Progress Dashboard', body: 'See accuracy by category. Know exactly where to focus next.' },
              { icon: <Smartphone className="w-6 h-6 text-[#3E92CC]" />, title: 'Any Device', body: 'Phone, tablet, laptop. Progress syncs across everything automatically.' },
              { icon: <BookOpen className="w-6 h-6 text-[#FFB627]" />, title: 'Practice Mode', body: 'Work at your own pace with instant feedback and explanations.' },
              { icon: <Target className="w-6 h-6 text-[#3E92CC]" />, title: 'Category Drills', body: 'Focus on just weather, or just airspace. Drill weak areas fast.' },
              { icon: <MessageSquare className="w-6 h-6 text-[#FFB627]" />, title: 'Ask Follow-Ups', body: 'Not just flashcards — a real back-and-forth learning experience.' },
              { icon: <Shield className="w-6 h-6 text-[#3E92CC]" />, title: 'ACS Aligned', body: 'Covers all 9 Private Pilot ACS knowledge areas systematically.' },
              { icon: <RefreshCw className="w-6 h-6 text-[#FFB627]" />, title: 'Growing Question Bank', body: 'AI-generated questions mean you\'ll always see new material.' },
            ].map(f => (
              <div key={f.title} className="glass-card p-4">
                <div className="mb-3">{f.icon}</div>
                <h3 className="font-semibold text-[#0A2463] text-sm mb-1">{f.title}</h3>
                <p className="text-[#0A2463]/70 text-xs leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4-Week Study Plan ── */}
      <section className="py-20 px-6" style={{ background: '#EDF4FC' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-[#3E92CC] text-xs font-semibold uppercase tracking-wider mb-3 px-3 py-1.5 rounded-full" style={{ background: 'rgba(62,146,204,0.12)' }}>
              The TARMAC Study Method
            </div>
            <h2 className="text-3xl font-bold text-[#0A2463] mb-3">How to use TARMAC for maximum results</h2>
            <p className="text-[#0A2463]/75">A 4-week plan that works — built around practice testing and AI understanding.</p>
          </div>

          {/* Progress preview */}
          <div className="glass-card p-5 mb-6">
            <p className="text-xs font-semibold text-[#0A2463]/60 uppercase tracking-wider mb-4">Typical score progression</p>
            <div className="space-y-2">
              {[
                { label: 'Week 1 (Exposure)', pct: 48, color: '#ef4444' },
                { label: 'Week 2 (Repetition)', pct: 65, color: '#FFB627' },
                { label: 'Week 3 (Mastery)', pct: 79, color: '#3E92CC' },
                { label: 'Week 4 (Confidence)', pct: 87, color: '#22c55e' },
              ].map(w => (
                <div key={w.label} className="flex items-center gap-3">
                  <span className="text-xs text-[#0A2463]/70 w-40 shrink-0">{w.label}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(10,36,99,0.08)' }}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${w.pct}%`, background: w.color }} />
                  </div>
                  <span className="text-xs font-semibold w-10 text-right" style={{ color: w.color }}>{w.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {[
              { week: 'Week 1', label: 'Exposure Phase', color: '#ef4444', goal: 'See every topic at least once', body: 'Practice Mode: 20 questions per day, mixed topics. Don\'t worry about scores yet. Focus on reading every AI explanation carefully — even when you get it right. Ask follow-up questions when confused. By end of week, you\'ve seen 140 questions across all 9 categories. Nothing on the real test will be completely new.' },
              { week: 'Week 2', label: 'Repetition Phase', color: '#FFB627', goal: 'Drill your weak areas until they improve', body: 'Check your progress dashboard. Find your 3 weakest categories (example: Weather 55%, Airspace 62%, Weight & Balance 58%). Do focused sessions: 20 questions per weak category per day. Read every explanation, even for correct answers. By end of week, weak areas are climbing to the 65–75% range.' },
              { week: 'Week 3', label: 'Mastery Phase', color: '#3E92CC', goal: 'Get comfortable with mixed practice', body: 'Switch back to random practice across all categories. This simulates real test format. Do 30–40 questions per day. You\'ll start noticing: "I\'ve seen this concept before in a different question." "I remember the AI\'s explanation about this." Answering faster, with more confidence. Target: consistently 75–85% on mixed sessions.' },
              { week: 'Week 4', label: 'Confidence Phase', color: '#22c55e', goal: 'Final review and test simulation', body: 'Take full simulated exams: 60 questions, 2.5-hour time limit, no AI help until after you finish. Review results with AI afterward. Do 2–3 full practice exams this week. Also run quick review sessions on original weak areas — don\'t let old weaknesses sneak back. By end of week, you\'re scoring 80%+ consistently. You\'re ready.' },
              { week: 'Test Day', label: 'You\'re ready', color: '#a855f7', goal: 'Walk in with confidence', body: 'You\'ve practiced 400–600 questions. You\'ve seen every major concept multiple times. You understand the WHY behind every answer. You\'ve built pattern recognition from repetition. You sit down. The first question appears. You think: "I know this. I\'ve practiced this exact concept." You\'re not nervous. You\'re applying knowledge you genuinely understand.' },
            ].map(w => (
              <div key={w.week} className="glass-card p-5 flex gap-4 items-start">
                <div className="text-center shrink-0 w-20">
                  <div className="text-xs font-bold" style={{ color: w.color }}>{w.week}</div>
                  <div className="text-xs text-[#0A2463]/60 mt-0.5 leading-tight">{w.label}</div>
                </div>
                <div style={{ borderLeft: `2px solid ${w.color}40` }} className="pl-4 flex-1">
                  <p className="text-xs font-semibold text-[#0A2463]/75 mb-1.5">Goal: {w.goal}</p>
                  <p className="text-[#0A2463]/80 text-sm leading-relaxed">{w.body}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[#0A2463]/55 text-xs mt-6">TARMAC supplements your CFI and ground school — it doesn't replace them.</p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0A2463] mb-3">Simple, transparent pricing</h2>
            <p className="text-[#0A2463]/75">No tricks. No hidden fees. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="glass-card p-7 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[#0A2463] mb-1">Free Trial</h3>
                <p className="text-[#0A2463]/70 text-sm mb-4">See if TARMAC works for you</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#0A2463]">$0</span>
                  <span className="text-[#0A2463]/60">forever</span>
                </div>
              </div>
              <ul className="space-y-2.5 flex-1 mb-7">
                {['10 practice questions', 'Full AI explanations', 'No credit card required', 'No time limit'].map(f => (
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
                <p className="text-white/60 text-sm mb-4">Unlimited access to everything</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$34.99</span>
                  <span className="text-white/50">/month</span>
                </div>
              </div>
              <ul className="space-y-2.5 flex-1 mb-7">
                {[
                  'Unlimited practice questions',
                  'All 9 ACS knowledge areas',
                  'AI tutor on every question',
                  'Progress tracking & analytics',
                  'Category-focused drill mode',
                  'Practice exam simulation (60Q, 150 min)',
                  'FAA supplement figures in-app',
                  'Cancel anytime',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/85">
                    <CheckCircle className="w-4 h-4 text-[#FFB627] shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup?plan=study_pass" className="btn-gold text-center py-3 rounded-xl font-semibold">
                Get Started
              </Link>
            </div>
          </div>

          <p className="text-center text-[#0A2463]/70 text-sm mt-6 italic">We believe you'll only need us for one to two months!</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 px-6" style={{ background: '#EDF4FC' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0A2463] mb-3">Frequently asked questions</h2>
            <p className="text-[#0A2463]/75">Everything you need to know before starting.</p>
          </div>

          <div className="space-y-2">
            {FAQ_SECTIONS.map(section => (
              <div key={section.section} className="glass-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  onClick={() => setOpenSection(openSection === section.section ? null : section.section)}
                >
                  <span className="font-semibold text-[#0A2463] text-sm">{section.section}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#0A2463]/55">{section.items.length} questions</span>
                    {openSection === section.section
                      ? <ChevronUp className="w-4 h-4 text-[#3E92CC]" />
                      : <ChevronDown className="w-4 h-4 text-[#3E92CC]" />}
                  </div>
                </button>
                {openSection === section.section && (
                  <div className="px-5 pb-2" style={{ borderTop: '1px solid rgba(10,36,99,0.08)' }}>
                    {section.items.map(item => <FAQItem key={item.q} {...item} />)}
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-[#0A2463]/55 text-sm mt-8">
            Still have questions?{' '}
            <a href="mailto:support@tarmac.app" className="text-[#3E92CC] hover:underline">Email us</a> — we reply within 24 hours.
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Image src="/mountains.jpeg" alt="" fill className="object-cover object-center opacity-95" />
          <div className="absolute inset-0" style={{ background: 'rgba(5,18,55,0.65)' }} />
        </div>
        <div className="max-w-xl mx-auto text-center relative">
          <Plane className="w-10 h-10 text-[#5ab8f5] mx-auto mb-5" />
          <h2 className="text-4xl font-bold text-white mb-4">Practice. Understand. Pass.</h2>
          <p className="text-white/85 text-lg mb-3">Start your free trial. No credit card. No commitment.</p>
          <p className="text-white/70 text-base mb-8">10 free questions. See how practice + AI understanding beats memorization alone.</p>
          <Link href="/signup" className="btn-gold text-lg px-10 py-4 rounded-xl inline-flex items-center gap-2">
            Start Practicing Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-white/60 text-sm">First 10 questions free. Upgrade anytime. Cancel anytime.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6" style={{ background: '#ffffff', borderTop: '1px solid rgba(10,36,99,0.08)' }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="TARMAC" width={32} height={32} />
            <span className="font-bold text-[#0A2463] text-sm">TARMAC</span>
            <span className="text-[#0A2463]/45 text-xs ml-2">© 2025</span>
          </div>
          <div className="flex items-center gap-6 text-[#0A2463]/60 text-sm">
            <a href="#method" className="hover:text-[#0A2463]/70 transition-colors">The Method</a>
            <a href="#pricing" className="hover:text-[#0A2463]/70 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[#0A2463]/70 transition-colors">FAQ</a>
            <a href="mailto:support@tarmac.app" className="hover:text-[#0A2463]/70 transition-colors">Support</a>
          </div>
          <p className="text-[#0A2463]/45 text-xs">Not affiliated with the FAA. Study responsibly.</p>
        </div>
      </footer>
    </div>
  )
}
