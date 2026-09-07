'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Question, AnswerOption } from '@/types'
import { useExamType } from '@/components/ExamTypeProvider'
import AnswerFeedbackPanel from '@/components/practice/AnswerFeedbackPanel'
import { GraduationCap, Loader2, ChevronRight } from 'lucide-react'

type Phase = 'loading-concept' | 'intro' | 'loading-question' | 'question' | 'answered' | 'empty'

interface ConceptInfo {
  id: string
  name: string
  rule_summary: string
  authoritative_source: string
}

/**
 * Learn mode — used when a concept is weak. Short concept explanation up front, then
 * easy (recall/application-only) retrieval before any harder variation, per the
 * product spec's Learn flow. Confidence rating is intentionally skipped here — the
 * point is low-friction retrieval, not calibration (that's what Practice mode is for).
 */
export default function LearnModePage() {
  const { examType } = useExamType()
  const [phase, setPhase] = useState<Phase>('loading-concept')
  const [concept, setConcept] = useState<ConceptInfo | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [selected, setSelected] = useState<AnswerOption | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)
  const [askedIds, setAskedIds] = useState<string[]>([])
  const [answeredCount, setAnsweredCount] = useState(0)

  const loadConcept = useCallback(async () => {
    setPhase('loading-concept')
    const res = await fetch(`/api/practice/learn-target?examType=${examType}`)
    const data = await res.json()
    if (!data.concept) { setPhase('empty'); return }
    setConcept(data.concept)
    setPhase('intro')
  }, [examType])

  useEffect(() => { loadConcept() }, [loadConcept])

  async function fetchQuestion(conceptId: string, excludeIds: string[]) {
    setPhase('loading-question')
    const params = new URLSearchParams()
    params.set('conceptId', conceptId)
    params.set('maxCognitiveLevel', 'application')
    params.set('examType', examType)
    excludeIds.forEach(id => params.append('exclude', id))
    const res = await fetch(`/api/questions/random?${params}`)
    const data = await res.json()
    if (!data.question) { setPhase('empty'); return }
    setQuestion(data.question)
    setSelected(null)
    setPhase('question')
  }

  async function start() {
    if (!concept) return
    const res = await fetch('/api/sessions/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionType: 'practice_mode' }),
    })
    const data = await res.json()
    setSessionId(data.sessionId)
    setAnsweredCount(0)
    setAskedIds([])
    await fetchQuestion(concept.id, [])
  }

  async function submit(answer: AnswerOption) {
    if (!question || !sessionId) return
    const correct = answer === question.correct_answer
    setSelected(answer)
    setIsCorrect(correct)
    setAnsweredCount(c => c + 1)
    await fetch('/api/sessions/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, questionId: question.id, answer, isCorrect: correct, confidence: null }),
    })
    setPhase('answered')
  }

  async function next() {
    if (!question || !concept) return
    const newIds = [...askedIds, question.id]
    setAskedIds(newIds)
    await fetchQuestion(concept.id, newIds)
  }

  if (phase === 'loading-concept' || phase === 'loading-question') {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-white/30" /></div>
  }

  if (phase === 'empty') {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center min-h-[50vh] flex flex-col items-center justify-center">
        <p className="text-white/60 text-sm mb-3">Nothing to teach here yet — this concept doesn&apos;t have enough seeded content.</p>
        <Link href="/practice/practice" className="text-sm text-[#3E92CC] hover:underline">Go to Practice instead →</Link>
      </div>
    )
  }

  if (phase === 'intro' && concept) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto flex flex-col items-center text-center min-h-[70vh] justify-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(62,146,204,0.15)', border: '1px solid rgba(62,146,204,0.3)' }}>
          <GraduationCap className="w-7 h-7 text-[#3E92CC]" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-ter)' }}>Today&apos;s concept</p>
        <h1 className="text-2xl font-bold text-white mb-4">{concept.name}</h1>
        <div className="glass-card p-5 mb-6 text-left">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-sec)' }}>{concept.rule_summary}</p>
          <p className="text-xs mt-3" style={{ color: 'var(--text-ter)' }}>Source: {concept.authoritative_source}</p>
        </div>
        <button
          onClick={start}
          className="flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl text-sm font-bold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #3E92CC, #2a7ab5)', color: 'white', boxShadow: '0 4px 20px rgba(62,146,204,0.35)' }}
        >
          Try it <ChevronRight className="w-4 h-4" />
        </button>
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

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(62,146,204,0.12)', color: '#3E92CC' }}>
          {concept?.name}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-ter)' }}>{answeredCount} answered</span>
      </div>

      <div className="glass-card p-5 mb-4">
        <p className="text-white font-medium leading-relaxed">{question.question_text}</p>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {options.map(opt => {
          const revealed = phase === 'answered'
          const isRight = opt.letter === question.correct_answer
          const isSelected = selected === opt.letter
          let style: React.CSSProperties = { background: 'var(--surface-1)', border: '1px solid var(--border-1)', color: 'var(--text-pri)' }
          if (revealed && isRight) style = { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', color: '#22c55e' }
          else if (revealed && isSelected && !isRight) style = { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444' }
          return (
            <button
              key={opt.letter}
              disabled={revealed}
              onClick={() => submit(opt.letter)}
              className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all"
              style={style}
            >
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--surface-3)' }}>{opt.letter}</span>
              <span className="text-sm leading-snug">{opt.text}</span>
            </button>
          )
        })}
      </div>

      {phase === 'answered' && (
        <AnswerFeedbackPanel question={question} isCorrect={isCorrect} onNext={next} nextLabel="Another one" />
      )}
    </div>
  )
}
