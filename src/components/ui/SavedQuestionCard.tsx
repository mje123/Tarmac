'use client'

import { useState } from 'react'
import { Question } from '@/types'
import { Bookmark, BookmarkX, ChevronDown, ChevronUp } from 'lucide-react'

export default function SavedQuestionCard({ question }: { question: Question }) {
  const [saved, setSaved] = useState(true)
  const [expanded, setExpanded] = useState(false)

  async function unsave() {
    await fetch('/api/questions/save', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: question.id }),
    })
    setSaved(false)
  }

  if (!saved) return null

  const opts: Record<string, string> = {
    A: question.option_a,
    B: question.option_b,
    C: question.option_c,
    ...(question.option_d ? { D: question.option_d } : {}),
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(62,146,204,0.15)', color: '#3E92CC' }}>
              {question.category}
            </span>
            <span className="text-xs text-white/30">{question.difficulty}</span>
          </div>
          <p className="text-white text-sm leading-relaxed font-medium">{question.question_text}</p>
        </div>
        <button
          onClick={unsave}
          title="Remove from saved"
          className="shrink-0 p-1.5 rounded-lg text-[#FFB627] hover:bg-[#FFB627]/10 transition-all"
        >
          <Bookmark className="w-4 h-4 fill-current" />
        </button>
      </div>

      <button
        onClick={() => setExpanded(v => !v)}
        className="mt-3 flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
      >
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {expanded ? 'Hide answer' : 'Show answer'}
      </button>

      {expanded && (
        <div className="mt-3 space-y-1.5 animate-fade-in">
          {(Object.keys(opts) as string[]).map(key => (
            <div
              key={key}
              className="text-xs px-3 py-2 rounded-lg flex items-center gap-2"
              style={{
                background: key === question.correct_answer ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                color: key === question.correct_answer ? '#22c55e' : 'rgba(255,255,255,0.4)',
                border: key === question.correct_answer ? '1px solid rgba(34,197,94,0.2)' : '1px solid transparent',
              }}
            >
              <span className="font-bold w-4">{key}.</span>
              {opts[key]}
              {key === question.correct_answer && <span className="ml-auto font-semibold">✓</span>}
            </div>
          ))}
          {question.explanation && (
            <div className="mt-2 p-3 rounded-lg text-xs text-white/55 leading-relaxed" style={{ background: 'rgba(62,146,204,0.07)', borderLeft: '2px solid rgba(62,146,204,0.3)' }}>
              {question.explanation}
              {question.reference && <div className="mt-1 text-[#3E92CC]/60">Ref: {question.reference}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
