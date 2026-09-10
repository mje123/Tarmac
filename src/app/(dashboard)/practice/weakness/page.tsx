'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Question, AnswerOption } from '@/types'
import { useExamType } from '@/components/ExamTypeProvider'
import AnswerFeedbackPanel from '@/components/practice/AnswerFeedbackPanel'
import SupplementViewer from '@/components/ui/SupplementViewer'
import { matchFigureReference } from '@/lib/figures'
import { Target, Loader2 } from 'lucide-react'

const TARGET_QUESTIONS = 8
const TIME_LIMIT_SECONDS = 7 * 60

type Phase = 'loading' | 'question' | 'answered' | 'empty' | 'summary'

/**
 * Weakness Attack — a short, focused drill on the user's 2-3 weakest concepts (see
 * weaknessOnly on the question API, which restricts the whole candidate pool rather
 * than just biasing toward them). Timed and question-capped so it reads as "Tarmac
 * knows what I need to work on" rather than another open-ended practice session.
 */
export default function WeaknessAttackPage() {
  const { examType } = useExamType()
  const [phase, setPhase] = useState<Phase>('loading')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [selected, setSelected] = useState<AnswerOption | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [askedIds, setAskedIds] = useState<string[]>([])
  const [conceptHistory, setConceptHistory] = useState<string[]>([])
  const [secondsLeft, setSecondsLeft] = useState(TIME_LIMIT_SECONDS)
  const answeredCountRef = useRef(0)

  const fetchQuestion = useCallback(async (excludeIds: string[], recentConcepts: string[]) => {
    setPhase('loading')
    const params = new URLSearchParams()
    params.set('examType', examType)
    params.set('weaknessOnly', '1')
    excludeIds.forEach(id => params.append('exclude', id))
    // With only 2-3 weak concepts in the whole candidate pool, interleaving matters
    // more here than anywhere else — without it the same concept could repeat
    // back-to-back for the entire 7-minute drill.
    recentConcepts.forEach(id => params.append('recentConcept', id))
    const res = await fetch(`/api/questions/random?${params}`)
    const data = await res.json()
    if (!data.question) {
      setPhase(answeredCountRef.current > 0 ? 'summary' : 'empty')
      return
    }
    setQuestion(data.question)
    setSelected(null)
    setPhase('question')
    if (data.question.concept_id) {
      setConceptHistory(h => [...h, data.question.concept_id].slice(-5))
    }
  }, [examType])

  useEffect(() => {
    async function start() {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionType: 'practice_mode' }),
      })
      const data = await res.json()
      setSessionId(data.sessionId)
      await fetchQuestion([], [])
    }
    start()
  }, [fetchQuestion])

  useEffect(() => {
    if (phase === 'summary' || phase === 'empty') return
    const timer = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timer)
          setPhase('summary')
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [phase])

  async function submit(answer: AnswerOption) {
    if (!question || !sessionId) return
    const correct = answer === question.correct_answer
    setSelected(answer)
    setIsCorrect(correct)
    const newAnswered = answeredCount + 1
    setAnsweredCount(newAnswered)
    answeredCountRef.current = newAnswered
    if (correct) setCorrectCount(c => c + 1)
    await fetch('/api/sessions/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, questionId: question.id, answer, isCorrect: correct, confidence: null }),
    })
    setPhase('answered')
  }

  async function next() {
    if (!question) return
    const newIds = [...askedIds, question.id]
    setAskedIds(newIds)
    if (answeredCountRef.current >= TARGET_QUESTIONS) { setPhase('summary'); return }
    await fetchQuestion(newIds, conceptHistory)
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  if (phase === 'loading') {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-white/30" /></div>
  }

  if (phase === 'empty') {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center min-h-[50vh] flex flex-col items-center justify-center">
        <p className="text-white/60 text-sm">No weak concepts identified yet — answer a few practice questions first so Tarmac knows what to attack.</p>
      </div>
    )
  }

  if (phase === 'summary') {
    const pct = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0
    return (
      <div className="p-6 max-w-2xl mx-auto text-center min-h-[50vh] flex flex-col items-center justify-center">
        <Target className="w-10 h-10 mb-3" style={{ color: '#ef4444' }} />
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-ter)' }}>Weakness Attack Complete</p>
        <p className="text-5xl font-extrabold text-white mb-2">{correctCount}/{answeredCount}</p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-ter)' }}>{pct}% on your weakest concepts</p>
        <button onClick={() => window.location.reload()} className="btn-gold px-6 py-3 rounded-xl text-sm font-bold">Attack again</button>
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
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
          <Target className="w-3 h-3" /> {question.category} Attack
        </span>
        <span className="text-xs tabular-nums font-semibold" style={{ color: secondsLeft < 60 ? '#ef4444' : 'var(--text-ter)' }}>
          {minutes}:{seconds.toString().padStart(2, '0')} · {answeredCount}/{TARGET_QUESTIONS}
        </span>
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
        <AnswerFeedbackPanel question={question} isCorrect={isCorrect} onNext={next} nextLabel={answeredCount >= TARGET_QUESTIONS ? 'See results' : 'Next'} />
      )}
    </div>
  )
}
