'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Question, AnswerOption } from '@/types'
import { useExamType } from '@/components/ExamTypeProvider'
import { CONFIDENCE_OPTIONS, type ConfidenceLevel } from '@/lib/confidence'
import { EXAM_QUESTION_DISTRIBUTION, IFR_EXAM_QUESTION_DISTRIBUTION } from '@/lib/utils'
import { wilsonLowerBound } from '@/lib/readiness'
import AnswerFeedbackPanel from '@/components/practice/AnswerFeedbackPanel'
import SupplementViewer from '@/components/ui/SupplementViewer'
import { matchFigureReference } from '@/lib/figures'
import { Compass, Loader2, ChevronRight } from 'lucide-react'

const DIAGNOSTIC_LENGTH = 12

type Phase = 'intro' | 'loading' | 'question' | 'answered' | 'results'

interface CategoryTally { correct: number; total: number }

/**
 * The Test Runway's Diagnose phase — deliberately NOT the regular Practice flow.
 * It samples broadly across every category (round-robin) instead of narrowing to one
 * topic, drops difficulty labels and the AI tutor/save-for-later affordances that
 * imply a study session rather than an assessment, and ends in a dedicated results
 * screen instead of a generic session summary. Every answer still writes through the
 * normal /api/sessions/answer path (concept_mastery, novel tracking, error tags all
 * update exactly like any other mode) — what's different here is presentation and
 * framing, not the underlying data model. A 12-question sample is not enough to
 * declare a concept "weak" for good, so the results screen and this page's copy both
 * deliberately hedge ("early signal", "starting estimate") rather than asserting a
 * verdict — later practice, novel questions, and spaced review are what actually
 * firm up mastery over time.
 */
export default function DiagnosticPage() {
  const { examType } = useExamType()
  const categories = Object.keys(examType === 'ifr' ? IFR_EXAM_QUESTION_DISTRIBUTION : EXAM_QUESTION_DISTRIBUTION)

  const [phase, setPhase] = useState<Phase>('intro')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [askedIds, setAskedIds] = useState<string[]>([])
  const [question, setQuestion] = useState<Question | null>(null)
  const [pending, setPending] = useState<AnswerOption | null>(null)
  const [selected, setSelected] = useState<AnswerOption | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)
  const [tally, setTally] = useState<Record<string, CategoryTally>>({})

  const fetchQuestion = useCallback(async (idx: number, excludeIds: string[]) => {
    setPhase('loading')
    const category = categories[idx % categories.length]
    const params = new URLSearchParams()
    params.set('category', category)
    params.set('examType', examType)
    excludeIds.forEach(id => params.append('exclude', id))
    const res = await fetch(`/api/questions/random?${params}`)
    const data = await res.json()
    if (!data.question) {
      // This category ran dry — move on rather than stall the diagnostic on it. Keep
      // the displayed index in sync with the actual skip so "Question X of N" never
      // drifts behind what's really being served.
      setIndex(idx + 1)
      if (idx + 1 < DIAGNOSTIC_LENGTH) await fetchQuestion(idx + 1, excludeIds)
      else await finish()
      return
    }
    setQuestion(data.question)
    setPending(null)
    setSelected(null)
    setPhase('question')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examType])

  async function start() {
    const res = await fetch('/api/sessions/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionType: 'practice_mode' }),
    })
    const data = await res.json()
    setSessionId(data.sessionId)
    setIndex(0)
    setAskedIds([])
    setTally({})
    await fetchQuestion(0, [])
  }

  async function submit(answer: AnswerOption, confidence: ConfidenceLevel) {
    if (!question || !sessionId) return
    const correct = answer === question.correct_answer
    setSelected(answer)
    setIsCorrect(correct)
    setTally(t => {
      const prev = t[question.category] ?? { correct: 0, total: 0 }
      return { ...t, [question.category]: { correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 } }
    })
    await fetch('/api/sessions/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, questionId: question.id, answer, isCorrect: correct, confidence }),
    })
    setPhase('answered')
  }

  async function next() {
    if (!question) return
    const newIds = [...askedIds, question.id]
    setAskedIds(newIds)
    const newIndex = index + 1
    setIndex(newIndex)
    if (newIndex >= DIAGNOSTIC_LENGTH) await finish()
    else await fetchQuestion(newIndex, newIds)
  }

  async function finish() {
    setPhase('loading')
    // Mark today's runway item done — fire-and-forget-safe, doesn't block the results
    // screen. Deliberately NOT fetching /api/readiness here: a 12-question sample is
    // exactly the case that formula should never be asked to summarize into a single
    // number for display. The raw score below is the honest artifact of today's
    // session; readiness as a concept belongs to the Readiness page once there's
    // enough accumulated practice history to mean something.
    fetch('/api/runway', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markTodayComplete: true }) }).catch(() => {})
    setPhase('results')
  }

  if (phase === 'intro') {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto flex flex-col items-center text-center min-h-[70vh] justify-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(62,146,204,0.15)', border: '1px solid rgba(62,146,204,0.3)' }}>
          <Compass className="w-7 h-7 text-[#3E92CC]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Diagnostic</h1>
        <p className="text-sm mb-2 max-w-md" style={{ color: 'var(--text-sec)' }}>
          {DIAGNOSTIC_LENGTH} questions, sampled broadly across every category. No hints, no AI tutor — just answer and rate how sure you are.
        </p>
        <p className="text-xs mb-4 max-w-md" style={{ color: 'var(--text-ter)' }}>
          This is a starting point, not a verdict. A short sample can&apos;t declare anything permanently strong or weak — it just tells the Test Runway where to begin.
        </p>
        <p className="text-xs mb-8 max-w-md italic" style={{ color: 'var(--text-ter)' }}>
          Answer as honestly as you can. This isn&apos;t a test of how good you are — it&apos;s how we figure out where to start. The more honestly you answer, including your confidence, the better we can tailor your study plan.
        </p>
        <button
          onClick={start}
          className="flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl text-sm font-bold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #3E92CC, #2a7ab5)', color: 'white', boxShadow: '0 4px 20px rgba(62,146,204,0.35)' }}
        >
          Start Diagnostic <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  if (phase === 'loading') {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-white/30" /></div>
  }

  if (phase === 'results') {
    const scored = Object.entries(tally).filter(([, t]) => t.total > 0).map(([cat, t]) => ({ cat, pct: Math.round((t.correct / t.total) * 100), ...t }))
    // Wilson lower bound, not raw percentage — a single missed guess in a category
    // that got exactly one question (0/1 = 0%) would otherwise outrank a category
    // with real signal (e.g. 2/5 = 40%), surfacing the noisiest read as "Early
    // signals" instead of the most informative one. Same conservative-on-small-n
    // logic already used for readiness scoring.
    const weakest = [...scored].sort((a, b) => wilsonLowerBound(a.correct, a.total) - wilsonLowerBound(b.correct, b.total)).slice(0, 3)
    const totalCorrect = scored.reduce((s, c) => s + c.correct, 0)
    const totalAnswered = scored.reduce((s, c) => s + c.total, 0)

    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-ter)' }}>Diagnostic Complete</p>
          <h1 className="text-2xl font-bold text-white mb-1">Your Starting Point</h1>
          <p className="text-xs" style={{ color: 'var(--text-ter)' }}>A starting estimate — not a final verdict. This updates every time you practice.</p>
        </div>

        <div className="rounded-2xl p-6 mb-4 text-center" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-ter)' }}>Today&apos;s result</p>
          <p className="text-5xl font-extrabold" style={{ color: 'var(--text-pri)' }}>{totalCorrect}<span className="text-2xl" style={{ color: 'var(--text-ter)' }}>/{totalAnswered} correct</span></p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-ter)' }}>Enough to establish a starting point — not enough to define your mastery.</p>
        </div>

        {weakest.length > 0 && (
          <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
            <h2 className="text-sm font-bold text-white mb-1">Early signals</h2>
            <p className="text-xs mb-3" style={{ color: 'var(--text-ter)' }}>These are early signals, not permanent labels. Tarmac will refine them as you train.</p>
            <div className="space-y-2">
              {weakest.map(w => (
                <div key={w.cat} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--text-sec)' }}>{w.cat}</span>
                  <span className="text-xs tabular-nums" style={{ color: 'var(--text-ter)' }}>{w.correct}/{w.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link
          href="/study-plan"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463', boxShadow: '0 4px 20px rgba(255,182,39,0.35)' }}
        >
          Start Building <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  if (!question) return null

  const options = [
    { letter: 'A' as AnswerOption, text: question.option_a },
    { letter: 'B' as AnswerOption, text: question.option_b },
    { letter: 'C' as AnswerOption, text: question.option_c },
    ...(question.option_d ? [{ letter: 'D' as AnswerOption, text: question.option_d }] : []),
  ]
  const figureReference = matchFigureReference(question.question_text)

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: 'rgba(62,146,204,0.12)', color: '#3E92CC' }}>
          <Compass className="w-3 h-3" /> {question.category}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-ter)' }}>Diagnostic question {index + 1} of {DIAGNOSTIC_LENGTH}</span>
      </div>

      <div className="progress-bar mb-4">
        <div className="progress-fill" style={{ width: `${((index + (phase === 'answered' ? 1 : 0)) / DIAGNOSTIC_LENGTH) * 100}%`, background: '#3E92CC' }} />
      </div>

      <div className="glass-card p-5 mb-4">
        <p className="text-white font-medium leading-relaxed">{question.question_text}</p>
      </div>

      {figureReference && (
        <div className="mb-4">
          <SupplementViewer reference={figureReference} />
        </div>
      )}

      <div className="flex flex-col gap-2 mb-4">
        {options.map(opt => {
          const revealed = phase === 'answered'
          const isRight = opt.letter === question.correct_answer
          const isSelected = pending === opt.letter || selected === opt.letter
          let style: React.CSSProperties = { background: 'var(--surface-1)', border: '1px solid var(--border-1)', color: 'var(--text-pri)' }
          if (revealed && isRight) style = { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', color: '#22c55e' }
          else if (revealed && isSelected && !isRight) style = { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444' }
          else if (isSelected) style = { background: 'rgba(62,146,204,0.12)', border: '1px solid rgba(62,146,204,0.4)', color: 'var(--text-pri)' }
          return (
            <button
              key={opt.letter}
              disabled={revealed}
              onClick={() => setPending(opt.letter)}
              className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all"
              style={style}
            >
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--surface-3)' }}>{opt.letter}</span>
              <span className="text-sm leading-snug">{opt.text}</span>
            </button>
          )
        })}
      </div>

      {phase === 'question' && pending && (
        <div className="flex gap-2 mb-4">
          {CONFIDENCE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => submit(pending, opt.value)}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', color: 'var(--text-sec)' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {phase === 'answered' && (
        <AnswerFeedbackPanel
          question={question}
          isCorrect={isCorrect}
          onNext={next}
          nextLabel={index + 1 >= DIAGNOSTIC_LENGTH ? 'See my starting point' : 'Next question'}
        />
      )}
    </div>
  )
}
