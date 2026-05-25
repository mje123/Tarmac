'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Send, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

export interface ResponseItem {
  id: string
  response_text: string
  like_count: number
  comment_count: number
  liked_by_me: boolean
  is_mine: boolean
  callsign: string
  created_at: string
}

export interface CommentItem {
  id: string
  comment_text: string
  callsign: string
  is_mine: boolean
  created_at: string
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function ResponseCard({
  response,
  commentApiBase,
  onLike,
}: {
  response: ResponseItem
  commentApiBase: string
  onLike: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)

  async function loadComments() {
    if (commentsLoaded) return
    const res = await fetch(`${commentApiBase}/${response.id}/comment`)
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
      const res = await fetch(`${commentApiBase}/${response.id}/comment`, {
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
          ? 'linear-gradient(160deg, rgba(62,146,204,0.1) 0%, rgba(62,146,204,0.04) 100%)'
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${response.is_mine ? 'rgba(62,146,204,0.25)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
            {response.callsign}
          </span>
          {response.is_mine && <span className="text-xs font-semibold text-[#3E92CC]">you</span>}
        </div>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{timeAgo(response.created_at)}</span>
      </div>

      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>{response.response_text}</p>

      <div className="flex items-center gap-4">
        <button
          onClick={() => onLike(response.id)}
          className="flex items-center gap-1.5 text-xs transition-all"
          style={{ color: response.liked_by_me ? '#f87171' : 'rgba(255,255,255,0.35)' }}
        >
          <Heart className="w-3.5 h-3.5" fill={response.liked_by_me ? '#f87171' : 'none'} />
          <span>{response.like_count}</span>
        </button>

        <button
          onClick={toggleComments}
          className="flex items-center gap-1.5 text-xs transition-all"
          style={{ color: expanded ? '#3E92CC' : 'rgba(255,255,255,0.35)' }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{response.comment_count}</span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {!commentsLoaded ? (
            <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} /></div>
          ) : (
            <>
              {comments.map(c => (
                <div key={c.id} className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold tracking-wide" style={{ color: c.is_mine ? '#3E92CC' : 'rgba(255,255,255,0.35)' }}>
                    {c.callsign}{c.is_mine ? ' · you' : ''}
                  </span>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{c.comment_text}</p>
                </div>
              ))}
              <form onSubmit={submitComment} className="flex gap-2 mt-1">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment…"
                  maxLength={500}
                  className="flex-1 text-xs rounded-lg px-3 py-2 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                />
                <button
                  type="submit"
                  disabled={posting || !commentText.trim()}
                  className="px-3 py-2 rounded-lg transition-all disabled:opacity-40"
                  style={{ background: '#3E92CC' }}
                >
                  {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Send className="w-3.5 h-3.5 text-white" />}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}
