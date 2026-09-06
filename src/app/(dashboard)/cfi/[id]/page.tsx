'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HelpCircle, CheckCircle, ThumbsUp, ArrowLeft, Loader2, Send, BadgeCheck } from 'lucide-react'
import Link from 'next/link'

interface CfiQuestion {
  id: string; user_id: string; title: string; body: string
  category: string | null; upvote_count: number; answer_count: number; is_resolved: boolean; created_at: string
}
interface CfiAnswer {
  id: string; user_id: string; body: string; is_cfi_answer: boolean
  upvote_count: number; is_accepted: boolean; created_at: string
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function CFIQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [question, setQuestion] = useState<CfiQuestion | null>(null)
  const [answers, setAnswers] = useState<CfiAnswer[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [answerBody, setAnswerBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => { if (user) setCurrentUserId(user.id) })
    loadData()
  }, [id])

  async function loadData() {
    const supabase = createClient()
    const [{ data: q }, { data: a }] = await Promise.all([
      supabase.from('cfi_questions').select('*').eq('id', id).single(),
      supabase.from('cfi_answers').select('*').eq('question_id', id).order('is_accepted', { ascending: false }).order('upvote_count', { ascending: false }),
    ])
    setQuestion(q)
    setAnswers(a || [])
    setLoading(false)
  }

  async function submitAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!answerBody.trim()) return
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/cfi/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: id, body: answerBody }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      setAnswerBody('')
      await loadData()
    } finally { setSubmitting(false) }
  }

  async function voteAnswer(answerId: string) {
    const res = await fetch('/api/cfi/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: answerId, targetType: 'answer' }),
    })
    const data = await res.json()
    if (data.voted) {
      setVotedIds(p => new Set([...p, answerId]))
      setAnswers(as => as.map(a => a.id === answerId ? { ...a, upvote_count: a.upvote_count + 1 } : a))
    } else {
      setVotedIds(p => { const n = new Set(p); n.delete(answerId); return n })
      setAnswers(as => as.map(a => a.id === answerId ? { ...a, upvote_count: Math.max(0, a.upvote_count - 1) } : a))
    }
  }

  async function acceptAnswer(answerId: string) {
    await fetch('/api/cfi/answers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answerId, questionId: id }),
    })
    await loadData()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
  if (!question) return <div className="p-6 text-center text-white/40">Question not found.</div>

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/cfi" className="text-white/40 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded"
          style={{ background: 'rgba(46,204,113,0.15)', color: 'var(--cfi-accent)', border: '1px solid rgba(46,204,113,0.3)' }}>
          <HelpCircle style={{ width: '11px', height: '11px' }} />
          Ask a CFI
        </span>
      </div>

      {/* Question */}
      <div className="rounded-xl p-5 mb-5" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {question.category && (
            <span className="text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ background: 'rgba(46,204,113,0.1)', color: 'var(--cfi-accent)', border: '1px solid rgba(46,204,113,0.2)' }}>
              {question.category}
            </span>
          )}
          {question.is_resolved && (
            <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
              <CheckCircle style={{ width: '10px', height: '10px' }} /> Answered
            </span>
          )}
          <span className="text-xs ml-auto" style={{ color: 'var(--text-ter)' }}>{relativeTime(question.created_at)}</span>
        </div>
        <h1 className="text-lg font-bold text-white mb-3 leading-snug">{question.title}</h1>
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-pri)' }}>{question.body}</p>
      </div>

      {/* Answers */}
      <h2 className="text-sm font-bold text-white mb-3">{answers.length} answer{answers.length !== 1 ? 's' : ''}</h2>
      <div className="space-y-3 mb-5">
        {answers.map(a => (
          <div key={a.id} className="rounded-xl p-4"
            style={{
              background: a.is_accepted ? 'rgba(34,197,94,0.05)' : 'var(--surface-1)',
              border: `1px solid ${a.is_accepted ? 'rgba(34,197,94,0.3)' : 'var(--border-1)'}`,
            }}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {a.is_cfi_answer && (
                    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-bold"
                      style={{ background: 'rgba(62,146,204,0.15)', color: 'var(--sky)', border: '1px solid rgba(62,146,204,0.3)' }}>
                      <BadgeCheck style={{ width: '10px', height: '10px' }} /> CFI
                    </span>
                  )}
                  {a.is_accepted && (
                    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                      <CheckCircle style={{ width: '10px', height: '10px' }} /> Accepted Answer
                    </span>
                  )}
                  <span className="text-xs ml-auto" style={{ color: 'var(--text-ter)' }}>{relativeTime(a.created_at)}</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-pri)' }}>{a.body}</p>
                <div className="flex items-center gap-3 mt-3">
                  <button onClick={() => voteAnswer(a.id)}
                    className="flex items-center gap-1 text-xs transition-colors"
                    style={{ color: votedIds.has(a.id) ? 'var(--cfi-accent)' : 'var(--text-ter)' }}>
                    <ThumbsUp style={{ width: '13px', height: '13px' }} /> {a.upvote_count}
                  </button>
                  {currentUserId === question.user_id && !a.is_accepted && (
                    <button onClick={() => acceptAnswer(a.id)}
                      className="text-xs font-medium transition-colors hover:text-green-400"
                      style={{ color: 'var(--text-ter)' }}>
                      Accept answer
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {answers.length === 0 && (
          <div className="rounded-xl p-8 text-center" style={{ border: '1px dashed var(--border-2)' }}>
            <p className="text-sm" style={{ color: 'var(--text-ter)' }}>No answers yet. Know the answer? Help this pilot out.</p>
          </div>
        )}
      </div>

      {/* Answer form */}
      <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <h3 className="text-sm font-bold text-white mb-3">Your answer</h3>
        <form onSubmit={submitAnswer} className="space-y-3">
          <textarea
            value={answerBody}
            onChange={e => setAnswerBody(e.target.value)}
            placeholder="Share your knowledge. Be specific, cite regulations or AIM where applicable."
            rows={5}
            maxLength={5000}
            className="w-full resize-none text-sm"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={submitting || !answerBody.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 transition-all"
            style={{ background: 'var(--cfi-accent)', color: 'white' }}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Post Answer
          </button>
        </form>
      </div>
    </div>
  )
}
