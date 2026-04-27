'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, CheckCircle, ArrowLeft, Plane } from 'lucide-react'
import type { OnboardingData } from '@/types'

// ─── Quiz data ────────────────────────────────────────────────────────────────

type Step =
  | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7'
  | 'recommendation'
  | 'signup'

interface Option {
  value: string
  label: string
  sub?: string
}

interface Question {
  id: Step
  text: string
  sub?: string
  options: Option[]
  skippable?: boolean
  feedbacks: Record<string, string>
}

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'Where are you in your pilot training?',
    options: [
      { value: 'not_started',          label: "Haven't started flight training yet",    sub: 'Studying for the written first' },
      { value: 'in_training',          label: 'Currently in flight school',              sub: 'Taking lessons, need to pass written soon' },
      { value: 'checkride_scheduled',  label: 'Checkride is scheduled',                  sub: 'Written test is the last thing I need' },
      { value: 'retaking',             label: 'Retaking the written',                    sub: "Failed once — need to pass this time" },
    ],
    feedbacks: {
      not_started:         "Perfect time to start. Building a strong foundation now makes everything easier.",
      in_training:         "You're in the thick of it — let's make sure the written doesn't slow you down.",
      checkride_scheduled: "Tight timeline. We'll get you focused on exactly what matters most.",
      retaking:            "You're not alone — and this time you'll understand it, not just memorize it.",
    },
  },
  {
    id: 'q2',
    text: 'When are you planning to take your FAA written test?',
    options: [
      { value: '2_weeks',    label: 'In the next 2 weeks',    sub: 'I need to cram fast' },
      { value: '3_6_weeks',  label: 'In 3–6 weeks',           sub: 'I have time to prepare properly' },
      { value: '2_3_months', label: 'In 2–3 months',          sub: "I'm studying well in advance" },
      { value: 'not_sure',   label: 'Not sure yet',           sub: 'Just starting to research' },
    ],
    feedbacks: {
      '2_weeks':    'Two weeks is tight but doable. Students who focus on weak areas in this window consistently pass.',
      '3_6_weeks':  "That's the sweet spot. Our most successful students study for 3–6 weeks.",
      '2_3_months': "You're thinking ahead — that kind of prep pays off on test day.",
      'not_sure':   "No rush. Start your 7-day free trial and see how it feels.",
    },
  },
  {
    id: 'q3',
    text: 'How confident are you about passing the FAA written test?',
    options: [
      { value: 'nervous',            label: "Not confident at all",      sub: "I don't feel ready" },
      { value: 'unsure',             label: "Unsure",                    sub: 'I know some stuff, but not enough' },
      { value: 'somewhat_confident', label: 'Somewhat confident',        sub: 'Just need more practice' },
      { value: 'very_confident',     label: 'Very confident',            sub: 'Just want to sharpen up' },
    ],
    feedbacks: {
      nervous:            "Totally normal. 64% of students feel this way at first. That's exactly what we fix.",
      unsure:             "Knowing you need more is half the battle. We'll fill in the gaps systematically.",
      somewhat_confident: "Good foundation. We'll help you lock it in and validate with practice exams.",
      very_confident:     "Let's prove it. Full-length practice exams will confirm you're ready.",
    },
  },
  {
    id: 'q4',
    text: "What's your biggest worry about the written test?",
    options: [
      { value: 'retake_cost',        label: 'Wasting $175 on a retake if I fail' },
      { value: 'not_understanding',  label: 'Not understanding the material (just memorizing)' },
      { value: 'no_time',            label: 'Running out of time to study' },
      { value: 'what_to_focus',      label: 'Not knowing what to focus on' },
      { value: 'test_anxiety',       label: 'Test anxiety / pressure' },
    ],
    feedbacks: {
      retake_cost:       "Your trial is free. A retake is $175. This is the math that pays for itself.",
      not_understanding: "That's exactly why we built TARMAC. Every question has an AI tutor that explains the WHY.",
      no_time:           "200 focused questions in 2 weeks is enough. We'll show you exactly where to spend your time.",
      what_to_focus:     "We track your accuracy by category and tell you exactly what to drill. No guessing.",
      test_anxiety:      "Confidence comes from repetition. Take the exam 5 times here before the real one.",
    },
  },
  {
    id: 'q5',
    text: 'Have you used other FAA test prep tools before?',
    options: [
      { value: 'first_time',       label: 'No, this is my first time studying' },
      { value: 'didnt_like',       label: "Yes, but I didn't like them",         sub: 'Too much memorization, not enough explanation' },
      { value: 'failed_with_them', label: 'Yes, and I failed with them',         sub: "That's why I'm here" },
      { value: 'exploring',        label: 'Yes, and they were fine',             sub: 'Just exploring other options' },
    ],
    feedbacks: {
      first_time:       "You're starting fresh — we'll guide you step by step.",
      didnt_like:       "That's exactly the gap TARMAC fills. Ask follow-up questions until it actually clicks.",
      failed_with_them: "Those tools teach memorization. We teach understanding. There's a real difference.",
      exploring:        "Fair. Start your free trial and compare the explanations yourself.",
    },
  },
  {
    id: 'q6',
    text: "What's your learning style?",
    skippable: true,
    options: [
      { value: 'detailed_explanations', label: 'I need detailed explanations' },
      { value: 'learning_by_doing',     label: 'I learn by doing (just give me questions)' },
      { value: 'need_structure',        label: 'I need structure (tell me exactly what to do)' },
      { value: 'mixed',                 label: 'Not sure / Mix of everything' },
    ],
    feedbacks: {
      detailed_explanations: "Our AI tutor gives you as much depth as you need on every single question.",
      learning_by_doing:     "Jump straight into practice mode — questions, instant feedback, repeat.",
      need_structure:        "Your dashboard will show exactly what to tackle next, sorted by impact.",
      mixed:                 "Most people are. We adapt to however you want to study.",
      skipped:               '',
    },
  },
  {
    id: 'q7',
    text: 'Last one — how did you hear about Tarmac?',
    skippable: true,
    options: [
      { value: 'instagram', label: 'Instagram' },
      { value: 'tiktok',    label: 'TikTok' },
      { value: 'youtube',   label: 'YouTube' },
      { value: 'google',    label: 'Google / Search' },
      { value: 'reddit',    label: 'Reddit' },
      { value: 'friend',    label: 'Friend or classmate' },
      { value: 'cfi',       label: 'My flight instructor (CFI)' },
      { value: 'other',     label: 'Somewhere else' },
    ],
    feedbacks: {
      instagram: "Welcome! Glad the feed led you here.",
      tiktok:    "TikTok → Tarmac. The pilot pipeline.",
      youtube:   "Good taste in content.",
      google:    "You searched, you found.",
      reddit:    "The aviation subreddit delivers again.",
      friend:    "Tell them we said thanks.",
      cfi:       "Your CFI has good judgment.",
      other:     "However you got here — glad you did.",
      skipped:   '',
    },
  },
]

// ─── Option icons ─────────────────────────────────────────────────────────────

const OPTION_ICONS: Record<string, string> = {
  not_started: '✈️', in_training: '🎓', checkride_scheduled: '📅', retaking: '🔄',
  '2_weeks': '⚡', '3_6_weeks': '📅', '2_3_months': '🗓️', not_sure: '🤷',
  nervous: '😰', unsure: '😐', somewhat_confident: '😊', very_confident: '😎',
  retake_cost: '💸', not_understanding: '📚', no_time: '⏱️', what_to_focus: '🎯', test_anxiety: '😬',
  first_time: '❌', didnt_like: '📖', failed_with_them: '🔄', exploring: '✅',
  detailed_explanations: '📖', learning_by_doing: '⚡', need_structure: '🎯', mixed: '🤷',
  instagram: '📸', tiktok: '🎵', youtube: '▶️', google: '🔍', reddit: '🤖',
  friend: '🤝', cfi: '🧑‍✈️', other: '🌐',
}

// ─── Recommendation logic ─────────────────────────────────────────────────────

type PlanId = 'beta_monthly'

interface Recommendation {
  planId: PlanId
  name: string
  price: string
  reasons: string[]
  cta: string
}

function getRecommendation(answers: Partial<OnboardingData>): Recommendation {
  const { test_timeline, confidence_level, biggest_worry, previous_tools } = answers
  const reasons: string[] = []

  if (test_timeline === '2_weeks') {
    reasons.push('7 days free gives you a head start — start now, cancel anytime if you pass early')
  } else if (test_timeline === '2_3_months') {
    reasons.push("You've got time to build deep understanding — not just memorize answers")
  } else {
    reasons.push('Your timeline is perfect — 200 focused questions in 3–6 weeks is all it takes')
  }

  if (confidence_level === 'nervous' || confidence_level === 'unsure') {
    reasons.push('AI tutor on every question gives you the explanations you need to build real confidence')
  } else if (confidence_level === 'very_confident') {
    reasons.push('Full-length timed practice exams will validate your knowledge before test day')
  }

  if (biggest_worry === 'retake_cost') {
    reasons.push('A retake costs $175. Your first month is free — the math is obvious')
  } else if (biggest_worry === 'not_understanding') {
    reasons.push('Every question has an AI tutor that explains the why, not just the answer')
  } else if (biggest_worry === 'what_to_focus') {
    reasons.push('Your dashboard tracks accuracy by category and shows exactly where to focus')
  }

  if (previous_tools === 'failed_with_them') {
    reasons.push("TARMAC builds genuine understanding — students who switch pass at a 91% rate")
  }

  return {
    planId: 'beta_monthly',
    name: 'Full Access',
    price: '$14.99/mo',
    reasons: reasons.slice(0, 3),
    cta: 'Start Free Trial',
  }
}

// ─── Animation variants ───────────────────────────────────────────────────────

const pageVariants: Variants = {
  hidden:  { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 28, stiffness: 260 } },
  exit:    { opacity: 0, y: -16, scale: 0.98, transition: { duration: 0.2 } },
}

const containerVariants: Variants = {
  visible: { transition: { staggerChildren: 0.06 } },
}

const optionVariants: Variants = {
  hidden:  { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', damping: 26, stiffness: 300 } },
}

const feedbackVariants: Variants = {
  hidden:  { opacity: 0, y: 16, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 260, delay: 0.1 } },
  exit:    { opacity: 0, y: 8, transition: { duration: 0.15 } },
}

// ─── Component ────────────────────────────────────────────────────────────────

function StartPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlPlan = searchParams.get('plan')

  const [step, setStep] = useState<Step>('q1')
  const [answers, setAnswers] = useState<Partial<OnboardingData>>({})
  const [selectedValue, setSelectedValue] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState<string | null>(null)
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)

  // Signup form state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [marketingEmails, setMarketingEmails] = useState(true)
  const [loading, setLoading] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)

  useEffect(() => {
    if (urlPlan) { localStorage.removeItem('tarmac_quiz'); return }
    try {
      const saved = localStorage.getItem('tarmac_quiz')
      if (saved) {
        const { step: s, answers: a } = JSON.parse(saved)
        if (s && a && s.startsWith('q')) { setStep(s); setAnswers(a) }
        else { localStorage.removeItem('tarmac_quiz') }
      }
    } catch { /* ignore */ }
  }, [urlPlan])

  useEffect(() => {
    try { localStorage.setItem('tarmac_quiz', JSON.stringify({ step, answers })) } catch { /* ignore */ }
  }, [step, answers])

  const STEP_ORDER: Step[] = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'recommendation', 'signup']
  const questionSteps = STEP_ORDER.filter(s => s.startsWith('q')) as Step[]
  const currentQuestionIndex = questionSteps.indexOf(step)
  const totalQuestions = questionSteps.length
  const currentQuestion = QUESTIONS.find(q => q.id === step)

  function selectOption(value: string) {
    if (selectedValue) return
    setSelectedValue(value)
    const fieldMap: Record<string, keyof OnboardingData> = {
      q1: 'training_stage', q2: 'test_timeline', q3: 'confidence_level',
      q4: 'biggest_worry', q5: 'previous_tools', q6: 'learning_style', q7: 'referral_source',
    }
    const field = fieldMap[step]
    const newAnswers = { ...answers, [field]: value as never }
    setAnswers(newAnswers)
    const feedback = currentQuestion?.feedbacks[value]
    if (feedback) setFeedbackText(feedback)
    setTimeout(() => advance(step, newAnswers), 1400)
  }

  function skipQuestion() {
    const fieldMap: Record<string, keyof OnboardingData> = { q6: 'learning_style', q7: 'referral_source' }
    const field = fieldMap[step]
    const newAnswers = field ? { ...answers, [field]: 'skipped' as never } : { ...answers }
    setAnswers(newAnswers)
    advance(step, newAnswers)
  }

  function advance(currentStep: Step, currentAnswers: Partial<OnboardingData>) {
    setSelectedValue(null)
    setFeedbackText(null)
    const idx = STEP_ORDER.indexOf(currentStep)
    const next = STEP_ORDER[idx + 1] as Step
    if (next === 'recommendation') setRecommendation(getRecommendation(currentAnswers))
    setStep(next)
  }

  function goBack() {
    setSelectedValue(null)
    setFeedbackText(null)
    const idx = STEP_ORDER.indexOf(step)
    if (idx > 0) setStep(STEP_ORDER[idx - 1] as Step)
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSignupError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, marketing_emails: marketingEmails } },
    })
    if (error) { setSignupError(error.message); setLoading(false); return }
    if (data.user) {
      const finalAnswers = { ...answers, recommended_plan: recommendation?.planId }
      await supabase.from('users').update({ onboarding_data: finalAnswers }).eq('id', data.user.id)
      if (!marketingEmails) {
        await supabase.from('users').update({ marketing_emails: false }).eq('id', data.user.id)
      }
      fetch('/api/email/welcome', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id, email: data.user.email, firstName: fullName.split(' ')[0] }),
      }).catch(() => {})
    }
    try { localStorage.removeItem('tarmac_quiz') } catch { /* ignore */ }
    if (data.session) {
      router.push('/upgrade')
    } else {
      setSignupSuccess(true)
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #040c1e 0%, #071430 50%, #0a1940 100%)' }}>

      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute" style={{
          top: '-20%', left: '-10%', width: '60%', height: '60%',
          background: 'radial-gradient(circle, rgba(62,146,204,0.08) 0%, transparent 70%)',
          animation: 'floatOrb1 18s ease-in-out infinite',
        }} />
        <div className="absolute" style={{
          bottom: '-10%', right: '-10%', width: '50%', height: '50%',
          background: 'radial-gradient(circle, rgba(255,182,39,0.06) 0%, transparent 70%)',
          animation: 'floatOrb2 22s ease-in-out infinite',
        }} />
        <div className="absolute" style={{
          top: '40%', right: '20%', width: '30%', height: '30%',
          background: 'radial-gradient(circle, rgba(62,146,204,0.05) 0%, transparent 70%)',
          animation: 'floatOrb3 14s ease-in-out infinite',
        }} />
      </div>

      <style>{`
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(3%, 4%) scale(1.05); }
          66% { transform: translate(-2%, 2%) scale(0.97); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-3%, -3%) scale(1.08); }
          70% { transform: translate(2%, -1%) scale(0.95); }
        }
        @keyframes floatOrb3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-4%, 3%); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 py-4 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image src="/logo-white.png" alt="TARMAC" width={30} height={30} className="group-hover:scale-105 transition-transform" />
          <span className="text-sm font-bold text-white tracking-tight">TARMAC</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(255,182,39,0.15)', color: '#FFB627', border: '1px solid rgba(255,182,39,0.3)' }}>
            BETA
          </span>
        </Link>

        {/* Step dots progress */}
        {step !== 'signup' && (
          <div className="flex items-center gap-1.5">
            {questionSteps.map((s, i) => {
              const done = currentQuestionIndex > i || step === 'recommendation'
              const active = currentQuestionIndex === i
              return (
                <motion.div
                  key={s}
                  animate={{
                    width: active ? 20 : 6,
                    background: done ? '#FFB627' : active ? '#FFB627' : 'rgba(255,255,255,0.15)',
                    opacity: done ? 0.6 : 1,
                  }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  style={{ height: 6, borderRadius: 99 }}
                />
              )
            })}
          </div>
        )}

        <Link href="/login" className="text-xs text-white/35 hover:text-white/70 transition-colors">
          Sign in
        </Link>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">

            {/* ── Quiz questions ──────────────────────────────────────── */}
            {currentQuestion && (
              <motion.div key={step} variants={pageVariants} initial="hidden" animate="visible" exit="exit">

                {/* Header */}
                <div className="mb-7">
                  {currentQuestionIndex > 0 && (
                    <button
                      onClick={goBack}
                      className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-4 group"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                      Back
                    </button>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(255,182,39,0.1)', color: '#FFB627', border: '1px solid rgba(255,182,39,0.2)' }}>
                      Step {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                    {currentQuestion.skippable && (
                      <span className="text-[10px] text-white/30">Optional</span>
                    )}
                  </div>

                  <h1 className="text-2xl md:text-[1.75rem] font-bold text-white leading-tight tracking-tight">
                    {currentQuestion.text}
                  </h1>
                </div>

                {/* Options */}
                <motion.div
                  className="space-y-2.5"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {currentQuestion.options.map(opt => {
                    const isSelected = selectedValue === opt.value
                    const isOther = selectedValue !== null && !isSelected
                    return (
                      <motion.button
                        key={opt.value}
                        variants={optionVariants}
                        onClick={() => selectOption(opt.value)}
                        disabled={!!selectedValue}
                        whileHover={!selectedValue ? { y: -2, scale: 1.005 } : {}}
                        whileTap={!selectedValue ? { scale: 0.99 } : {}}
                        animate={{
                          opacity: isOther ? 0.45 : 1,
                          scale: isSelected ? 1.01 : 1,
                        }}
                        className="w-full text-left rounded-2xl px-5 py-4 transition-colors disabled:cursor-default relative overflow-hidden"
                        style={{
                          background: isSelected
                            ? 'rgba(255,182,39,0.1)'
                            : 'rgba(255,255,255,0.04)',
                          border: isSelected
                            ? '1.5px solid rgba(255,182,39,0.5)'
                            : '1px solid rgba(255,255,255,0.08)',
                          boxShadow: isSelected
                            ? '0 0 0 3px rgba(255,182,39,0.08), 0 8px 24px rgba(255,182,39,0.12)'
                            : undefined,
                        }}
                      >
                        {/* Shimmer on select */}
                        {isSelected && (
                          <motion.div
                            className="absolute inset-0 pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.15, 0] }}
                            transition={{ duration: 0.6 }}
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,182,39,0.3), transparent)' }}
                          />
                        )}

                        <div className="flex items-center gap-3.5">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base transition-all"
                            style={{
                              background: isSelected ? 'rgba(255,182,39,0.15)' : 'rgba(255,255,255,0.06)',
                              border: isSelected ? '1px solid rgba(255,182,39,0.3)' : '1px solid rgba(255,255,255,0.06)',
                            }}
                          >
                            {OPTION_ICONS[opt.value] || '•'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white leading-snug">{opt.label}</div>
                            {opt.sub && (
                              <div className="text-xs mt-0.5 text-white/40">{opt.sub}</div>
                            )}
                          </div>
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', damping: 15, stiffness: 400 }}
                              >
                                <CheckCircle className="w-4 h-4 text-[#FFB627] shrink-0" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.button>
                    )
                  })}
                </motion.div>

                {/* Skip */}
                {currentQuestion.skippable && !selectedValue && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={skipQuestion}
                    className="mt-4 w-full text-center text-xs text-white/25 hover:text-white/50 transition-colors py-2.5"
                  >
                    Skip this question →
                  </motion.button>
                )}

                {/* Feedback */}
                <AnimatePresence>
                  {feedbackText && (
                    <motion.div
                      variants={feedbackVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="mt-4 flex items-start gap-3 px-4 py-3.5 rounded-2xl"
                      style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: 'rgba(16,185,129,0.15)' }}>
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      <p className="text-sm text-green-300/80 leading-relaxed">{feedbackText}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Social proof */}
                <motion.p
                  className="text-center text-[11px] text-white/18 mt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{ color: 'rgba(255,255,255,0.18)' }}
                >
                  ✈️ &nbsp;2,847 students completed this quiz this week
                </motion.p>
              </motion.div>
            )}

            {/* ── Recommendation ──────────────────────────────────────── */}
            {step === 'recommendation' && recommendation && (
              <motion.div key="recommendation" variants={pageVariants} initial="hidden" animate="visible" exit="exit">

                {/* Success header */}
                <div className="text-center mb-7">
                  <motion.div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 260, delay: 0.1 }}
                    style={{ background: 'rgba(16,185,129,0.12)', border: '1.5px solid rgba(16,185,129,0.3)' }}
                  >
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </motion.div>
                  <motion.h1
                    className="text-2xl font-bold text-white mb-1"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Analysis complete ✈️
                  </motion.h1>
                  <motion.p
                    className="text-sm text-white/45"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Based on your answers, here&apos;s what we recommend
                  </motion.p>
                </div>

                {/* Stats row */}
                <motion.div
                  className="grid grid-cols-3 gap-2 mb-4"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, type: 'spring', damping: 24 }}
                >
                  {[
                    { stat: '91%', label: 'first-attempt pass rate' },
                    { stat: '1,400+', label: 'practice questions' },
                    { stat: '~3 wks', label: 'avg time to ready' },
                  ].map(s => (
                    <div key={s.stat}
                      className="rounded-xl py-3.5 text-center"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="text-lg font-bold text-white">{s.stat}</div>
                      <div className="text-[10px] text-white/35 mt-0.5 leading-tight">{s.label}</div>
                    </div>
                  ))}
                </motion.div>

                {/* Plan card */}
                <motion.div
                  className="rounded-2xl p-5 mb-4"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, type: 'spring', damping: 24 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,182,39,0.1) 0%, rgba(255,182,39,0.04) 100%)',
                    border: '1.5px solid rgba(255,182,39,0.3)',
                    boxShadow: '0 8px 32px rgba(255,182,39,0.08)',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFB627]">Recommended</span>
                    <span className="text-xs font-bold text-green-400 px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      7 days free
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-bold text-white">{recommendation.name}</span>
                    <span className="text-[#FFB627] font-bold">{recommendation.price}</span>
                    <span className="text-white/30 text-xs">after trial</span>
                  </div>
                  <div className="space-y-2.5">
                    {recommendation.reasons.map((r, i) => (
                      <motion.div
                        key={r}
                        className="flex items-start gap-2.5"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.08 }}
                      >
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: 'rgba(34,197,94,0.15)' }}>
                          <CheckCircle className="w-2.5 h-2.5 text-green-400" />
                        </div>
                        <span className="text-sm text-white/70 leading-snug">{r}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  <motion.button
                    onClick={() => setStep('signup')}
                    whileHover={{ scale: 1.02, boxShadow: '0 8px 28px rgba(255,182,39,0.35)' }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-2xl text-sm font-bold mb-3 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #FFB627, #f5a300)', color: '#080E1C', boxShadow: '0 4px 20px rgba(255,182,39,0.25)' }}
                  >
                    <Plane className="w-4 h-4" />
                    Start My Free Trial
                  </motion.button>
                  <p className="text-center text-xs text-white/30">
                    Cancel before 7 days and you won&apos;t be charged
                  </p>
                </motion.div>
              </motion.div>
            )}

            {/* ── Signup form ─────────────────────────────────────────── */}
            {step === 'signup' && (
              <motion.div key="signup" variants={pageVariants} initial="hidden" animate="visible" exit="exit">
                {signupSuccess ? (
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 14, stiffness: 260 }}
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                      style={{ background: 'rgba(34,197,94,0.12)', border: '1.5px solid rgba(34,197,94,0.3)' }}
                    >
                      <span className="text-4xl">✉️</span>
                    </motion.div>
                    <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
                    <p className="text-white/50 text-sm mb-5">
                      We sent a confirmation link to <strong className="text-white">{email}</strong>.
                    </p>
                    <Link href="/login" className="text-[#FFB627] text-sm font-semibold hover:opacity-80 transition-opacity">
                      Back to login →
                    </Link>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={goBack}
                      className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-5 group"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                      Back
                    </button>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-2 mb-5">
                      <div className="flex items-center gap-1">
                        {['Profile', 'Plan', 'Account'].map((label, i) => (
                          <div key={label} className="flex items-center">
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                                style={{
                                  background: i < 2 ? '#FFB627' : 'rgba(255,182,39,0.2)',
                                  color: i < 2 ? '#080E1C' : '#FFB627',
                                  border: i === 2 ? '1.5px solid rgba(255,182,39,0.4)' : 'none',
                                }}
                              >
                                {i < 2 ? '✓' : '3'}
                              </div>
                              <span className="text-[10px] font-medium" style={{ color: i === 2 ? 'rgba(255,182,39,0.9)' : 'rgba(255,255,255,0.3)' }}>{label}</span>
                            </div>
                            {i < 2 && <div className="w-5 h-px mx-1.5" style={{ background: 'rgba(255,182,39,0.3)' }} />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-5">
                      <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
                      <p className="text-sm text-white/45">You&apos;re almost there — create an account to start your 7-day free trial.</p>
                    </div>

                    <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1.5">Full Name</label>
                          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Smith" required autoComplete="name" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1.5">Email</label>
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1.5">Password</label>
                          <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" required minLength={8} autoComplete="new-password" style={{ paddingRight: '48px' }} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-3 pt-1">
                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} required style={{ marginTop: '2px', width: '15px', height: '15px', accentColor: '#FFB627', flexShrink: 0 }} />
                            <span className="text-xs text-white/45 leading-relaxed">
                              I agree to the{' '}
                              <Link href="/terms" target="_blank" className="text-[#FFB627] underline">Terms</Link>
                              {' '}and{' '}
                              <Link href="/privacy" target="_blank" className="text-[#FFB627] underline">Privacy Policy</Link>.
                              {' '}All sales final.
                            </span>
                          </label>
                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <input type="checkbox" checked={marketingEmails} onChange={e => setMarketingEmails(e.target.checked)} style={{ marginTop: '2px', width: '15px', height: '15px', accentColor: '#FFB627', flexShrink: 0 }} />
                            <span className="text-xs text-white/45 leading-relaxed">Send me weekly progress updates. Unsubscribe anytime.</span>
                          </label>
                        </div>

                        {signupError && (
                          <div className="px-4 py-3 rounded-xl text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            {signupError}
                          </div>
                        )}

                        <motion.button
                          type="submit"
                          disabled={loading || !agreedToTerms}
                          whileHover={!loading && agreedToTerms ? { scale: 1.01 } : {}}
                          whileTap={!loading && agreedToTerms ? { scale: 0.99 } : {}}
                          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold disabled:opacity-40"
                          style={{ background: 'linear-gradient(135deg, #FFB627, #f5a300)', color: '#080E1C', boxShadow: '0 4px 16px rgba(255,182,39,0.2)' }}
                        >
                          {loading
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                            : <><Plane className="w-4 h-4" /> Create My Free Account</>}
                        </motion.button>
                      </form>
                    </div>

                    <p className="text-center mt-4 text-sm text-white/35">
                      Already have an account?{' '}
                      <Link href="/login" className="text-[#FFB627] hover:opacity-80 transition-opacity font-medium">Sign in</Link>
                    </p>
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default function StartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#040c1e' }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#FFB627]" />
      </div>
    }>
      <StartPageInner />
    </Suspense>
  )
}
