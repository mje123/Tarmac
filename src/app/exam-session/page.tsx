'use client'

import { useState, useEffect, useRef } from 'react'
import { Question, AnswerOption } from '@/types'
import AIChat from '@/components/ui/AIChat'
import { formatTime } from '@/lib/utils'
import { Clock, CheckCircle, Flag, ChevronLeft, ChevronRight, Loader2, BookOpen, Lock, Bookmark, ArrowLeft, AlertTriangle } from 'lucide-react'

type ExamPhase = 'start' | 'exam' | 'submitting'

interface ExamAnswer {
  questionId: string
  answer: AnswerOption | null
  isMarked: boolean
  isCorrect: boolean | null
}

export default function ExamSessionPage() {
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
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { checkAccess(); loadSavedIds() }, [])

  async function checkAccess() {
    const res = await fetch('/api/sessions/exam-access')
    const data = await res.json()
    if (!data.hasAccess) setAccessDenied(true)
  }

  async function loadSavedIds() {
    try {
      const res = await fetch('/api/questions/save')
      if (res.ok) { const data = await res.json(); setSavedIds(new Set(data.savedIds ?? [])) }
    } catch { /* non-fatal */ }
  }

  async function toggleSave(questionId: string) {
    const isSaved = savedIds.has(questionId)
    try {
      const res = await fetch('/api/questions/save', {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
      })
      if (res.ok) {
        setSavedIds(prev => { const next = new Set(prev); isSaved ? next.delete(questionId) : next.add(questionId); return next })
      }
    } catch { /* non-fatal */ }
  }

  useEffect(() => {
    if (phase !== 'exam') return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); submitExam(); return 0 }
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
      setAnswers(data.questions.map((q: Question) => ({ questionId: q.id, answer: null, isMarked: false, isCorrect: null })))
      setTimeLeft(150 * 60)
      setCurrentIdx(0)
      setPhase('exam')
    } finally { setLoading(false) }
  }

  function selectAnswer(answer: AnswerOption) {
    setAnswers(prev => prev.map((a, i) => i === currentIdx ? { ...a, answer } : a))
  }

  function toggleMark() {
    setAnswers(prev => prev.map((a, i) => i === currentIdx ? { ...a, isMarked: !a.isMarked } : a))
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
      if (!data.error) window.location.href = '/exam'
    } finally { setLoading(false) }
  }

  // ── Paywall ──────────────────────────────────────────────────────────────────
  if (accessDenied) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8" style={{ background: '#060d1f' }}>
        <div className="p-10 max-w-md text-center rounded-2xl" style={{ background: '#0d1b3e', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Lock className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Tarmac Membership Required</h2>
          <p className="text-white/60 mb-6">Practice exams are available with Tarmac Membership.</p>
          <a href="/settings" className="btn-gold inline-flex justify-center px-8 py-3">Upgrade Now</a>
        </div>
      </div>
    )
  }

  // ── Grading ──────────────────────────────────────────────────────────────────
  if (phase === 'submitting') {
    return (
      <div className="flex items-center justify-center min-h-screen p-8" style={{ background: '#060d1f' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#FFB627] animate-spin mx-auto mb-5" />
          <h2 className="text-2xl font-bold text-white mb-2">Grading your exam…</h2>
          <p className="text-white/50">Hang tight while we calculate your results.</p>
        </div>
      </div>
    )
  }

  // ── Start screen ─────────────────────────────────────────────────────────────
  if (phase === 'start') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#060d1f' }}>
        <div className="w-full max-w-lg">
          <a href="/exam" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Exams
          </a>

          <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1b3e', border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Header stripe */}
            <div className="px-8 py-5 text-center" style={{ background: 'linear-gradient(135deg, #0a2463, #0d2070)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-xs font-bold tracking-widest text-[#FFB627] uppercase mb-1">FAA Knowledge Test Simulation</div>
              <h1 className="text-2xl font-bold text-white">Private Pilot — Airplane</h1>
              <p className="text-white/50 text-sm mt-1">PAR</p>
            </div>

            <div className="p-8">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[{ label: 'Questions', value: '60' }, { label: 'Time Limit', value: '2 hr 30 min' }, { label: 'Passing Score', value: '70%' }].map(s => (
                  <div key={s.label} className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="text-xl font-bold text-white">{s.value}</div>
                    <div className="text-white/40 text-xs mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Instructions */}
              <div className="mb-8 rounded-xl p-4" style={{ background: 'rgba(255,182,39,0.06)', border: '1px solid rgba(255,182,39,0.15)' }}>
                <div className="text-xs font-bold text-[#FFB627] uppercase tracking-wider mb-3">Test Instructions</div>
                <ul className="space-y-2">
                  {[
                    'Read each question carefully before selecting your answer',
                    'You may flag questions and return to them before submitting',
                    'All 60 questions must be answered before you can submit',
                    'The timer runs continuously and cannot be paused',
                    'The FAA Supplement booklet is available via the link above',
                    'Your score and detailed review will be available after submission',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-white/65">
                      <span className="text-[#FFB627] mt-0.5 shrink-0">›</span>{item}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={startExam}
                disabled={loading}
                className="w-full py-4 rounded-xl text-base font-bold text-[#0A2463] flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', boxShadow: '0 4px 20px rgba(255,182,39,0.3)' }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><BookOpen className="w-5 h-5" /> Begin Test</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Exam phase ────────────────────────────────────────────────────────────────
  const currentQ = questions[currentIdx]
  const currentAns = answers[currentIdx]
  const answeredCount = answers.filter(a => a.answer !== null).length
  const unansweredCount = questions.length - answeredCount
  const allAnswered = answeredCount === questions.length && questions.length > 0
  const optKeys: AnswerOption[] = currentQ
    ? (['A', 'B', 'C', 'D'] as AnswerOption[]).filter(k => k !== 'D' || !!currentQ.option_d)
    : ['A', 'B', 'C']
  const optVals: Record<string, string> = currentQ ? {
    A: currentQ.option_a, B: currentQ.option_b, C: currentQ.option_c,
    ...(currentQ.option_d ? { D: currentQ.option_d } : {}),
  } : { A: '', B: '', C: '' }

  const timerWarning = timeLeft < 600
  const timerCaution = timeLeft < 1800
  const isSaved = currentQ ? savedIds.has(currentQ.id) : false

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#060d1f' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0" style={{ background: '#0a1628', borderBottom: '2px solid rgba(255,255,255,0.06)' }}>
        {/* Timer */}
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-white/40" />
          <span
            className="font-mono text-xl font-bold tabular-nums"
            style={{ color: timerWarning ? '#ef4444' : timerCaution ? '#FFB627' : '#e2e8f0' }}
          >
            {formatTime(timeLeft)}
          </span>
          {timerWarning && <span className="text-red-400 text-xs font-semibold animate-pulse">LOW TIME</span>}
        </div>

        {/* Center: question counter + progress */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-white/70 text-sm font-medium">
            Question <span className="text-white font-bold">{currentIdx + 1}</span> of <span className="text-white font-bold">{questions.length}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-400">{answeredCount} answered</span>
            {unansweredCount > 0 && <span className="text-white/30">{unansweredCount} remaining</span>}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <a href={process.env.NEXT_PUBLIC_SUPPLEMENT_URL || 'https://vdbrfhuzyffipcjifaui.supabase.co/storage/v1/object/public/public/supplement.pdf'} target="_blank" rel="noopener noreferrer"
            className="text-xs font-medium transition-colors hover:text-white"
            style={{ color: '#4ade80' }}>
            FAA Supplement ↗
          </a>
          {allAnswered ? (
            <button
              onClick={() => setConfirmSubmit(true)}
              className="px-5 py-2 rounded-lg text-sm font-bold text-[#0A2463] transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)' }}
            >
              Submit Test
            </button>
          ) : (
            <span className="text-white/25 text-xs">Answer all to submit</span>
          )}
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-0.5 shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%`, background: 'linear-gradient(90deg, #3E92CC, #22c55e)' }}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Question area ── */}
        <div className="flex-1 overflow-y-auto py-10 px-8">
          <div className="max-w-2xl mx-auto">

            {/* Question header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md" style={{ background: 'rgba(62,146,204,0.15)', color: '#60a5fa', border: '1px solid rgba(62,146,204,0.2)' }}>
                  {currentQ?.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMark}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${currentAns?.isMarked ? 'text-[#FFB627]' : 'text-white/35 hover:text-white/60'}`}
                  style={{ background: currentAns?.isMarked ? 'rgba(255,182,39,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${currentAns?.isMarked ? 'rgba(255,182,39,0.3)' : 'rgba(255,255,255,0.08)'}` }}
                >
                  <Flag className="w-3 h-3" />
                  {currentAns?.isMarked ? 'Flagged' : 'Flag for Review'}
                </button>
                {currentQ && (
                  <button
                    onClick={() => toggleSave(currentQ.id)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${isSaved ? 'text-[#FFB627]' : 'text-white/35 hover:text-white/60'}`}
                    style={{ background: isSaved ? 'rgba(255,182,39,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isSaved ? 'rgba(255,182,39,0.3)' : 'rgba(255,255,255,0.08)'}` }}
                  >
                    <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-current' : ''}`} />
                    {isSaved ? 'Saved' : 'Study Later'}
                  </button>
                )}
              </div>
            </div>

            {/* Question text */}
            <div className="mb-8 p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-white text-lg leading-relaxed font-medium">{currentQ?.question_text}</p>
            </div>

            {/* Answer options */}
            <div className="space-y-3 mb-10">
              {optKeys.map((key, idx) => {
                const selected = currentAns?.answer === key
                return (
                  <button
                    key={key}
                    onClick={() => selectAnswer(key)}
                    className="w-full text-left flex items-center gap-4 transition-all rounded-xl group"
                    style={{
                      padding: '14px 18px',
                      background: selected ? 'rgba(62,146,204,0.15)' : 'rgba(255,255,255,0.03)',
                      border: selected ? '1.5px solid #3E92CC' : '1.5px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    {/* Radio circle */}
                    <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-all"
                      style={{ border: selected ? '2px solid #3E92CC' : '2px solid rgba(255,255,255,0.2)' }}>
                      {selected && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#3E92CC' }} />}
                    </div>
                    {/* Letter badge */}
                    <span className="text-sm font-bold shrink-0 w-5 text-center" style={{ color: selected ? '#3E92CC' : 'rgba(255,255,255,0.35)' }}>
                      {key}
                    </span>
                    <span className="text-sm leading-relaxed" style={{ color: selected ? 'white' : 'rgba(255,255,255,0.75)' }}>
                      {optVals[key]}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <span className="text-white/25 text-sm tabular-nums">{currentIdx + 1} / {questions.length}</span>

              <button
                onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
                disabled={currentIdx === questions.length - 1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
                style={{ background: 'rgba(62,146,204,0.15)', color: '#60a5fa', border: '1px solid rgba(62,146,204,0.25)' }}
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Question navigator sidebar ── */}
        <div className="w-56 shrink-0 overflow-y-auto py-6 px-4 scrollbar-hidden" style={{ background: '#080f20', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Question Navigator</div>
          <div className="grid grid-cols-5 gap-1.5 mb-6">
            {questions.map((_, i) => {
              const a = answers[i]
              let bg = 'rgba(255,255,255,0.05)', color = 'rgba(255,255,255,0.3)', borderColor = 'transparent'
              if (i === currentIdx) { bg = '#3E92CC'; color = 'white'; borderColor = '#3E92CC' }
              else if (a?.isMarked && a?.answer) { bg = 'rgba(255,182,39,0.15)'; color = '#FFB627'; borderColor = 'rgba(255,182,39,0.4)' }
              else if (a?.isMarked) { bg = 'rgba(255,182,39,0.08)'; color = '#FFB627'; borderColor = 'rgba(255,182,39,0.3)' }
              else if (a?.answer) { bg = 'rgba(34,197,94,0.12)'; color = '#4ade80'; borderColor = 'rgba(34,197,94,0.3)' }
              return (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className="w-8 h-8 rounded-lg text-xs font-bold transition-all hover:scale-105"
                  style={{ background: bg, color, border: `1px solid ${borderColor}` }}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="space-y-2 text-xs">
            <div className="text-white/30 font-semibold uppercase tracking-wider mb-2" style={{ fontSize: '10px' }}>Legend</div>
            {[
              { color: 'rgba(34,197,94,0.3)', label: 'Answered', count: answeredCount },
              { color: 'rgba(255,182,39,0.3)', label: 'Flagged', count: answers.filter(a => a.isMarked).length },
              { color: 'rgba(255,255,255,0.1)', label: 'Unanswered', count: unansweredCount },
            ].map(({ color, label, count }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ background: color }} />
                  <span className="text-white/45">{label}</span>
                </div>
                <span className="text-white/30 tabular-nums">{count}</span>
              </div>
            ))}
          </div>

          {/* Submit from sidebar when all answered */}
          {allAnswered && (
            <button
              onClick={() => setConfirmSubmit(true)}
              className="w-full mt-6 py-3 rounded-xl text-sm font-bold text-[#0A2463] transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)' }}
            >
              Submit Test
            </button>
          )}
        </div>
      </div>

      {/* ── Confirm submit dialog ── */}
      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-7 text-center" style={{ background: '#0d1b3e', border: '1px solid rgba(255,255,255,0.12)' }}>
            <AlertTriangle className="w-10 h-10 text-[#FFB627] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Submit Test?</h3>
            <p className="text-white/55 text-sm mb-6 leading-relaxed">
              You have answered all 60 questions. Once submitted, you cannot change your answers.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmSubmit(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Review Answers
              </button>
              <button
                onClick={() => { setConfirmSubmit(false); submitExam() }}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-[#0A2463] transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)' }}
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewAI && (
        <AIChat question={reviewAI.q} userAnswer={reviewAI.userAnswer} correctAnswer={reviewAI.q.correct_answer} onClose={() => setReviewAI(null)} />
      )}
    </div>
  )
}
