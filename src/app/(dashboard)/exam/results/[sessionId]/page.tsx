'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AIChat from '@/components/ui/AIChat'
import { CheckCircle, XCircle, ArrowLeft, Loader2, BookOpen } from 'lucide-react'
import { Question } from '@/types'

interface SessionAnswer {
  id: string
  user_answer: string | null
  is_correct: boolean | null
  is_marked_for_review: boolean
  error_tag: string | null
  questions: {
    id: string
    question_text: string
    option_a: string
    option_b: string
    option_c: string
    option_d: string | null
    correct_answer: string
    category: string
    explanation: string
    reference?: string
    concept_id: string | null
    cognitive_level: string | null
    concepts: { name: string } | { name: string }[] | null
  }
}

function conceptName(q: SessionAnswer['questions']): string | null {
  if (!q.concepts) return null
  return Array.isArray(q.concepts) ? q.concepts[0]?.name ?? null : q.concepts.name
}

const ERROR_TAG_LABELS: Record<string, string> = {
  concept_gap: 'Concept gap',
  calculation_error: 'Calculation error',
  distractor_trap: 'Distractor trap',
  regulation_confusion: 'Regulation confusion',
  careless_error: 'Careless error',
  confidence_error: 'Overconfidence',
  figure_misread: 'Figure misread',
  misread_question: 'Misread the question',
  transfer_failure: 'Transfer failure',
}

interface ExamSession {
  id: string
  score: number
  total_questions: number
  completed_at: string
  started_at: string
}

type FilterTab = 'all' | 'missed' | 'marked'

export default function ExamResultsPage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<ExamSession | null>(null)
  const [answers, setAnswers] = useState<SessionAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [aiChat, setAiChat] = useState<{ answer: SessionAnswer } | null>(null)

  useEffect(() => {
    if (!sessionId) return
    fetchResults()
  }, [sessionId])

  async function fetchResults() {
    try {
      const res = await fetch(`/api/sessions/exam-results?sessionId=${sessionId}`)
      if (!res.ok) throw new Error('Failed to load results')
      const data = await res.json()
      setSession(data.session)
      setAnswers(data.answers ?? [])
    } catch (err) {
      setError('Could not load exam results.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#3E92CC] animate-spin" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="glass-card p-10 max-w-md text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Results Not Found</h2>
          <p className="text-white/50 text-sm mb-6">{error ?? 'This exam session could not be loaded.'}</p>
          <a href="/exam" className="btn-primary inline-flex px-6 py-2.5">← Back to Exams</a>
        </div>
      </div>
    )
  }

  const pct = Math.round((session.score / session.total_questions) * 100)
  const passed = pct >= 70

  const examDate = new Date(session.completed_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  // Category breakdown
  const categoryMap: Record<string, { correct: number; total: number }> = {}
  for (const ans of answers) {
    const cat = ans.questions?.category ?? 'Unknown'
    if (!categoryMap[cat]) categoryMap[cat] = { correct: 0, total: 0 }
    categoryMap[cat].total++
    if (ans.is_correct) categoryMap[cat].correct++
  }

  const missedCount = answers.filter(a => a.is_correct === false).length
  const markedCount = answers.filter(a => a.is_marked_for_review).length

  // Concept-level breakdown — only meaningful for validated-pipeline questions
  // (concept_id set); legacy bank questions have no concept to group by.
  const conceptMap: Record<string, { name: string; correct: number; total: number }> = {}
  for (const ans of answers) {
    const cid = ans.questions?.concept_id
    if (!cid) continue
    const name = conceptName(ans.questions) ?? 'Unknown concept'
    if (!conceptMap[cid]) conceptMap[cid] = { name, correct: 0, total: 0 }
    conceptMap[cid].total++
    if (ans.is_correct) conceptMap[cid].correct++
  }
  const conceptBreakdown = Object.values(conceptMap).sort((a, b) => (a.correct / a.total) - (b.correct / b.total))

  // Novel/transfer performance — transfer-level questions are novel-by-design (see
  // isQuestionNovelForUser's definition used elsewhere); this is the exam-mode analog
  // without the extra per-question DB checks that mode skips.
  const transferAnswers = answers.filter(a => a.questions?.cognitive_level === 'transfer')
  const transferCorrect = transferAnswers.filter(a => a.is_correct).length
  const transferPct = transferAnswers.length > 0 ? Math.round((transferCorrect / transferAnswers.length) * 100) : null

  // Error classification — only populated for practice-mode-style answers; exam mode
  // doesn't run classifyError today, so this will mostly be empty until that's added.
  const errorTagCounts: Record<string, number> = {}
  for (const ans of answers) {
    if (ans.error_tag) errorTagCounts[ans.error_tag] = (errorTagCounts[ans.error_tag] ?? 0) + 1
  }
  const topErrorTags = Object.entries(errorTagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const filtered = answers.filter(a => {
    if (filter === 'missed') return a.is_correct === false
    if (filter === 'marked') return a.is_marked_for_review
    return true
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <a href="/exam" className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Exams
        </a>
        <span className="text-white/40 text-sm">{examDate}</span>
      </div>

      {/* Score card */}
      <div className="glass-card p-8 text-center mb-6">
        <div className={`text-7xl font-bold mb-2 ${passed ? 'text-green-400' : 'text-red-400'}`}>
          {session.score}/{session.total_questions}
        </div>
        <div className={`text-2xl font-bold mb-1 ${passed ? 'text-green-400' : 'text-red-400'}`}>
          {passed ? '✓ PASSED' : '✗ FAILED'}
        </div>
        <div className="text-white/60 text-lg mb-3">{pct}%</div>
        <p className="text-white/70 text-sm max-w-sm mx-auto leading-relaxed">
          {pct >= 90
            ? "🏆 Exceptional score! You're ready for the real thing — go get that certificate!"
            : pct >= 80
            ? "🔥 Great work! You're in strong shape. Review the misses and you'll be unstoppable."
            : pct >= 70
            ? "✈️ You passed! Stay sharp on the weaker categories and you'll ace the real exam."
            : pct >= 60
            ? "💪 So close! You're almost there — a little more focused practice and you'll pass next time."
            : pct >= 50
            ? "📚 Good effort. Each exam is a learning opportunity — review the explanations and come back stronger."
            : "🛫 Don't get discouraged — every pilot was a student once. Study the explanations, use the AI Tutor, and try again!"}
        </p>
      </div>

      {/* Category breakdown */}
      <div className="glass-card p-6 mb-6">
        <h3 className="font-semibold text-white mb-4">Score by Category</h3>
        <div className="space-y-3">
          {Object.entries(categoryMap).map(([cat, scores]) => {
            const catPct = Math.round((scores.correct / scores.total) * 100)
            const color = catPct >= 80 ? '#22c55e' : catPct >= 60 ? '#FFB627' : '#ef4444'
            return (
              <div key={cat} className="flex items-center gap-3">
                <div className="w-40 text-xs text-white/60 truncate shrink-0">{cat}</div>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${catPct}%`, background: color }} />
                </div>
                <div className="text-sm text-white w-14 text-right shrink-0">{scores.correct}/{scores.total}</div>
              </div>
            )
          })}
        </div>
      </div>

      {(conceptBreakdown.length > 0 || transferPct != null || topErrorTags.length > 0) && (
        <div className="glass-card p-6 mb-6 space-y-5">
          {transferPct != null && (
            <div>
              <h3 className="font-semibold text-white mb-1">Novel Question Performance</h3>
              <p className="text-white/40 text-xs mb-2">Accuracy on transfer-level questions — ones designed to be unfamiliar, not just harder</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold" style={{ color: transferPct >= 70 ? '#22c55e' : transferPct >= 50 ? '#FFB627' : '#ef4444' }}>{transferPct}%</span>
                <span className="text-white/40 text-xs">{transferCorrect}/{transferAnswers.length} transfer questions</span>
              </div>
            </div>
          )}

          {conceptBreakdown.length > 0 && (
            <div>
              <h3 className="font-semibold text-white mb-3">Weakest Concepts</h3>
              <div className="space-y-2.5">
                {conceptBreakdown.slice(0, 5).map(c => {
                  const cpct = Math.round((c.correct / c.total) * 100)
                  const color = cpct >= 80 ? '#22c55e' : cpct >= 60 ? '#FFB627' : '#ef4444'
                  return (
                    <div key={c.name} className="flex items-center gap-3">
                      <div className="w-40 text-xs text-white/60 truncate shrink-0">{c.name}</div>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${cpct}%`, background: color }} />
                      </div>
                      <div className="text-sm text-white w-14 text-right shrink-0">{c.correct}/{c.total}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {topErrorTags.length > 0 && (
            <div>
              <h3 className="font-semibold text-white mb-2">Top Error Types</h3>
              <div className="flex flex-wrap gap-2">
                {topErrorTags.map(([tag, count]) => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                    {ERROR_TAG_LABELS[tag] ?? tag} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mb-6">
        <a href="/practice/weakness" className="btn-primary flex items-center gap-2 px-5 py-2.5">
          <BookOpen className="w-4 h-4" />
          Build My Remediation Plan
        </a>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4">
        {([
          { key: 'all' as FilterTab, label: `All (${answers.length})` },
          { key: 'missed' as FilterTab, label: `Missed (${missedCount})` },
          { key: 'marked' as FilterTab, label: `Marked (${markedCount})` },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === tab.key
                ? 'bg-[#3E92CC] text-white'
                : 'text-white/50 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="glass-card p-8 text-center">
            <p className="text-white/40 text-sm">No questions match this filter.</p>
          </div>
        )}
        {filtered.map(ans => {
          const q = ans.questions
          if (!q) return null
          const optVals: Record<string, string> = {
            A: q.option_a,
            B: q.option_b,
            C: q.option_c,
            ...(q.option_d ? { D: q.option_d } : {}),
          }
          return (
            <div key={ans.id} className="glass-card p-5">
              <div className="flex items-start gap-3 mb-3">
                {ans.is_correct
                  ? <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                }
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(62,146,204,0.15)', color: '#3E92CC' }}>
                      {q.category}
                    </span>
                  </div>
                  <p className="text-white text-sm leading-relaxed">{q.question_text}</p>
                </div>
              </div>

              <div className="ml-8 space-y-1 mb-3">
                {(Object.keys(optVals) as string[]).map(key => {
                  const isCorrect = key === q.correct_answer
                  const isUserWrong = key === ans.user_answer && !ans.is_correct
                  return (
                    <div
                      key={key}
                      className="text-sm px-3 py-1.5 rounded-lg flex items-center gap-2"
                      style={
                        isCorrect
                          ? { background: 'rgba(34,197,94,0.1)', color: '#22c55e' }
                          : isUserWrong
                          ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }
                          : { color: 'rgba(255,255,255,0.4)' }
                      }
                    >
                      <span className="font-semibold w-4 shrink-0">{key}.</span>
                      {optVals[key]}
                      {isCorrect && <span className="ml-auto text-xs opacity-70">✓ correct</span>}
                      {isUserWrong && <span className="ml-auto text-xs opacity-70">your answer</span>}
                    </div>
                  )
                })}
              </div>

              <div className="ml-8">
                <p className="text-white/50 text-xs mb-2 leading-relaxed">{q.explanation}</p>
                <button
                  onClick={() => setAiChat({ answer: ans })}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                  style={{ background: 'rgba(62,146,204,0.15)', color: '#3E92CC' }}
                >
                  Ask AI Tutor
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {aiChat && (
        <AIChat
          question={aiChat.answer.questions as unknown as Question}
          userAnswer={aiChat.answer.user_answer ?? aiChat.answer.questions.correct_answer}
          correctAnswer={aiChat.answer.questions.correct_answer}
          onClose={() => setAiChat(null)}
        />
      )}
    </div>
  )
}
