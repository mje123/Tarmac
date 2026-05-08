import Link from 'next/link'
import { BookOpen, Eye, Brain, ClipboardList, Bookmark, Layers, Bot, CheckCircle, Zap, Target, TrendingUp, Clock, Award, ListChecks } from 'lucide-react'

const weeks = [
  {
    number: 1,
    days: 'Days 1–7',
    theme: 'Get Your Bearings',
    color: '#3E92CC',
    bg: 'rgba(62,146,204,0.08)',
    border: 'rgba(62,146,204,0.2)',
    badgeBg: 'rgba(62,146,204,0.15)',
    dailyTime: '45 min/day',
    goal: 'See everything once before you try to master anything. No pressure on score — just build familiarity.',
    features: [
      { icon: Eye, label: 'Read-Through Mode', desc: 'Start here. Question and correct answer shown together. Run through All Topics and just absorb.' },
      { icon: Bookmark, label: 'Save as you go', desc: 'Anything that makes zero sense — save it immediately. You\'ll revisit it with fresh eyes.' },
      { icon: Bot, label: 'AI Tutor', desc: 'Hit a concept you can\'t picture at all? Ask the AI before moving on. Don\'t let confusion compound.' },
    ],
    focus: ['Regulations', 'Airspace', 'Weather Theory'],
    focusNote: 'These three categories make up nearly half the exam. Spend extra time here in Read-Through.',
    checkpoint: 'Checkpoint: You\'ve seen every question type at least once.',
  },
  {
    number: 2,
    days: 'Days 8–14',
    theme: 'Start Testing Yourself',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.2)',
    badgeBg: 'rgba(139,92,246,0.15)',
    dailyTime: '60 min/day',
    goal: 'Switch from reading to doing. Practice Mode forces you to commit to an answer — that\'s where real learning happens.',
    features: [
      { icon: BookOpen, label: 'Practice Mode', desc: 'Go category by category. Answer questions, get them wrong, understand why. The explanation is the lesson.' },
      { icon: Bookmark, label: 'Save everything you miss', desc: 'Wrong answer? Save it. Guessed right but not sure why? Save it. Build your personal study list.' },
      { icon: Bot, label: 'AI Tutor', desc: 'Still use it. Use it on every wrong answer until you truly get it — not just memorize it.' },
    ],
    focus: ['Aircraft Performance', 'Navigation', 'Weight & Balance'],
    focusNote: 'The calculation-heavy topics. Work through the formulas slowly — don\'t just save and skip.',
    checkpoint: 'Checkpoint: Hitting 55%+ in Practice Mode. Saving questions consistently.',
  },
  {
    number: 3,
    days: 'Days 15–21',
    theme: 'Add Pressure',
    color: '#FFB627',
    bg: 'rgba(255,182,39,0.07)',
    border: 'rgba(255,182,39,0.2)',
    badgeBg: 'rgba(255,182,39,0.12)',
    dailyTime: '60 min/day',
    goal: 'Quiz Mode adds time pressure. Your first Practice Exam shows you exactly where you stand.',
    features: [
      { icon: ListChecks, label: 'Quiz Mode', desc: 'Timed sessions. Simulates the mental load of the real exam. Do this before jumping to full exams.' },
      { icon: Brain, label: 'Daily Review', desc: 'Every morning. 10 minutes. The questions you\'ve missed come back on a schedule — that\'s how they stick.' },
      { icon: ClipboardList, label: 'First Practice Exam', desc: 'Take one full 60-question exam this week. Treat it like the real thing. The score will tell you where to focus.' },
      { icon: Layers, label: 'Flashcards', desc: 'Lock in the numbers: VOR limits, cloud clearances, weather minimums. Quick hits before bed.' },
    ],
    focus: ['Weak Areas', 'Saved Questions', 'Quiz Mode'],
    focusNote: 'Your saved questions list is your personal weak spot map. Work through it in Practice Mode this week.',
    checkpoint: 'Checkpoint: Practice Exam at 65%+. Daily Review is a daily habit.',
  },
  {
    number: 4,
    days: 'Days 22–30',
    theme: 'Exam Mode',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.07)',
    border: 'rgba(16,185,129,0.2)',
    badgeBg: 'rgba(16,185,129,0.12)',
    dailyTime: '45 min/day',
    goal: 'One full Practice Exam every day. Hit 80%+ three days in a row — then book the real thing.',
    features: [
      { icon: ClipboardList, label: 'Practice Exam', desc: 'Daily. Timed. No distractions. Replicate real test conditions every single session.' },
      { icon: Brain, label: 'Daily Review', desc: 'Non-negotiable. Even on your best days — especially on your best days.' },
      { icon: Bookmark, label: 'Saved Questions', desc: 'Final pass through your saved list. If you\'re still missing the same ones, drill them in Practice Mode.' },
    ],
    focus: ['Practice Exams', 'Daily Review', 'Saved Questions'],
    focusNote: 'If you\'re at 80%+ consistently for three days — stop studying and schedule the test. More studying won\'t help at that point.',
    checkpoint: 'Checkpoint: Three consecutive exams at 80%+. You\'re ready.',
  },
]

const tips = [
  { icon: Clock, text: 'You need 70% to pass. Aim for 80%+ in practice so you have a comfortable buffer on test day.' },
  { icon: Zap, text: 'The FAA written pulls from a known question bank. Pattern recognition is real — repetition pays off.' },
  { icon: Target, text: 'Save any question you\'re unsure about, even if you got it right. Certainty matters more than luck.' },
  { icon: TrendingUp, text: 'Daily Review is the secret weapon. 10 minutes every morning compounds faster than you\'d think.' },
  { icon: Award, text: 'Book your exam before Day 30. A real deadline makes the last week actually count.' },
]

export default function StudyPlanPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 tracking-wider uppercase"
          style={{ background: 'rgba(255,182,39,0.12)', color: '#FFB627', border: '1px solid rgba(255,182,39,0.25)' }}>
          Study Plan
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3">
          The 30-Day<br />
          <span style={{ color: '#FFB627' }}>Runway</span>
        </h1>
        <p className="text-white/55 text-lg leading-relaxed max-w-xl">
          A clear sequence to pass your FAA written with a score you're proud of.
          Right tools, right order, no wasted time.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        {[
          { label: 'Exam questions', value: '60' },
          { label: 'Passing score', value: '70%' },
          { label: 'Target score', value: '80%+' },
        ].map(({ label, value }) => (
          <div key={label} className="glass-card p-4 text-center">
            <div className="text-2xl font-extrabold text-white mb-0.5">{value}</div>
            <div className="text-white/40 text-xs">{label}</div>
          </div>
        ))}
      </div>

      {/* Feature progression banner */}
      <div className="mb-10 p-4 rounded-2xl overflow-x-auto" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-white/35 text-xs font-semibold uppercase tracking-wider mb-3">The sequence</p>
        <div className="flex items-center gap-2 min-w-max">
          {[
            { icon: Eye, label: 'Read-Through', color: '#3E92CC' },
            { icon: BookOpen, label: 'Practice', color: '#8B5CF6' },
            { icon: ListChecks, label: 'Quiz', color: '#FFB627' },
            { icon: ClipboardList, label: 'Exam', color: '#10B981' },
          ].map(({ icon: Icon, label, color }, i, arr) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-xs font-semibold" style={{ color }}>{label}</span>
              </div>
              {i < arr.length - 1 && <span className="text-white/20 text-sm">→</span>}
            </div>
          ))}
          <span className="text-white/20 text-sm ml-1">+</span>
          <div className="flex items-center gap-2 ml-1">
            {[
              { icon: Bookmark, label: 'Save', color: '#FFB627' },
              { icon: Brain, label: 'Review', color: '#FFB627' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl"
                style={{ background: 'rgba(255,182,39,0.08)', border: '1px solid rgba(255,182,39,0.2)' }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-xs font-semibold" style={{ color }}>{label}</span>
              </div>
            ))}
          </div>
          <span className="text-white/25 text-xs ml-1">always</span>
        </div>
      </div>

      {/* Weeks */}
      <div className="space-y-6 mb-10">
        {weeks.map((week) => (
          <div
            key={week.number}
            className="rounded-2xl overflow-hidden"
            style={{ background: week.bg, border: `1px solid ${week.border}` }}
          >
            {/* Week header */}
            <div className="px-5 pt-5 pb-4 flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-extrabold shrink-0"
                style={{ background: week.badgeBg, color: week.color }}
              >
                {week.number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-xs font-semibold" style={{ color: week.color }}>{week.days}</span>
                  <span className="text-white/20 text-xs">·</span>
                  <span className="text-white/40 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />{week.dailyTime}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white">{week.theme}</h2>
                <p className="text-white/55 text-sm mt-1 leading-relaxed">{week.goal}</p>
              </div>
            </div>

            {/* Features */}
            <div className="px-5 pb-4 space-y-2">
              {week.features.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: week.badgeBg }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: week.color }} />
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{label}</div>
                    <div className="text-white/45 text-xs mt-0.5 leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Focus areas */}
            <div className="px-5 pb-4">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {week.focus.map(f => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: week.badgeBg, color: week.color }}>
                    {f}
                  </span>
                ))}
              </div>
              <p className="text-white/30 text-xs">{week.focusNote}</p>
            </div>

            {/* Checkpoint */}
            <div className="mx-5 mb-5 flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${week.border}` }}>
              <CheckCircle className="w-4 h-4 shrink-0" style={{ color: week.color }} />
              <span className="text-xs font-medium" style={{ color: week.color }}>{week.checkpoint}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="mb-10">
        <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Things worth knowing</h2>
        <div className="space-y-3">
          {tips.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(255,182,39,0.1)', border: '1px solid rgba(255,182,39,0.2)' }}>
                <Icon className="w-3.5 h-3.5 text-[#FFB627]" />
              </div>
              <p className="text-white/60 text-sm leading-relaxed pt-1">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="glass-card p-6 text-center"
        style={{ background: 'linear-gradient(135deg, rgba(255,182,39,0.08), rgba(255,182,39,0.03))', borderColor: 'rgba(255,182,39,0.2)' }}>
        <p className="text-white font-bold text-lg mb-1">Day 1 starts now.</p>
        <p className="text-white/45 text-sm mb-5">Open Read-Through mode, pick All Topics, and just start moving through questions.</p>
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463', boxShadow: '0 4px 20px rgba(255,182,39,0.3)' }}
        >
          <Eye className="w-4 h-4" />
          Start Read-Through Mode
        </Link>
      </div>
    </div>
  )
}
