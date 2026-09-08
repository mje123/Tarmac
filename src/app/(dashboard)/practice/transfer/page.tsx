'use client'

import { useState, useCallback, useRef } from 'react'
import { Question, AnswerOption } from '@/types'
import { useExamType } from '@/components/ExamTypeProvider'
import { CONFIDENCE_OPTIONS, type ConfidenceLevel } from '@/lib/confidence'
import AnswerFeedbackPanel from '@/components/practice/AnswerFeedbackPanel'
import AIChat from '@/components/ui/AIChat'
import { Zap, Loader2, ChevronRight } from 'lucide-react'

type Phase = 'intro' | 'loading' | 'question' | 'answered' | 'empty' | 'summary'

/**
 * Transfer mode — deliberately skips the category picker and setup ceremony. The
 * whole point is questions the student hasn't drilled into recognizing: forced to
 * multi_concept/transfer cognitive levels (see minCognitiveLevel on the API), mixed
 * across concepts (interleaved), no easing in. See the "you know the basics, now
 * let's see if you can apply them" framing in the product spec.
 */
export default function TransferModePage() {
  const { examType } = useExamType()
  const [phase, setPhase] = useState<Phase>('intro')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [selected, setSelected] = useState<AnswerOption | null>(null)
  const [pending, setPending] = useState<AnswerOption | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [askedIds, setAskedIds] = useState<string[]>([])
  const [conceptHistory, setConceptHistory] = useState<string[]>([])
  const [showAI, setShowAI] = useState(false)
  // Questions confirmed (by a real server lookup) to have no other same-concept
  // question available right now. Keyed by question id so it naturally resets the
  // moment a new question is shown.
  const [noAltIds, setNoAltIds] = useState<Set<string>>(new Set())
  const totalAnsweredRef = useRef(0)
  totalAnsweredRef.current = totalAnswered

  const fetchQuestion = useCallback(async (excludeIds: string[], recentConcepts: string[]) => {
    setPhase('loading')
    const params = new URLSearchParams()
    params.set('examType', examType)
    params.set('minCognitiveLevel', 'multi_concept')
    excludeIds.forEach(id => params.append('exclude', id))
    recentConcepts.slice(-2).forEach(id => params.append('recentConcept', id))
    const res = await fetch(`/api/questions/random?${params}`)
    const data = await res.json()
    if (!data.question) {
      setPhase(totalAnsweredRef.current > 0 ? 'summary' : 'empty')
      return
    }
    setQuestion(data.question)
    setSelected(null)
    setPending(null)
    setPhase('question')
    if (data.question.concept_id) setConceptHistory(h => [...h, data.question.concept_id].slice(-5))
  }, [examType])

  async function start() {
    const res = await fetch('/api/sessions/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionType: 'practice_mode' }),
    })
    const data = await res.json()
    setSessionId(data.sessionId)
    setCorrectCount(0)
    setTotalAnswered(0)
    setAskedIds([])
    setConceptHistory([])
    await fetchQuestion([], [])
  }

  async function submit(answer: AnswerOption, confidence: ConfidenceLevel | null) {
    if (!question || !sessionId) return
    const correct = answer === question.correct_answer
    setSelected(answer)
    setPending(null)
    setIsCorrect(correct)
    setTotalAnswered(t => t + 1)
    if (correct) setCorrectCount(c => c + 1)
    await fetch('/api/sessions/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, questionId: question.id, answer, isCorrect: correct, confidence }),
    })
    setPhase('answered')
  }

  async function next() {
    if (!question) return
    await fetchQuestion([...askedIds, question.id], conceptHistory)
    setAskedIds(ids => [...ids, question.id])
  }

  // Must NEVER fall back to an unrelated concept — if the server has no other question
  // for this exact concept right now, stay on the current answered screen and hide the
  // button for this question, instead of silently switching topics.
  async function proveIt() {
    if (!question || !question.concept_id) return
    const currentQuestionId = question.id
    const params = new URLSearchParams()
    params.set('conceptId', question.concept_id)
    params.set('proveIt', '1')
    if (question.archetype_id) params.set('lastArchetypeId', question.archetype_id)
    if (question.novelty_key) params.set('lastNoveltyKey', question.novelty_key)
    params.set('examType', examType)
    const excludeIds = [...askedIds, currentQuestionId]
    excludeIds.forEach(id => params.append('exclude', id))
    setPhase('loading')
    const res = await fetch(`/api/questions/random?${params}`)
    const data = await res.json()
    if (!data.question) {
      setNoAltIds(s => new Set(s).add(currentQuestionId))
      setPhase('answered')
      return
    }
    setAskedIds(excludeIds)
    setQuestion(data.question)
    setSelected(null)
    setPending(null)
    setPhase('question')
    if (data.question.concept_id) setConceptHistory(h => [...h, data.question.concept_id].slice(-5))
  }

  if (phase === 'intro') {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto flex flex-col items-center text-center min-h-[70vh] justify-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(255,182,39,0.15)', border: '1px solid rgba(255,182,39,0.3)' }}>
          <Zap className="w-7 h-7 text-[#FFB627]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">You know the basics.</h1>
        <p className="text-lg font-semibold mb-6" style={{ color: 'var(--text-sec)' }}>Now let&apos;s see if you can apply them.</p>
        <p className="text-sm mb-8 max-w-md" style={{ color: 'var(--text-ter)' }}>
          Every question here changes the wording, the numbers, or the scenario from anything you&apos;ve drilled before. Mixed concepts, no easing in.
        </p>
        <button
          onClick={start}
          className="flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl text-sm font-bold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463', boxShadow: '0 4px 20px rgba(255,182,39,0.35)' }}
        >
          Start Transfer <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  if (phase === 'loading') {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-white/30" /></div>
  }

  if (phase === 'empty') {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center min-h-[50vh] flex flex-col items-center justify-center">
        <p className="text-white/60 text-sm">Not enough transfer-level content yet for this mix. Try Practice mode while more concepts get added.</p>
      </div>
    )
  }

  if (phase === 'summary') {
    const pct = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0
    return (
      <div className="p-6 max-w-2xl mx-auto text-center min-h-[50vh] flex flex-col items-center justify-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-ter)' }}>Transfer Accuracy</p>
        <p className="text-5xl font-extrabold text-white mb-6">{pct}%</p>
        <button onClick={start} className="btn-gold px-6 py-3 rounded-xl text-sm font-bold">Go again</button>
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
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,182,39,0.12)', color: '#FFB627' }}>
          {question.category}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-ter)' }}>{correctCount}/{totalAnswered} this session</span>
      </div>

      <div className="glass-card p-5 mb-4">
        <p className="text-white font-medium leading-relaxed">{question.question_text}</p>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {options.map(opt => {
          const isSelected = pending === opt.letter
          const revealed = phase === 'answered'
          const isRight = opt.letter === question.correct_answer
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
          onProveIt={question && !noAltIds.has(question.id) ? proveIt : undefined}
          onAskAI={!isCorrect ? () => setShowAI(true) : undefined}
        />
      )}

      {showAI && question && selected && (
        <AIChat
          question={question}
          userAnswer={selected}
          correctAnswer={question.correct_answer}
          onClose={() => setShowAI(false)}
          onContinue={() => setShowAI(false)}
        />
      )}
    </div>
  )
}
