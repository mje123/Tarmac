'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, ThumbsUp, Flag, Trash2, Archive, Send, Loader2, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Accident {
  id: string
  title: string
  summary: string
  prompt_one: string
  prompt_two: string
  phase_of_flight: string | null
  aircraft_type: string | null
  weather: string | null
  probable_cause: string | null
  region: string | null
  year: number | null
  ai_summary: string | null
  posted_at: string | null
}

interface Comment {
  id: string
  display_name: string
  body: string
  upvote_count: number
  created_at: string
  user_id: string
  is_anonymous: boolean
}

type SortMode = 'top' | 'recent'
const FLAG_REASONS = ['Inappropriate language', 'Off topic', 'Spam', 'Other']

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function DebriefDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [accident, setAccident] = useState<Accident | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [sort, setSort] = useState<SortMode>('top')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<{ id: string; callsign: string | null; debrief_anonymous: boolean } | null>(null)
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())
  const [flagTarget, setFlagTarget] = useState<string | null>(null)
  const [flagReason, setFlagReason] = useState('Inappropriate language')
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const loadComments = useCallback(async () => {
    if (!id) return
    const supabase = createClient()
    const { data } = await supabase
      .from('accident_comments')
      .select('*')
      .eq('accident_id', id)
      .eq('is_removed', false)
      .order(sort === 'top' ? 'upvote_count' : 'created_at', { ascending: false })
    setComments(data || [])
  }, [id, sort])

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    Promise.all([
      supabase.from('accidents').select('*').eq('id', id).single(),
      supabase.auth.getUser(),
    ]).then(async ([{ data: acc }, { data: { user } }]) => {
      setAccident(acc)
      if (user) {
        const { data: profile } = await supabase.from('users').select('callsign, debrief_anonymous').eq('id', user.id).single()
        setCurrentUser({ id: user.id, callsign: profile?.callsign || null, debrief_anonymous: profile?.debrief_anonymous || false })
      }
      setLoading(false)
    })
  }, [id])

  useEffect(() => { loadComments() }, [loadComments])

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/accidents/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accidentId: id, body }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to post'); return }
      setBody('')
      await loadComments()
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleVote(commentId: string) {
    const res = await fetch('/api/accidents/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId }),
    })
    const data = await res.json()
    if (data.voted) {
      setVotedIds(p => new Set([...p, commentId]))
      setComments(cs => cs.map(c => c.id === commentId ? { ...c, upvote_count: c.upvote_count + 1 } : c))
    } else {
      setVotedIds(p => { const n = new Set(p); n.delete(commentId); return n })
      setComments(cs => cs.map(c => c.id === commentId ? { ...c, upvote_count: Math.max(0, c.upvote_count - 1) } : c))
    }
  }

  async function submitFlag(commentId: string) {
    await fetch('/api/accidents/flag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, reason: flagReason }),
    })
    setFlaggedIds(p => new Set([...p, commentId]))
    setFlagTarget(null)
  }

  async function deleteComment(commentId: string) {
    await fetch('/api/accidents/comment', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId }),
    })
    setComments(cs => cs.filter(c => c.id !== commentId))
  }

  const previewName = currentUser?.debrief_anonymous
    ? 'Anonymous Pilot'
    : (currentUser?.callsign || 'Pilot')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
      </div>
    )
  }

  if (!accident) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="rounded-xl p-8 text-center" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
          <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--debrief-accent)' }} />
          <h2 className="text-lg font-bold text-white mb-2">Debrief Not Found</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-sec)' }}>This scenario may have been removed.</p>
          <Link href="/debrief/archive" className="text-sm font-semibold" style={{ color: 'var(--debrief-accent)' }}>
            Browse archive →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/debrief/archive" className="text-white/40 hover:text-white transition-colors mr-1">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded"
          style={{ background: 'rgba(232,89,60,0.15)', color: 'var(--debrief-accent)', border: '1px solid rgba(232,89,60,0.3)' }}>
          <AlertTriangle style={{ width: '11px', height: '11px' }} />
          Accident Debrief
        </span>
        <Link href="/debrief/archive"
          className="ml-auto flex items-center gap-1 text-xs transition-colors hover:text-white"
          style={{ color: 'var(--text-ter)' }}>
          <Archive style={{ width: '12px', height: '12px' }} />
          Archive
        </Link>
      </div>

      {/* Scenario card */}
      <div className="rounded-xl p-5 mb-5" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <h1 className="text-xl font-bold text-white mb-2 leading-snug">{accident.title}</h1>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-4" style={{ color: 'var(--text-ter)' }}>
          {accident.phase_of_flight && <span>{accident.phase_of_flight}</span>}
          {accident.aircraft_type && <span>·</span>}
          {accident.aircraft_type && <span>{accident.aircraft_type}</span>}
          {accident.region && <span>·</span>}
          {accident.region && <span>{accident.region}</span>}
          {accident.year && <span>·</span>}
          {accident.year && <span>{accident.year}</span>}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {accident.weather && (
            <span className="text-xs px-2 py-0.5 rounded"
              style={{ background: 'var(--surface-2)', color: 'var(--text-sec)', border: '1px solid var(--border-1)' }}>
              ☁ {accident.weather}
            </span>
          )}
        </div>

        <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-pri)' }}>{accident.summary}</p>

        {accident.probable_cause && (
          <div className="text-xs px-4 py-3 rounded-lg mb-5"
            style={{ background: 'rgba(232,89,60,0.08)', border: '1px solid rgba(232,89,60,0.2)', color: 'var(--text-sec)' }}>
            <span className="font-bold uppercase tracking-wide text-[10px] block mb-1" style={{ color: 'var(--debrief-accent)' }}>Probable Cause</span>
            {accident.probable_cause}
          </div>
        )}

        <div className="space-y-3">
          {[accident.prompt_one, accident.prompt_two].map((prompt, i) => (
            <div key={i} className="px-4 py-3 rounded-lg text-sm"
              style={{ borderLeft: '3px solid var(--debrief-accent)', background: 'rgba(232,89,60,0.06)', color: 'var(--text-pri)' }}>
              <span className="text-xs font-bold uppercase tracking-wide block mb-1" style={{ color: 'var(--debrief-accent)' }}>
                Consider this:
              </span>
              {prompt}
            </div>
          ))}
        </div>

        <p className="text-xs mt-4" style={{ color: 'var(--text-ter)' }}>
          Powered by NTSB data · Anonymized for educational discussion
        </p>
      </div>

      {/* AI Summary */}
      {accident.ai_summary && (
        <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--sky)' }}>Community Takeaways</span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(62,146,204,0.1)', color: 'var(--text-ter)', border: '1px solid rgba(62,146,204,0.2)' }}>
              Summarized by AI
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-sec)' }}>{accident.ai_summary}</p>
        </div>
      )}

      {/* Comment composer */}
      <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <h2 className="text-sm font-bold text-white mb-3">Add to the debrief</h2>
        <form onSubmit={submitComment} className="space-y-3">
          <div className="relative">
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="What's your read on this? What would you have done differently?"
              rows={4}
              maxLength={1000}
              className="w-full resize-none text-sm pr-16"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '10px', padding: '12px', color: 'white' }}
            />
            <span className="absolute bottom-3 right-3 text-xs" style={{ color: body.length > 900 ? '#ef4444' : 'var(--text-ter)' }}>
              {body.length}/1000
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-ter)' }}>
              Posting as: <span className="font-medium text-white/70">{previewName}</span>
              {!currentUser?.debrief_anonymous && !currentUser?.callsign && (
                <Link href="/settings" className="ml-2 text-[#3E92CC] hover:underline">Set callsign →</Link>
              )}
            </span>
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ background: 'var(--debrief-accent)', color: 'white' }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </form>
      </div>

      {/* Thread */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white">{comments.length} response{comments.length !== 1 ? 's' : ''}</h2>
          <div className="flex gap-1">
            {(['top', 'recent'] as SortMode[]).map(s => (
              <button key={s} onClick={() => setSort(s)}
                className="px-3 py-1 rounded text-xs font-medium transition-all capitalize"
                style={sort === s
                  ? { background: 'var(--surface-3)', color: 'white' }
                  : { background: 'transparent', color: 'var(--text-ter)' }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {comments.length === 0 && (
          <div className="rounded-xl p-8 text-center" style={{ border: '1px dashed var(--border-2)' }}>
            <p className="text-sm" style={{ color: 'var(--text-ter)' }}>No responses yet. Be the first to weigh in.</p>
          </div>
        )}

        <div className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-sm font-bold text-white">{c.display_name}</span>
                  <span className="text-xs ml-2" style={{ color: 'var(--text-ter)' }}>{relativeTime(c.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleVote(c.id)}
                    className="flex items-center gap-1 text-xs transition-colors hover:text-white"
                    style={{ color: votedIds.has(c.id) ? 'var(--sky)' : 'var(--text-ter)' }}
                  >
                    <ThumbsUp style={{ width: '13px', height: '13px' }} />
                    {c.upvote_count}
                  </button>
                  {currentUser?.id === c.user_id ? (
                    <button onClick={() => deleteComment(c.id)} className="text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 style={{ width: '13px', height: '13px' }} />
                    </button>
                  ) : (
                    <div className="relative">
                      <button
                        onClick={() => setFlagTarget(flagTarget === c.id ? null : c.id)}
                        className="transition-colors hover:text-red-400"
                        style={{ color: flaggedIds.has(c.id) ? 'var(--debrief-accent)' : 'var(--text-ter)' }}
                        title={flaggedIds.has(c.id) ? 'Reported' : 'Flag comment'}
                      >
                        <Flag style={{ width: '13px', height: '13px' }} />
                      </button>
                      {flagTarget === c.id && !flaggedIds.has(c.id) && (
                        <div className="absolute right-0 top-6 z-20 w-48 rounded-xl p-3 shadow-xl"
                          style={{ background: '#0d1f4a', border: '1px solid rgba(255,255,255,0.12)' }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white">Report reason</span>
                            <button onClick={() => setFlagTarget(null)}><X style={{ width: '12px', height: '12px', color: 'var(--text-ter)' }} /></button>
                          </div>
                          <div className="space-y-1 mb-2">
                            {FLAG_REASONS.map(r => (
                              <button key={r} onClick={() => setFlagReason(r)}
                                className="w-full text-left text-xs px-2 py-1 rounded transition-colors hover:bg-white/10"
                                style={{ color: flagReason === r ? 'white' : 'var(--text-sec)', background: flagReason === r ? 'var(--surface-2)' : 'transparent' }}>
                                {r}
                              </button>
                            ))}
                          </div>
                          <button onClick={() => submitFlag(c.id)}
                            className="w-full py-1.5 rounded text-xs font-bold transition-all"
                            style={{ background: 'rgba(232,89,60,0.2)', color: 'var(--debrief-accent)', border: '1px solid rgba(232,89,60,0.3)' }}>
                            Submit report
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-pri)' }}>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
