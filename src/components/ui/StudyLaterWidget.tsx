'use client'

import { useState } from 'react'
import { Question } from '@/types'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

export default function StudyLaterWidget({ questions }: { questions: Question[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (!questions.length) return null

  return (
    <div className="glass-card p-4">
      <div className="space-y-2">
        {questions.map(q => {
          const isOpen = expanded === q.id
          const opts: Record<string, string> = {
            A: q.option_a, B: q.option_b, C: q.option_c,
            ...(q.option_d ? { D: q.option_d } : {}),
          }
          return (
            <div
              key={q.id}
              className="rounded-xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : q.id)}
                className="w-full text-left p-4 flex items-start gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-[#3E92CC]">{q.category}</span>
                  </div>
                  <p className="text-white/85 text-sm leading-relaxed line-clamp-2">{q.question_text}</p>
                </div>
                {isOpen
                  ? <ChevronUp className="w-4 h-4 text-white/30 shrink-0 mt-1" />
                  : <ChevronDown className="w-4 h-4 text-white/30 shrink-0 mt-1" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-1.5 animate-fade-in">
                  {(Object.keys(opts)).map(key => (
                    <div
                      key={key}
                      className="text-xs px-3 py-2 rounded-lg flex items-center gap-2"
                      style={{
                        background: key === q.correct_answer ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                        color: key === q.correct_answer ? '#22c55e' : 'rgba(255,255,255,0.4)',
                        border: key === q.correct_answer ? '1px solid rgba(34,197,94,0.2)' : '1px solid transparent',
                      }}
                    >
                      <span className="font-bold w-4">{key}.</span>
                      {opts[key]}
                      {key === q.correct_answer && <span className="ml-auto font-semibold text-[10px]">✓ Correct</span>}
                    </div>
                  ))}
                  {q.explanation && (
                    <div className="mt-2 p-2.5 rounded-lg text-xs text-white/50 leading-relaxed" style={{ background: 'rgba(62,146,204,0.07)', borderLeft: '2px solid rgba(62,146,204,0.3)' }}>
                      {q.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <Link href="/saved" className="mt-3 block text-center text-xs text-white/40 hover:text-white/70 transition-colors py-2">
        View all saved questions →
      </Link>
    </div>
  )
}
