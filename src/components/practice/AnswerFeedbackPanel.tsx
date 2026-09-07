'use client'

import { CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import type { Question } from '@/types'

interface AnswerFeedbackPanelProps {
  question: Question
  isCorrect: boolean
  onNext: () => void
  onProveIt?: () => void
  onAskAI?: () => void
  nextLabel?: string
}

/** Shared wrong/correct feedback card — explanation, why-the-distractors-fail,
 *  concept trap, source, and (for concept-linked questions) a Prove It CTA. Used by
 *  Learn, Transfer, and the main Practice flow so the rich feedback fields
 *  (distractor_rationale/common_trap, already generated but easy to leave unrendered)
 *  show up everywhere a question can be answered wrong. */
export default function AnswerFeedbackPanel({ question, isCorrect, onNext, onProveIt, onAskAI, nextLabel }: AnswerFeedbackPanelProps) {
  return (
    <div className="mt-5 animate-fade-in">
      <div
        className="p-4 rounded-2xl mb-4"
        style={isCorrect
          ? { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }
          : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <div className={`flex items-center gap-2 font-bold mb-1.5 text-sm ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
          {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {isCorrect ? 'Correct!' : 'Not quite — review the explanation'}
        </div>
        <p className="text-white/65 text-sm leading-relaxed">{question.explanation}</p>
        {!isCorrect && question.distractor_rationale && (
          <p className="text-white/55 text-xs mt-3 leading-relaxed">
            <span className="text-red-300 font-semibold">Why the other answers are wrong: </span>
            {question.distractor_rationale}
          </p>
        )}
        {!isCorrect && question.common_trap && (
          <p className="text-white/55 text-xs mt-2 leading-relaxed">
            <span className="text-red-300 font-semibold">The trap: </span>
            {question.common_trap}
          </p>
        )}
        {!isCorrect && question.reference && (
          <p className="text-white/30 text-xs mt-2">Ref: {question.reference}</p>
        )}
      </div>

      {!isCorrect && question.concept_id && onProveIt && (
        <button
          onClick={onProveIt}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-90 mb-3"
          style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463', boxShadow: '0 4px 20px rgba(255,182,39,0.35)' }}
        >
          Prove It — different scenario, same concept
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <div className={`grid gap-3 ${!isCorrect && onAskAI ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {!isCorrect && onAskAI && (
          <button
            onClick={onAskAI}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #3E92CC, #2a7ab5)', color: 'white', boxShadow: '0 4px 20px rgba(62,146,204,0.35)' }}
          >
            Ask AI Tutor
          </button>
        )}
        <button
          onClick={onNext}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-90"
          style={
            !isCorrect && question.concept_id
              ? { background: 'var(--surface-2)', color: 'var(--text-sec)' }
              : { background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463', boxShadow: '0 4px 20px rgba(255,182,39,0.35)' }
          }
        >
          {nextLabel ?? 'Next Question'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
