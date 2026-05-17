'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Plane, Heart, MessageCircle, Send, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface QotdPost {
  id: string
  question_text: string
  question_type: 'situation' | 'checkride' | 'written'
  context: string | null
  active_date: string
}

interface QotdResponse {
  id: string
  response_text: string
  like_count: number
  comment_count: number
  liked_by_me: boolean
  is_mine: boolean
  callsign: string
  created_at: string
}

interface Comment {
  id: string
  comment_text: string
  callsign: string
  is_mine: boolean
  created_at: string
}

type PageState = 'loading' | 'no-post' | 'needs-login' | 'compose' | 'feed'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  situation: { label: 'Situation',  color: '#3E92CC', bg: 'rgba(62,146,204,0.15)' },
  checkride: { label: 'Checkride',  color: '#FFB627', bg: 'rgba(255,182,39,0.15)' },
  written:   { label: 'Written',    color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ResponseCard({
  response,
  onLike,
}: {
  response: QotdResponse
  onLike: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)

  async function loadComments() {
    if (commentsLoaded) return
    const res = await fetch(`/api/qotd/responses/${response.id}/comment`)
    const data = await res.json()
    setComments(data.comments || [])
    setCommentsLoaded(true)
  }

  function toggleComments() {
    const next = !expanded
    setExpanded(next)
    if (next) loadComments()
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    setPosting(true)
    try {
      const res = await fetch(`/api/qotd/responses/${response.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentText }),
      })
      const data = await res.json()
      if (res.ok) {
        setComments(prev => [...prev, data.comment])
        setCommentText('')
      }
    } finally { setPosting(false) }
  }

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{
        background: response.is_mine
          ? 'linear-gradient(160deg, rgba(62,146,204,0.1) 0%, rgba(62,146,204,0.05) 100%)'
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${response.is_mine ? 'rgba(62,146,204,0.25)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full tracking-wide"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
          >
            {response.callsign}
          </span>
          {response.is_mine && (
            <span className="text-xs font-semibold" style={{ color: '#3E92CC' }}>you</span>
          )}
        </div>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{timeAgo(response.created_at)}</span>
      </div>

      {/* Response text */}
      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
        {response.response_text}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onLike(response.id)}
          className="flex items-center gap-1.5 text-xs transition-all"
          style={{ color: response.liked_by_me ? '#f87171' : 'rgba(255,255,255,0.35)' }}
        >
          <Heart
            className="w-3.5 h-3.5"
            fill={response.liked_by_me ? '#f87171' : 'none'}
          />
          <span>{response.like_count}</span>
        </button>

        <button
          onClick={toggleComments}
          className="flex items-center gap-1.5 text-xs transition-all"
          style={{ color: expanded ? '#3E92CC' : 'rgba(255,255,255,0.35)' }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{response.comment_count + comments.filter(c => !commentsLoaded).length}</span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Comments section */}
      {expanded && (
        <div className="flex flex-col gap-2 pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {!commentsLoaded ? (
            <div className="flex justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </div>
          ) : (
            <>
              {comments.map(c => (
                <div key={c.id} className="flex flex-col gap-0.5">
                  <span
                    className="text-[10px] font-bold tracking-wide"
                    style={{ color: c.is_mine ? '#3E92CC' : 'rgba(255,255,255,0.35)' }}
                  >
                    {c.callsign}{c.is_mine ? ' · you' : ''}
                  </span>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {c.comment_text}
                  </p>
                </div>
              ))}

              <form onSubmit={submitComment} className="flex gap-2 mt-1">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment…"
                  maxLength={500}
                  className="flex-1 text-xs rounded-lg px-3 py-2 outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                  }}
                />
                <button
                  type="submit"
                  disabled={posting || !commentText.trim()}
                  className="px-3 py-2 rounded-lg transition-all disabled:opacity-40"
                  style={{ background: '#3E92CC' }}
                >
                  {posting
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    : <Send className="w-3.5 h-3.5 text-white" />
                  }
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QOTDPage() {
  const [pageState, setPageState] = useState<PageState>('loading')
  const [post, setPost] = useState<QotdPost | null>(null)
  const [date, setDate] = useState('')
  const [responses, setResponses] = useState<QotdResponse[]>([])
  const [responseText, setResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [loadingResponses, setLoadingResponses] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function init() {
      // Fetch today's post
      const postRes = await fetch('/api/qotd')
      const postData = await postRes.json()

      if (!postData.post) {
        setPageState('no-post')
        return
      }

      setPost(postData.post)
      setDate(postData.date)

      // Check auth + whether already responded
      const meRes = await fetch('/api/user/subscription')
      if (!meRes.ok) {
        setPageState('needs-login')
        return
      }

      // Try loading responses — 401 = not logged in
      const rRes = await fetch(`/api/qotd/responses?postId=${postData.post.id}`)
      if (!rRes.ok) {
        setPageState('needs-login')
        return
      }
      const rData = await rRes.json()
      const myResponse = (rData.responses || []).find((r: QotdResponse) => r.is_mine)

      if (myResponse) {
        setResponses(rData.responses || [])
        setPageState('feed')
      } else {
        setPageState('compose')
      }
    }
    init()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!post || !responseText.trim()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/qotd/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, responseText }),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError(data.error || 'Failed to submit'); return }

      // Load responses now
      setLoadingResponses(true)
      const rRes = await fetch(`/api/qotd/responses?postId=${post.id}`)
      const rData = await rRes.json()
      setResponses(rData.responses || [])
      setPageState('feed')
    } finally {
      setSubmitting(false)
      setLoadingResponses(false)
    }
  }

  function handleLike(responseId: string) {
    // Optimistic update
    setResponses(prev => prev.map(r => {
      if (r.id !== responseId) return r
      const liked = !r.liked_by_me
      return { ...r, liked_by_me: liked, like_count: r.like_count + (liked ? 1 : -1) }
    }))
    fetch(`/api/qotd/responses/${responseId}/like`, { method: 'POST' })
      .then(r => r.json())
      .catch(() => {
        // Revert on failure
        setResponses(prev => prev.map(r => {
          if (r.id !== responseId) return r
          const liked = !r.liked_by_me
          return { ...r, liked_by_me: liked, like_count: r.like_count + (liked ? 1 : -1) }
        }))
      })
  }

  const typeInfo = post ? TYPE_LABELS[post.question_type] || TYPE_LABELS.situation : TYPE_LABELS.situation

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #06101e 0%, #0a1630 100%)' }}
    >
      {/* Header */}
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3E92CC, #0A2463)' }}
          >
            <Plane className="w-4 h-4 text-white -rotate-45" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">TARMAC</span>
        </Link>
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#FFB627' }}>
          Question of the Day
        </span>
      </div>

      {/* Loading */}
      {pageState === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-24">
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#3E92CC' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading…</p>
        </div>
      )}

      {/* No post today */}
      {pageState === 'no-post' && (
        <div
          className="w-full max-w-2xl rounded-2xl p-10 text-center"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <p className="text-white font-semibold mb-2">No question posted yet today</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Check back soon — follow on Instagram for the daily drop.</p>
        </div>
      )}

      {/* Needs login */}
      {pageState === 'needs-login' && post && (
        <>
          <QuestionCard post={post} date={date} typeInfo={typeInfo} />
          <div
            className="w-full max-w-2xl mt-4 rounded-2xl px-6 py-6 text-center flex flex-col items-center gap-4"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <p className="text-white font-semibold">Sign in to answer and see what other pilots said</p>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: '#FFB627', color: '#0a1530' }}
              >
                Start Free Trial
              </Link>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Use code <span className="font-bold" style={{ color: '#FFB627' }}>HALF</span> for 50% off
            </p>
          </div>
        </>
      )}

      {/* Compose response */}
      {pageState === 'compose' && post && (
        <>
          <QuestionCard post={post} date={date} typeInfo={typeInfo} />

          <div
            className="w-full max-w-2xl mt-4 rounded-2xl p-6"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <p className="text-sm font-semibold text-white mb-3">Your answer</p>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <textarea
                ref={textareaRef}
                value={responseText}
                onChange={e => setResponseText(e.target.value)}
                placeholder="Write your response here… be specific. Explain your reasoning like you're talking to your DPE."
                rows={5}
                maxLength={2000}
                className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed resize-none outline-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                }}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Posted anonymously · {responseText.length}/2000
                </p>
                <button
                  type="submit"
                  disabled={submitting || responseText.trim().length < 10}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: '#3E92CC', color: 'white' }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit
                </button>
              </div>
              {submitError && (
                <p className="text-xs" style={{ color: '#f87171' }}>{submitError}</p>
              )}
            </form>
          </div>
        </>
      )}

      {/* Community feed */}
      {pageState === 'feed' && post && (
        <>
          <QuestionCard post={post} date={date} typeInfo={typeInfo} />

          <div className="w-full max-w-2xl mt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                {responses.length} {responses.length === 1 ? 'response' : 'responses'}
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>All anonymous</p>
            </div>

            {loadingResponses ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#3E92CC' }} />
              </div>
            ) : responses.length === 0 ? (
              <div
                className="rounded-xl p-8 text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  You&apos;re the first to answer today. Check back later to see what others said.
                </p>
              </div>
            ) : (
              responses.map(r => (
                <ResponseCard key={r.id} response={r} onLike={handleLike} />
              ))
            )}
          </div>
        </>
      )}

      {/* Footer CTA */}
      {(pageState === 'compose' || pageState === 'feed') && (
        <div
          className="w-full max-w-2xl mt-8 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(255,182,39,0.08) 0%, rgba(62,146,204,0.08) 100%)',
            border: '1px solid rgba(255,182,39,0.15)',
          }}
        >
          <div className="flex-1 text-center sm:text-left">
            <p className="text-white font-semibold text-sm">Practice all 1,400+ FAA questions</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              AI explanations · full exams · progress tracking — use code{' '}
              <span className="font-bold" style={{ color: '#FFB627' }}>HALF</span> for 50% off
            </p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all"
            style={{ background: '#FFB627', color: '#0a1530' }}
          >
            Start Free Trial
          </Link>
        </div>
      )}

      <p className="mt-8 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
        tarmac.study · FAA Private Pilot Exam Prep
      </p>
    </div>
  )
}

// ─── Question display card ────────────────────────────────────────────────────

function QuestionCard({
  post, date, typeInfo,
}: {
  post: QotdPost
  date: string
  typeInfo: { label: string; color: string; bg: string }
}) {
  return (
    <div
      className="w-full max-w-2xl rounded-2xl p-6 sm:p-8 flex flex-col gap-5"
      style={{
        background: 'linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* Meta row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{formatDate(date)}</span>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: typeInfo.bg, color: typeInfo.color, border: `1px solid ${typeInfo.color}33` }}
        >
          {typeInfo.label}
        </span>
      </div>

      {/* Optional context/scenario */}
      {post.context && (
        <div
          className="rounded-xl px-4 py-3 text-sm leading-relaxed"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          {post.context}
        </div>
      )}

      {/* Question */}
      <p className="text-white font-semibold text-lg leading-snug">{post.question_text}</p>
    </div>
  )
}
