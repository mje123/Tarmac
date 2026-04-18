'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Question, AnswerOption } from '@/types'
import AIChat from '@/components/ui/AIChat'
import { formatTime } from '@/lib/utils'
import {
  Clock,
  CheckCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
  Lock,
  Bookmark,
  ArrowLeft,
} from 'lucide-react'

type ExamPhase = 'paywall' | 'start' | 'exam' | 'submitting'

interface ExamAnswer {
  questionId: string
  answer: AnswerOption | null
  isMarked: boolean
  isCorrect: boolean | null
}

export default function ExamTakePage() {
  const router = useRouter()
  const [phase, setPhase] = useState<ExamPhase>('start')
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<ExamAnswer[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(150 * 60)
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [reviewAI, setReviewAI] = useState<{ q: Question; userAnswer: string } | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    checkAccess()
    loadSavedIds()
  }, [])

  async function checkAccess() {
    const res = await fetch('/api/sessions/exam-access')
    const data = await res.json()
    if (!data.hasAccess) setAccessDenied(true)
  }

  async function loadSavedIds() {
    try {
      const res = await fetch('/api/questions/save')
      if (res.ok) {
        const data = await res.json()
        setSavedIds(new Set(data.savedIds ?? []))
      }
    } catch {
      // non-fatal
    }
  }

  async function toggleSave(questionId: string) {
    const isSaved = savedIds.has(questionId)
    const method = isSaved ? 'DELETE' : 'POST'
    try {
      const res = await fetch('/api/questions/save', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
      })
      if (res.ok) {
        setSavedIds(prev => {
          const next = new Set(prev)
          if (isSaved) next.delete(questionId)
          else next.add(questionId)
          return next
        })
      }
    } catch {
      // non-fatal
    }
  }

  useEffect(() => {
    if (phase !== 'exam') return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          submitExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase])

  async function startExam() {
    setLoading(true)
    try {
      const res = await fetch('/api/sessions/start-exam', { method: 'POST' })
      const data = await res.json()
      if (data.error) { setAccessDenied(true); return }
      setSessionId(data.sessionId)
      setQuestions(data.questions)
      setAnswers(data.questions.map((q: Question) => ({
        questionId: q.id,
        answer: null,
        isMarked: false,
        isCorrect: null,
      })))
      setTimeLeft(150 * 60)
      setCurrentIdx(0)
      setPhase('exam')
    } finally {
      setLoading(false)
    }
  }

  function selectAnswer(answer: AnswerOption) {
    setAnswers(prev => prev.map((a, i) =>
      i === currentIdx ? { ...a, answer } : a
    ))
  }

  function toggleMark() {
    setAnswers(prev => prev.map((a, i) =>
      i === currentIdx ? { ...a, isMarked: !a.isMarked } : a
    ))
  }

  async function submitExam() {
    clearInterval(timerRef.current!)
    setPhase('submitting')
    setLoading(true)

    try {
      const res = await fetch('/api/sessions/submit-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answers, timeRemainingSeconds: timeLeft }),
      })
      const data = await res.json()
      if (!data.error) {
        router.push('/exam')
      }
    } finally {
      setLoading(false)
    }
  }

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="glass-card p-10 max-w-md text-center animate-fade-in">
          <Lock className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Study Pass Required</h2>
          <p className="text-white/60 mb-6">Practice exams are available with Study Pass.</p>
          <a href="/settings" className="btn-gold inline-flex justify-center px-8 py-3">Upgrade Now</a>
        </div>
      </div>
    )
  }

  if (phase === 'submitting') {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="glass-card p-10 max-w-md text-center animate-fade-in">
          <Loader2 className="w-12 h-12 text-[#FFB627] animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Grading your exam…</h2>
          <p className="text-white/50 text-sm">Hang tight while we calculate your results.</p>
        </div>
      </div>
    )
  }

  if (phase === 'start') {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="glass-card p-8 max-w-lg w-full animate-fade-in relative">
          <a
            href="/exam"
            className="absolute top-5 left-5 flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Exams
          </a>
          <div className="text-center mb-8 mt-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,182,39,0.15)' }}>
              <BookOpen className="w-8 h-8 text-[#FFB627]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Practice Exam</h1>
            <p className="text-white/60">FAA Private Pilot Written — full simulation, official format</p>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Questions', value: '60' },
              { label: 'Time Limit', value: '2:30' },
              { label: 'To Pass', value: '70%' },
            ].map(s => (
              <div key={s.label} className="text-center glass p-4 rounded-xl">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-white/50 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <ul className="space-y-2 mb-8 text-sm text-white/70">
            {[
              'You can mark questions for review and return to them',
              'All questions must be answered before submitting',
              "Timer runs continuously — it won't pause",
              'After completing, review all answers with AI explanations',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          <button onClick={startExam} disabled={loading} className="btn-gold w-full justify-center py-4 text-lg">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Exam'}
          </button>
        </div>
      </div>
    )
  }

  // Exam phase
  const currentQ = questions[currentIdx]
  const currentAns = answers[currentIdx]
  const answeredCount = answers.filter(a => a.answer !== null).length
  const allAnswered = answeredCount === questions.length && questions.length > 0
  const optKeys: AnswerOption[] = currentQ
    ? (['A', 'B', 'C', 'D'] as AnswerOption[]).filter(k => k !== 'D' || !!currentQ.option_d)
    : ['A', 'B', 'C']
  const optVals: Record<string, string> = currentQ ? {
    A: currentQ.option_a,
    B: currentQ.option_b,
    C: currentQ.option_c,
    ...(currentQ.option_d ? { D: currentQ.option_d } : {}),
  } : { A: '', B: '', C: '' }

  const timerColor = timeLeft < 600 ? 'text-red-400' : timeLeft < 1800 ? 'text-[#FFB627]' : 'text-white'
  const isSaved = currentQ ? savedIds.has(currentQ.id) : false

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0" style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-white/40" />
          <span className={`font-mono text-lg font-semibold ${timerColor}`}>{formatTime(timeLeft)}</span>
        </div>
        <div className="text-white/60 text-sm">
          Question {currentIdx + 1} / {questions.length}
          <span className="ml-3 text-[#3E92CC]">{answeredCount} answered</span>
        </div>
        {allAnswered && (
          <button onClick={submitExam} disabled={loading} className="btn-gold px-5 py-2 text-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Exam'}
          </button>
        )}
        {!allAnswered && (
          <div className="flex items-center gap-3">
            <a href="/supplement.pdf" target="_blank" rel="noopener noreferrer" className="text-xs text-green-400/80 hover:text-green-400 transition-colors">FAA Supplement ↗</a>
            <span className="text-white/30 text-sm">Answer all to submit</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main question area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(62,146,204,0.15)', color: '#3E92CC' }}>
                {currentQ?.category}
              </span>
              <button
                onClick={toggleMark}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all ${currentAns?.isMarked ? 'text-[#FFB627] bg-[#FFB627]/15' : 'text-white/40 hover:text-white/70'}`}
              >
                <Flag className="w-3 h-3" />
                {currentAns?.isMarked ? 'Marked' : 'Mark for review'}
              </button>
              {currentQ && (
                <button
                  onClick={() => toggleSave(currentQ.id)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all ${isSaved ? 'text-[#FFB627] bg-[#FFB627]/15' : 'text-white/40 hover:text-white/70'}`}
                  title={isSaved ? 'Remove bookmark' : 'Bookmark question'}
                >
                  <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-current' : ''}`} />
                  {isSaved ? 'Saved' : 'Save'}
                </button>
              )}
            </div>

            <p className="text-white text-xl font-medium leading-relaxed mb-8">
              {currentQ?.question_text}
            </p>

            <div className="space-y-3">
              {optKeys.map(key => (
                <button
                  key={key}
                  onClick={() => selectAnswer(key)}
                  className="w-full text-left p-4 flex items-start gap-3 transition-all rounded-xl"
                  style={{
                    background: currentAns?.answer === key ? 'rgba(62,146,204,0.2)' : 'rgba(255,255,255,0.04)',
                    border: currentAns?.answer === key ? '1px solid #3E92CC' : '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0" style={{ background: currentAns?.answer === key ? '#3E92CC' : 'rgba(255,255,255,0.08)', color: currentAns?.answer === key ? 'white' : 'rgba(255,255,255,0.6)' }}>
                    {key}
                  </span>
                  <span className="text-white/90 leading-relaxed">{optVals[key]}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                className="btn-ghost flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>
              <button
                onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
                disabled={currentIdx === questions.length - 1}
                className="btn-primary flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Question palette */}
        <div className="w-52 shrink-0 overflow-y-auto p-4 scrollbar-hidden" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-xs text-white/50 font-medium mb-3">Question Navigator</div>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((_, i) => {
              const a = answers[i]
              let bg = 'rgba(255,255,255,0.06)'
              let color = 'rgba(255,255,255,0.4)'
              if (i === currentIdx) { bg = '#3E92CC'; color = 'white' }
              else if (a?.isMarked && a?.answer) { bg = 'rgba(255,182,39,0.3)'; color = '#FFB627' }
              else if (a?.answer) { bg = 'rgba(34,197,94,0.2)'; color = '#22c55e' }
              return (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: bg, color }}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          <div className="mt-4 space-y-2 text-xs text-white/40">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-400/20" />Answered</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#FFB627]/30" />Marked</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-white/10" />Unanswered</div>
          </div>
        </div>
      </div>

      {reviewAI && (
        <AIChat
          question={reviewAI.q}
          userAnswer={reviewAI.userAnswer}
          correctAnswer={reviewAI.q.correct_answer}
          onClose={() => setReviewAI(null)}
        />
      )}
    </div>
  )
}
