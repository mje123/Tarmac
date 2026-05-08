'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, CheckCircle, XCircle, Brain, ChevronRight } from 'lucide-react'
import { FEATURES } from '@/lib/features'
import SupplementViewer from '@/components/ui/SupplementViewer'

interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string | null
  correct_answer: string
  explanation: string
  category: string
}

type Phase = 'loading' | 'question' | 'revealed' | 'done' | 'empty'

const LETTERS = ['A', 'B', 'C', 'D'] as const

export default function ReviewPage() {
  const [question, setQuestion] = useState<Question | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [selected, setSelected] = useState<string | null>(null)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)

  const loadNext = useCallback(async () => {
    setPhase('loading')
    setSelected(null)
    const res = await fetch('/api/srs/next')
    const data = await res.json()
    if (!data.question) {
      setPhase(reviewedCount > 0 ? 'done' : 'empty')
    } else {
      setQuestion(data.question)
      setPhase('question')
    }
  }, [reviewedCount])

  useEffect(() => { loadNext() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleReveal(letter: string) {
    setSelected(letter)
    setPhase('revealed')
  }

  async function handleResult(correct: boolean) {
    if (!question) return
    await fetch('/api/srs/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ questionId: question.id, correct }),
    })
    setReviewedCount(c => c + 1)
    if (correct) setCorrectCount(c => c + 1)
    loadNext()
  }

  if (!FEATURES.SRS) return (
    <div className="p-6 text-white/50 text-center mt-20">Daily review is currently disabled.</div>
  )

  const supplementRef = question?.question_text.match(/FAA-CT-8080-2H[,\s]+(Figures?|Legend)\s+\d+/i)?.[0]
    || question?.question_text.match(/\(Refer to (Figures?|Legend)\s+\d+/i)?.[0]?.replace('(Refer to ', '')

  const options = [
    { letter: 'A', text: question?.option_a },
    { letter: 'B', text: question?.option_b },
    { letter: 'C', text: question?.option_c },
    ...(question?.option_d ? [{ letter: 'D', text: question.option_d }] : []),
  ]

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(62,146,204,0.15)', border: '1px solid rgba(62,146,204,0.2)' }}>
          <Brain className="w-6 h-6 text-[#3E92CC]" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Daily Review</h1>
          <p className="text-white/45 text-sm mt-0.5">Spaced repetition — questions you've missed before</p>
        </div>
        {reviewedCount > 0 && (
          <div className="ml-auto text-right">
            <div className="text-white font-bold tabular-nums">{correctCount}/{reviewedCount}</div>
            <div className="text-white/40 text-xs">today</div>
          </div>
        )}
      </div>

      {/* States */}
      {phase === 'loading' && (
        <div className="glass-card p-10 text-center">
          <RefreshCw className="w-8 h-8 text-white/20 mx-auto animate-spin" />
        </div>
      )}

      {phase === 'empty' && (
        <div className="glass-card p-10 text-center">
          <Brain className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Nothing due yet</h3>
          <p className="text-white/50 text-sm">Answer questions in Practice Mode — ones you miss will show up here on a review schedule.</p>
        </div>
      )}

      {phase === 'done' && (
        <div className="glass-card p-10 text-center">
          <CheckCircle className="w-12 h-12 text-[#22c55e] mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-1">All caught up!</h3>
          <p className="text-white/50 text-sm mb-4">Reviewed {reviewedCount} question{reviewedCount !== 1 ? 's' : ''} · {correctCount} correct</p>
          <p className="text-white/35 text-xs">Check back tomorrow for your next set.</p>
        </div>
      )}

      {(phase === 'question' || phase === 'revealed') && question && (
        <>
          {/* Category badge */}
          <div className="mb-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(62,146,204,0.12)', color: '#3E92CC' }}>
              {question.category}
            </span>
          </div>

          {/* Question */}
          <div className="glass-card p-5 mb-4">
            <p className="text-white font-medium leading-relaxed">{question.question_text}</p>
          </div>

          {/* Figure supplement */}
          {supplementRef && (
            <div className="mb-4">
              <SupplementViewer figureRef={supplementRef} />
            </div>
          )}

          {/* Options */}
          <div className="flex flex-col gap-2 mb-4">
            {options.map(opt => {
              const isCorrect = opt.letter === question.correct_answer
              const isSelected = opt.letter === selected
              let bg = 'var(--surface-1)'
              let border = '1px solid var(--border-1)'
              let textColor = 'var(--text-pri)'
              let letterBg = 'var(--surface-3)'

              if (phase === 'revealed') {
                if (isCorrect) {
                  bg = 'rgba(34,197,94,0.12)'
                  border = '1px solid rgba(34,197,94,0.35)'
                  textColor = '#22c55e'
                  letterBg = 'rgba(34,197,94,0.2)'
                } else if (isSelected && !isCorrect) {
                  bg = 'rgba(239,68,68,0.12)'
                  border = '1px solid rgba(239,68,68,0.35)'
                  textColor = '#ef4444'
                  letterBg = 'rgba(239,68,68,0.2)'
                } else {
                  textColor = 'var(--text-ter)'
                  letterBg = 'var(--surface-2)'
                }
              }

              return (
                <button
                  key={opt.letter}
                  disabled={phase === 'revealed'}
                  onClick={() => phase === 'question' && handleReveal(opt.letter)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                  style={{ background: bg, border, color: textColor }}
                >
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{ background: letterBg }}>
                    {opt.letter}
                  </span>
                  <span className="text-sm leading-snug">{opt.text}</span>
                </button>
              )
            })}
          </div>

          {/* Explanation + result buttons */}
          {phase === 'revealed' && (
            <>
              <div className="glass-card p-4 mb-4 text-sm text-white/70 leading-relaxed" style={{ borderColor: 'rgba(255,182,39,0.15)' }}>
                <span className="text-[#FFB627] font-semibold">Explanation: </span>
                {question.explanation}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleResult(false)}
                  className="flex items-center justify-center gap-2 p-4 rounded-xl font-semibold text-sm transition-all"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}
                >
                  <XCircle className="w-4 h-4" />
                  Still Learning
                </button>
                <button
                  onClick={() => handleResult(selected === question.correct_answer)}
                  className="flex items-center justify-center gap-2 p-4 rounded-xl font-semibold text-sm transition-all"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}
                >
                  <CheckCircle className="w-4 h-4" />
                  Got It
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
