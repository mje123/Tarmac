'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import type { OnboardingData } from '@/types'

// ─── Quiz data ────────────────────────────────────────────────────────────────

type Step =
  | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6'
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
  options: Option[]
  skippable?: boolean
  feedbacks: Record<string, string>
}

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'Where are you in your pilot training?',
    options: [
      { value: 'not_started',          label: "✈️  Haven't started flight training yet",    sub: 'Studying for the written first' },
      { value: 'in_training',          label: '🎓  Currently in flight school',              sub: 'Taking lessons, need to pass written soon' },
      { value: 'checkride_scheduled',  label: '📅  Checkride is scheduled',                  sub: 'Written test is the last thing I need' },
      { value: 'retaking',             label: '🔄  Retaking the written',                    sub: "Failed once — need to pass this time" },
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
      { value: '2_weeks',    label: '⚡  In the next 2 weeks',    sub: 'I need to cram fast' },
      { value: '3_6_weeks',  label: '📅  In 3–6 weeks',           sub: 'I have time to prepare properly' },
      { value: '2_3_months', label: '🗓️  In 2–3 months',          sub: "I'm studying well in advance" },
      { value: 'not_sure',   label: '🤷  Not sure yet',           sub: 'Just starting to research' },
    ],
    feedbacks: {
      '2_weeks':    'Two weeks is tight but doable. Students who focus on weak areas in this window consistently pass.',
      '3_6_weeks':  "That's the sweet spot. Our most successful students study for 3–6 weeks.",
      '2_3_months': "You're thinking ahead — that kind of prep pays off on test day.",
      'not_sure':   "No rush. Start with free questions and see how it feels.",
    },
  },
  {
    id: 'q3',
    text: 'How confident are you about passing the FAA written test?',
    options: [
      { value: 'nervous',            label: "😰  Nervous — I don't feel ready at all" },
      { value: 'unsure',             label: "😐  Unsure — I know some stuff, but not enough" },
      { value: 'somewhat_confident', label: '😊  Somewhat confident — just need more practice' },
      { value: 'very_confident',     label: '😎  Very confident — just want to sharpen up' },
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
      { value: 'retake_cost',        label: '💸  Wasting $175 on a retake if I fail' },
      { value: 'not_understanding',  label: '📚  Not understanding the material (just memorizing)' },
      { value: 'no_time',            label: '⏱️  Running out of time to study' },
      { value: 'what_to_focus',      label: '🎯  Not knowing what to focus on' },
      { value: 'test_anxiety',       label: '😬  Test anxiety / pressure' },
    ],
    feedbacks: {
      retake_cost:       "Full access is $89. A retake is $175. This is the math that pays for itself.",
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
      { value: 'first_time',       label: '❌  No, this is my first time studying' },
      { value: 'didnt_like',       label: "📖  Yes, but I didn't like them",         sub: 'Too much memorization, not enough explanation' },
      { value: 'failed_with_them', label: '🔄  Yes, and I failed with them',         sub: "That's why I'm here" },
      { value: 'exploring',        label: '✅  Yes, and they were fine',             sub: 'Just exploring other options' },
    ],
    feedbacks: {
      first_time:       "You're starting fresh — we'll guide you step by step.",
      didnt_like:       "That's exactly the gap TARMAC fills. Ask follow-up questions until it actually clicks.",
      failed_with_them: "Those tools teach memorization. We teach understanding. There's a real difference.",
      exploring:        "Fair. Try the 10 free questions and compare the explanations yourself.",
    },
  },
  {
    id: 'q6',
    text: "What's your learning style?",
    skippable: true,
    options: [
      { value: 'detailed_explanations', label: '📖  I need detailed explanations' },
      { value: 'learning_by_doing',     label: '⚡  I learn by doing (just give me questions)' },
      { value: 'need_structure',        label: '🎯  I need structure (tell me exactly what to do)' },
      { value: 'mixed',                 label: '🤷  Not sure / Mix of everything' },
    ],
    feedbacks: {
      detailed_explanations: "Our AI tutor gives you as much depth as you need on every single question.",
      learning_by_doing:     "Jump straight into practice mode — questions, instant feedback, repeat.",
      need_structure:        "Your dashboard will show exactly what to tackle next, sorted by impact.",
      mixed:                 "Most people are. We adapt to however you want to study.",
      skipped:               '',
    },
  },
]

// ─── Recommendation logic ─────────────────────────────────────────────────────

type PlanId = 'quick_prep' | 'study_pass' | 'founding_member' | 'monthly'

interface Recommendation {
  planId: PlanId
  name: string
  price: string
  reasons: string[]
  cta: string
}

function getRecommendation(answers: Partial<OnboardingData>): Recommendation {
  const { test_timeline, confidence_level, biggest_worry, previous_tools } = answers

  let planId: PlanId = 'study_pass'
  const reasons: string[] = []

  if (test_timeline === '2_weeks') {
    planId = 'quick_prep'
    reasons.push('Your 2-week timeline fits the 60-day Quick Prep perfectly')
  } else if (test_timeline === '2_3_months') {
    planId = 'founding_member'
    reasons.push("You're planning ahead — lock in lifetime access before the price increases")
  } else {
    planId = 'study_pass'
    reasons.push('Your 3–6 week timeline is the sweet spot for the 90-day Study Pass')
  }

  if (confidence_level === 'nervous' || confidence_level === 'unsure') {
    reasons.push('AI tutor on every question gives you the explanations you need to build real confidence')
  } else if (confidence_level === 'very_confident') {
    reasons.push('Full-length practice exams will validate your knowledge before test day')
  }

  if (biggest_worry === 'retake_cost') {
    reasons.push('Full access costs less than half of a single FAA retake fee ($175)')
  } else if (biggest_worry === 'not_understanding') {
    reasons.push('Every question has an AI tutor that explains the why, not just the answer')
  } else if (biggest_worry === 'what_to_focus') {
    reasons.push('Your dashboard tracks accuracy by category and shows exactly where to focus')
  }

  if (previous_tools === 'failed_with_them') {
    reasons.push("Unlike question banks, TARMAC builds genuine understanding — students who switch pass at a 91% rate")
  }

  const PLANS: Record<PlanId, { name: string; price: string; cta: string }> = {
    quick_prep:      { name: 'Quick Prep',      price: '$69',  cta: 'Start Quick Prep' },
    study_pass:      { name: 'Study Pass',       price: '$89',  cta: 'Start Study Pass' },
    founding_member: { name: 'Founding Member',  price: '$199', cta: 'Get Lifetime Access' },
    monthly:         { name: 'Monthly',          price: '$44.99/mo', cta: 'Start Monthly' },
  }

  return { planId, ...PLANS[planId], reasons: reasons.slice(0, 3) }
}

// ─── Animation variants ───────────────────────────────────────────────────────

const slideVariants: Variants = {
  hidden:  { opacity: 0, x: 48 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35 } },
  exit:    { opacity: 0, x: -48, transition: { duration: 0.25 } },
}

const feedbackVariants: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.3 } },
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
  const [loading, setLoading] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)

  // Redirect already-logged-in users to dashboard
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/dashboard')
    })
  }, [router])

  // Restore from localStorage (skip if coming fresh from landing with plan)
  useEffect(() => {
    if (urlPlan) {
      localStorage.removeItem('tarmac_quiz')
      return
    }
    try {
      const saved = localStorage.getItem('tarmac_quiz')
      if (saved) {
        const { step: s, answers: a } = JSON.parse(saved)
        if (s && a) { setStep(s); setAnswers(a) }
      }
    } catch { /* ignore */ }
  }, [urlPlan])

  // Save progress
  useEffect(() => {
    try { localStorage.setItem('tarmac_quiz', JSON.stringify({ step, answers })) } catch { /* ignore */ }
  }, [step, answers])

  const STEP_ORDER: Step[] = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'recommendation', 'signup']
  const questionSteps = STEP_ORDER.filter(s => s.startsWith('q')) as Step[]
  const currentQuestionIndex = questionSteps.indexOf(step)
  const totalQuestions = questionSteps.length
  const progress = step === 'recommendation' || step === 'signup'
    ? 100
    : ((currentQuestionIndex + 1) / totalQuestions) * 100

  const currentQuestion = QUESTIONS.find(q => q.id === step)

  function selectOption(value: string) {
    if (selectedValue) return // already selected, waiting for auto-advance
    setSelectedValue(value)

    const key = step.replace('q', '') as keyof OnboardingData
    const fieldMap: Record<string, keyof OnboardingData> = {
      q1: 'training_stage', q2: 'test_timeline', q3: 'confidence_level',
      q4: 'biggest_worry', q5: 'previous_tools', q6: 'learning_style',
    }
    const field = fieldMap[step]
    const newAnswers = { ...answers, [field]: value as never }
    setAnswers(newAnswers)

    const feedback = currentQuestion?.feedbacks[value]
    if (feedback) setFeedbackText(feedback)

    setTimeout(() => advance(step, newAnswers), 1200)
  }

  function skipQuestion() {
    const newAnswers = { ...answers, learning_style: 'skipped' as const }
    setAnswers(newAnswers)
    advance(step, newAnswers)
  }

  function advance(currentStep: Step, currentAnswers: Partial<OnboardingData>) {
    setSelectedValue(null)
    setFeedbackText(null)

    const idx = STEP_ORDER.indexOf(currentStep)
    const next = STEP_ORDER[idx + 1] as Step

    if (next === 'recommendation') {
      setRecommendation(getRecommendation(currentAnswers))
    }
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
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error) { setSignupError(error.message); setLoading(false); return }

    // Store onboarding data
    if (data.user) {
      const finalAnswers = { ...answers, recommended_plan: recommendation?.planId }
      await supabase.from('users').update({ onboarding_data: finalAnswers }).eq('id', data.user.id)
    }

    try { localStorage.removeItem('tarmac_quiz') } catch { /* ignore */ }

    if (data.session) {
      const plan = recommendation?.planId
      router.push(plan && plan !== 'study_pass' ? `/upgrade?plan=${plan}` : '/dashboard')
    } else {
      setSignupSuccess(true)
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #060e1f 0%, #0d1a38 100%)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo-white.png" alt="TARMAC" width={28} height={28} />
          <span className="text-sm font-bold text-white tracking-tight">TARMAC</span>
        </Link>

        {/* Progress bar */}
        {step !== 'signup' && (
          <div className="flex-1 mx-8 max-w-xs">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: '#FDB022' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>
            {currentQuestionIndex >= 0 && (
              <div className="text-[10px] text-white/30 text-right mt-1">
                {currentQuestionIndex + 1} / {totalQuestions}
              </div>
            )}
          </div>
        )}

        <Link href="/login" className="text-xs text-white/40 hover:text-white transition-colors">
          Sign in
        </Link>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">

            {/* ── Quiz questions ─────────────────────────────────────── */}
            {currentQuestion && (
              <motion.div
                key={step}
                variants={slideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Back button */}
                {currentQuestionIndex > 0 && (
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/70 transition-colors mb-6"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                )}

                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-snug">
                  {currentQuestion.text}
                </h1>
                {currentQuestion.skippable && (
                  <p className="text-sm text-white/40 mb-6">Optional — helps us personalize your dashboard</p>
                )}
                {!currentQuestion.skippable && <div className="mb-6" />}

                <div className="space-y-3">
                  {currentQuestion.options.map(opt => {
                    const isSelected = selectedValue === opt.value
                    return (
                      <motion.button
                        key={opt.value}
                        onClick={() => selectOption(opt.value)}
                        disabled={!!selectedValue}
                        whileHover={!selectedValue ? { y: -2 } : {}}
                        className="w-full text-left rounded-xl px-5 py-4 transition-all disabled:cursor-default"
                        style={{
                          background: isSelected ? 'rgba(253,176,34,0.12)' : 'rgba(255,255,255,0.04)',
                          border: isSelected ? '1px solid rgba(253,176,34,0.5)' : '1px solid rgba(255,255,255,0.08)',
                          boxShadow: isSelected ? '0 4px 20px rgba(253,176,34,0.15)' : undefined,
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-white">{opt.label}</div>
                            {opt.sub && (
                              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{opt.sub}</div>
                            )}
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 text-[#FDB022] shrink-0 mt-0.5" />
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Skip */}
                {currentQuestion.skippable && !selectedValue && (
                  <button
                    onClick={skipQuestion}
                    className="mt-4 w-full text-center text-sm text-white/30 hover:text-white/60 transition-colors py-2"
                  >
                    Skip this question →
                  </button>
                )}

                {/* Micro-feedback */}
                <AnimatePresence>
                  {feedbackText && (
                    <motion.div
                      variants={feedbackVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="mt-5 flex items-start gap-2.5 px-4 py-3 rounded-xl"
                      style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
                    >
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-green-300/80">{feedbackText}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Social proof */}
                <p className="text-center text-[11px] text-white/20 mt-6">
                  🔥 2,847 students completed this quiz this week
                </p>
              </motion.div>
            )}

            {/* ── Recommendation screen ──────────────────────────────── */}
            {step === 'recommendation' && recommendation && (
              <motion.div
                key="recommendation"
                variants={slideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="text-center mb-6">
                  <div
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
                    style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
                  >
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-1">Analysis complete</h1>
                  <p className="text-sm text-white/50">Based on your answers, here&apos;s what we recommend</p>
                </div>

                {/* Profile summary */}
                <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2.5">Your Profile</div>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Training stage',  val: answers.training_stage?.replace('_', ' ') },
                      { label: 'Test timeline',    val: answers.test_timeline?.replace(/_/g, ' ') },
                      { label: 'Confidence',       val: answers.confidence_level?.replace('_', ' ') },
                      { label: 'Biggest concern',  val: answers.biggest_worry?.replace(/_/g, ' ') },
                    ].filter(r => r.val).map(row => (
                      <div key={row.label} className="flex items-center justify-between text-sm">
                        <span className="text-white/40">{row.label}</span>
                        <span className="text-white capitalize font-medium">{row.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended plan */}
                <div
                  className="rounded-xl p-5 mb-4"
                  style={{ background: 'rgba(253,176,34,0.07)', border: '1px solid rgba(253,176,34,0.3)' }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#FDB022] mb-1">Recommended Plan</div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-bold text-white">{recommendation.name}</span>
                    <span className="text-lg font-bold text-[#FDB022]">{recommendation.price}</span>
                  </div>
                  <div className="space-y-2">
                    {recommendation.reasons.map(r => (
                      <div key={r} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-white/70">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What students like you achieve */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { stat: '91%',   label: 'pass first try' },
                    { stat: '87%',   label: 'avg exam score' },
                    { stat: '~2 wk', label: 'avg time to ready' },
                  ].map(s => (
                    <div key={s.stat} className="rounded-lg py-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-base font-bold text-white">{s.stat}</div>
                      <div className="text-[10px] text-white/35 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep('signup')}
                  className="w-full py-3.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 mb-3"
                  style={{ background: '#FDB022', color: '#080E1C', boxShadow: '0 4px 16px rgba(253,176,34,0.25)' }}
                >
                  Start My Free Trial
                </button>

                <p className="text-center text-xs text-white/30 mb-2">
                  10 free questions — no credit card required
                </p>

                <div className="text-center">
                  <Link href="/upgrade" className="text-xs text-white/25 hover:text-white/50 transition-colors">
                    See all pricing options →
                  </Link>
                </div>
              </motion.div>
            )}

            {/* ── Signup form ────────────────────────────────────────── */}
            {step === 'signup' && (
              <motion.div
                key="signup"
                variants={slideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {signupSuccess ? (
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                      style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
                    >
                      <span className="text-3xl">✉️</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
                    <p className="text-white/50 text-sm mb-4">
                      We sent a confirmation link to <strong className="text-white">{email}</strong>. Click it to activate your account.
                    </p>
                    <Link href="/login" className="text-[#FDB022] text-sm font-medium hover:opacity-80 transition-opacity">
                      Back to login →
                    </Link>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={goBack}
                      className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/70 transition-colors mb-6"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>

                    <div className="mb-6">
                      <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
                      <p className="text-sm text-white/50">
                        {recommendation
                          ? `Start with 10 free questions. Upgrade to ${recommendation.name} when you're ready.`
                          : 'Start with 10 free questions — no credit card required.'}
                      </p>
                    </div>

                    <div
                      className="rounded-2xl p-6"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-1.5">Full Name</label>
                          <input
                            type="text"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            placeholder="John Smith"
                            required
                            autoComplete="name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
                          <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              placeholder="Min 8 characters"
                              required
                              minLength={8}
                              autoComplete="new-password"
                              style={{ paddingRight: '48px' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '16px 1fr', gap: '10px', alignItems: 'start' }}>
                          <input
                            id="terms"
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={e => setAgreedToTerms(e.target.checked)}
                            style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#FDB022' }}
                            required
                          />
                          <label htmlFor="terms" className="text-xs text-white/50 leading-relaxed cursor-pointer">
                            I agree to the{' '}
                            <Link href="/terms" target="_blank" className="text-[#FDB022] underline">Terms</Link>
                            {' '}and{' '}
                            <Link href="/privacy" target="_blank" className="text-[#FDB022] underline">Privacy Policy</Link>.
                            I understand all sales are final.
                          </label>
                        </div>

                        {signupError && (
                          <div className="px-4 py-3 rounded-lg text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            {signupError}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={loading || !agreedToTerms}
                          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50"
                          style={{ background: '#FDB022', color: '#080E1C' }}
                        >
                          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create My Free Account'}
                        </button>
                      </form>
                    </div>

                    <p className="text-center mt-4 text-sm text-white/40">
                      Already have an account?{' '}
                      <Link href="/login" className="text-[#FDB022] hover:opacity-80 transition-opacity font-medium">
                        Sign in
                      </Link>
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
    <Suspense fallback={<div className="min-h-screen bg-[#0A2463] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#FFB627]" /></div>}>
      <StartPageInner />
    </Suspense>
  )
}
