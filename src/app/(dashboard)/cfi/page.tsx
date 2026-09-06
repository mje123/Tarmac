'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HelpCircle, CheckCircle, ThumbsUp, Plus, X, Loader2, Send } from 'lucide-react'
import Link from 'next/link'

interface CfiQuestion {
  id: string
  user_id: string
  title: string
  body: string
  category: string | null
  upvote_count: number
  answer_count: number
  is_resolved: boolean
  created_at: string
}

const CATEGORIES = ['Regulations', 'Weather', 'Navigation', 'Airspace', 'Performance', 'Systems', 'Procedures', 'General']

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function CFIPage() {
  const [questions, setQuestions] = useState<CfiQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('General')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })
    loadQuestions()
  }, [])

  async function loadQuestions() {
    const supabase = createClient()
    const { data } = await supabase
      .from('cfi_questions')
      .select('*')
      .order('created_at', { ascending: false })
    setQuestions(data || [])
    setLoading(false)
  }

  async function submitQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/cfi/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, category }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      setTitle(''); setBody(''); setCategory('General'); setShowForm(false)
      await loadQuestions()
    } finally {
      setSubmitting(false)
    }
  }

  async function vote(questionId: string, e: React.MouseEvent) {
    e.preventDefault()
    const res = await fetch('/api/cfi/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: questionId, targetType: 'question' }),
    })
    const data = await res.json()
    if (data.voted) {
      setVotedIds(p => new Set([...p, questionId]))
      setQuestions(qs => qs.map(q => q.id === questionId ? { ...q, upvote_count: q.upvote_count + 1 } : q))
    } else {
      setVotedIds(p => { const n = new Set(p); n.delete(questionId); return n })
      setQuestions(qs => qs.map(q => q.id === questionId ? { ...q, upvote_count: Math.max(0, q.upvote_count - 1) } : q))
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded"
            style={{ background: 'rgba(46,204,113,0.15)', color: 'var(--cfi-accent)', border: '1px solid rgba(46,204,113,0.3)' }}>
            <HelpCircle style={{ width: '11px', height: '11px' }} />
            Ask a CFI
          </span>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ background: 'rgba(46,204,113,0.15)', color: 'var(--cfi-accent)', border: '1px solid rgba(46,204,113,0.3)' }}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Ask a Question'}
        </button>
      </div>

      {/* Ask form */}
      {showForm && (
        <form onSubmit={submitQuestion} className="rounded-xl p-5 mb-6" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
          <h2 className="text-sm font-bold text-white mb-4">Ask a question</h2>
          <div className="space-y-3">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What's your question? (keep it focused)"
              maxLength={200}
              required
              className="w-full text-sm"
            />
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Provide context — what did you try, what confused you, what scenario applies?"
              rows={4}
              maxLength={3000}
              required
              className="w-full resize-none text-sm"
            />
            <select value={category} onChange={e => setCategory(e.target.value)} className="text-sm">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          <button type="submit" disabled={submitting || !title.trim() || !body.trim()}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 transition-all"
            style={{ background: 'var(--cfi-accent)', color: 'white' }}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Question
          </button>
        </form>
      )}

      {/* Questions list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--surface-1)' }} />)}
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ border: '1px dashed var(--border-2)' }}>
          <HelpCircle className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-ter)' }} />
          <p className="text-sm font-medium text-white/60 mb-1">No questions yet</p>
          <p className="text-xs" style={{ color: 'var(--text-ter)' }}>Be the first to ask the community a question.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map(q => (
            <Link key={q.id} href={`/cfi/${q.id}`}
              className="block rounded-xl p-4 transition-all hover:border-white/15"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {q.category && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ background: 'rgba(46,204,113,0.1)', color: 'var(--cfi-accent)', border: '1px solid rgba(46,204,113,0.2)' }}>
                        {q.category}
                      </span>
                    )}
                    {q.is_resolved && (
                      <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ background: 'rgba(46,204,113,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                        <CheckCircle style={{ width: '10px', height: '10px' }} />
                        Answered
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1 leading-snug">{q.title}</h3>
                  <p className="text-xs line-clamp-2" style={{ color: 'var(--text-sec)' }}>{q.body}</p>
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-ter)' }}>
                    {q.answer_count} answer{q.answer_count !== 1 ? 's' : ''} · {relativeTime(q.created_at)}
                  </p>
                </div>
                <button
                  onClick={e => vote(q.id, e)}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors shrink-0"
                  style={{ color: votedIds.has(q.id) ? 'var(--cfi-accent)' : 'var(--text-ter)', background: 'var(--surface-2)' }}
                >
                  <ThumbsUp style={{ width: '13px', height: '13px' }} />
                  <span className="text-xs font-bold">{q.upvote_count}</span>
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
