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
  | 'q1' | 'q2' | 'q3' | 'q4'
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
  /** 'date' renders a real date input instead of the option-button list. */
  type?: 'options' | 'date'
  options: Option[]
  skippable?: boolean
  feedbacks: Record<string, string>
}

/** Days between today and an ISO "YYYY-MM-DD" test date, or null if unset. Used to
 *  give q2 a real, dynamic feedback message instead of picking from a fixed bucket. */
function daysUntil(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
}

function testDateFeedback(dateStr: string | null): string {
  if (!dateStr) return "No problem — pick a target once you're ready and the runway adjusts around it."
  const days = daysUntil(dateStr)
  if (days <= 30) return "We'll compress your 30-Day Runway to fit — diagnostic first, then straight into your weak areas."
  if (days <= 90) return "That's enough time to build real understanding, not just cram the last two weeks."
  return "Plenty of runway. We'll pace it so concepts have time to actually stick."
}

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'Which FAA written test are you preparing for?',
    options: [
      { value: 'ppl', label: 'Private Pilot (PAR)',      sub: 'Airplane single-engine land written' },
      { value: 'ifr', label: 'Instrument Rating (IRA)',  sub: 'Instrument airplane written' },
    ],
    feedbacks: {
      ppl: "Regulations, airspace, weather, performance, and navigation — all generated fresh, not pulled from a fixed bank.",
      ifr: "Approaches, holding, navigation, weather, and alternate requirements — trained through scenarios, not memorized questions.",
    },
  },
  {
    id: 'q2',
    text: 'When is your test?',
    type: 'date',
    skippable: true,
    options: [],
    feedbacks: {},
  },
  {
    id: 'q3',
    text: 'How many minutes a day can you realistically study?',
    options: [
      { value: '10', label: '10 minutes',  sub: 'Quick daily retrieval' },
      { value: '20', label: '20 minutes',  sub: 'A focused session' },
      { value: '30', label: '30 minutes',  sub: 'Room for concept work + practice' },
      { value: '45', label: '45+ minutes', sub: 'Deep sessions, faster progress' },
    ],
    feedbacks: {
      '10': "Short sessions still work — your daily session is sized to fit, not stretched to a fixed length.",
      '20': "That's enough for a real session: review, retrieval, and a novel question or two.",
      '30': "Solid daily block — enough time for concept work, practice, and spaced review.",
      '45': "You'll move through the 30-Day Runway faster with sessions this size.",
    },
  },
  {
    id: 'q4',
    text: 'Last one — how did you hear about TARMAC?',
    skippable: true,
    options: [
      { value: 'instagram', label: 'Instagram' },
      { value: 'tiktok',    label: 'TikTok' },
      { value: 'youtube',   label: 'YouTube' },
      { value: 'google',    label: 'Google / Search' },
      { value: 'reddit',    label: 'Reddit' },
      { value: 'friend',    label: 'Friend or fellow pilot' },
      { value: 'cfi',       label: 'My flight instructor (CFI)' },
      { value: 'other',     label: 'Somewhere else' },
    ],
    feedbacks: {
      instagram: "Welcome. Glad the feed led you here.",
      tiktok:    "TikTok → TARMAC. The pilot pipeline.",
      youtube:   "Good taste in content.",
      google:    "You searched. You found.",
      reddit:    "The aviation community delivers again.",
      friend:    "Tell them we said thanks.",
      cfi:       "Your CFI has good judgment.",
      other:     "However you got here — glad you did.",
      skipped:   '',
    },
  },
]

// ─── Option icons ─────────────────────────────────────────────────────────────

const OPTION_ICONS: Record<string, string> = {
  // Q1 — exam type
  ppl: '🛩️', ifr: '🌫️',
  // Q3 — minutes per day
  '10': '⚡', '20': '📖', '30': '🎯', '45': '🚀',
  // Q4 — referral
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
  const { exam_type, test_date } = answers
  const reasons: string[] = []

  // Reason 1: exam
  if (exam_type === 'ifr') {
    reasons.push('Instrument written prep — approaches, holding, navigation, and weather, generated as new scenarios every session')
  } else {
    reasons.push('Private Pilot written prep — regulations, airspace, weather, and performance, generated as new scenarios every session')
  }

  reasons.push('A diagnostic finds out where you actually stand, then the Runway adapts to your weak areas — no guessing from a self-rating')

  // Reason 3: timeline
  if (test_date && daysUntil(test_date) <= 30) {
    reasons.push('The 30-Day Runway compresses to fit your timeline, starting with a diagnostic today')
  } else {
    reasons.push('The 30-Day Runway takes you from diagnostic to test-ready, adapting to your weak areas')
  }

  return {
    planId: 'beta_monthly',
    name: 'TARMAC Written',
    price: '$29.99/mo',
    reasons: reasons.slice(0, 3),
    cta: 'Start Free Trial',
  }
}

function getStats(answers: Partial<OnboardingData>): { stat: string; label: string }[] {
  const { minutes_per_day } = answers

  const s1 = { stat: '2', label: 'exams included — Private + Instrument' }
  const s2 = { stat: '30 days', label: 'diagnostic-to-test-ready runway' }
  const s3 = minutes_per_day
    ? { stat: `${minutes_per_day} min`, label: 'a day, optimized — not just more questions' }
    : { stat: 'New', label: 'questions generated every session' }

  return [s1, s2, s3]
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
  const urlExam = searchParams.get('exam')

  const [step, setStep] = useState<Step>(urlExam === 'ppl' || urlExam === 'ifr' ? 'q2' : 'q1')
  const [answers, setAnswers] = useState<Partial<OnboardingData>>(
    urlExam === 'ppl' || urlExam === 'ifr' ? { exam_type: urlExam } : {}
  )
  const [selectedValue, setSelectedValue] = useState<string | null>(null)
  const [dateInputValue, setDateInputValue] = useState('')
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
    if (urlPlan || urlExam) { localStorage.removeItem('tarmac_quiz'); return }
    try {
      const saved = localStorage.getItem('tarmac_quiz')
      if (saved) {
        const { step: s, answers: a } = JSON.parse(saved)
        if (s && a && s.startsWith('q')) { setStep(s); setAnswers(a) }
        else { localStorage.removeItem('tarmac_quiz') }
      }
    } catch { /* ignore */ }
  }, [urlPlan, urlExam])

  useEffect(() => {
    try { localStorage.setItem('tarmac_quiz', JSON.stringify({ step, answers })) } catch { /* ignore */ }
  }, [step, answers])

  const STEP_ORDER: Step[] = ['q1', 'q2', 'q3', 'q4', 'recommendation', 'signup']
  const questionSteps = STEP_ORDER.filter(s => s.startsWith('q')) as Step[]
  const currentQuestionIndex = questionSteps.indexOf(step)
  const totalQuestions = questionSteps.length
  const currentQuestion = QUESTIONS.find(q => q.id === step)

  function selectOption(value: string) {
    if (selectedValue) return
    setSelectedValue(value)
    const fieldMap: Record<string, keyof OnboardingData> = {
      q1: 'exam_type', q3: 'minutes_per_day', q4: 'referral_source',
    }
    const field = fieldMap[step]
    const newAnswers = { ...answers, [field]: value as never }
    setAnswers(newAnswers)
    const feedback = currentQuestion?.feedbacks[value]
    if (feedback) setFeedbackText(feedback)
    setTimeout(() => advance(step, newAnswers), 1400)
  }

  function selectDate(value: string | null) {
    if (selectedValue) return
    setSelectedValue(value || 'skipped')
    const newAnswers = { ...answers, test_date: value ?? undefined }
    setAnswers(newAnswers)
    setFeedbackText(testDateFeedback(value))
    setTimeout(() => advance(step, newAnswers), 1400)
  }

  function skipQuestion() {
    const fieldMap: Record<string, keyof OnboardingData> = { q4: 'referral_source' }
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
      const userUpdates: Record<string, unknown> = { onboarding_data: answers }
      if (!marketingEmails) userUpdates.marketing_emails = false
      if (answers.exam_type === 'ppl' || answers.exam_type === 'ifr') userUpdates.preferred_exam_type = answers.exam_type
      await supabase.from('users').update(userUpdates).eq('id', data.user.id)

      // Seed study_plan_state at signup (rather than waiting for the lazy
      // first-Runway-visit create) so a real test date and daily-minutes preference
      // shape the plan from Day 1 instead of defaulting to no exam date / 20 min.
      const dailyMinutes = answers.minutes_per_day ? parseInt(answers.minutes_per_day, 10) : null
      if (answers.test_date || dailyMinutes) {
        await supabase.from('study_plan_state').insert({
          user_id: data.user.id,
          exam_date: answers.test_date || null,
          daily_minutes_target: dailyMinutes || 20,
        })
      }

      if (answers.exam_type === 'ppl' || answers.exam_type === 'ifr') {
        try {
          localStorage.setItem('tarmac-exam-type', answers.exam_type)
          document.cookie = `tarmac-exam-type=${answers.exam_type}; path=/; max-age=31536000; SameSite=Lax`
        } catch { /* ignore */ }
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

                {/* Date input (q2 — real test date instead of a vague bucket) */}
                {currentQuestion.type === 'date' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <input
                      type="date"
                      value={dateInputValue}
                      onChange={e => setDateInputValue(e.target.value)}
                      disabled={!!selectedValue}
                      min={new Date().toISOString().slice(0, 10)}
                      className="w-full text-sm px-4 py-3.5 rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}
                    />
                    <button
                      onClick={() => selectDate(dateInputValue || null)}
                      disabled={!dateInputValue || !!selectedValue}
                      className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg, #FFB627, #f5a300)', color: '#080E1C' }}
                    >
                      Continue
                    </button>
                  </motion.div>
                )}

                {/* Options */}
                {currentQuestion.type !== 'date' && (
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
                )}

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
                  ✈️ &nbsp;Join pilots studying smarter, not harder
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
                  {getStats(answers).map(s => (
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
