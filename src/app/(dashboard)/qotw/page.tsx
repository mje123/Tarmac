'use client'

import { useEffect, useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { ResponseCard, type ResponseItem } from '@/components/ui/CommunityCard'

interface QotwPost {
  id: string
  question_text: string
  question_type: 'situation' | 'checkride' | 'written'
  context: string | null
  week_start: string
}

type PageState = 'loading' | 'compose' | 'feed' | 'error'

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  situation: { label: 'Situation',  color: '#3E92CC', bg: 'rgba(62,146,204,0.15)' },
  checkride: { label: 'Checkride',  color: '#FFB627', bg: 'rgba(255,182,39,0.15)' },
  written:   { label: 'Written',    color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
}

function formatWeekRange(weekStart: string, weekEnd: string) {
  const s = new Date(weekStart + 'T00:00:00Z')
  const e = new Date(weekEnd + 'T00:00:00Z')
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`
}

export default function QOTWPage() {
  const [state, setState] = useState<PageState>('loading')
  const [post, setPost] = useState<QotwPost | null>(null)
  const [weekEnd, setWeekEnd] = useState('')
  const [responses, setResponses] = useState<ResponseItem[]>([])
  const [responseText, setResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isAuto, setIsAuto] = useState(false)
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    async function init() {
      const postRes = await fetch('/api/qotw')
      if (!postRes.ok) { setState('error'); return }
      const postData = await postRes.json()
      setPost(postData.post)
      setWeekEnd(postData.weekEnd)
      setIsAuto(postData.auto)

      const rRes = await fetch(`/api/qotw/responses?postId=${postData.post.id}`)
      if (!rRes.ok) { setState('error'); return }
      const rData = await rRes.json()
      const myResponse = (rData.responses || []).find((r: ResponseItem) => r.is_mine)
      setResponses(rData.responses || [])
      setState(myResponse ? 'feed' : 'compose')
    }
    init()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!post || !responseText.trim()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/qotw/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, responseText }),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError(data.error || 'Failed to submit'); return }

      const realId = data.realPostId || post.id
      const rRes = await fetch(`/api/qotw/responses?postId=${realId}`)
      const rData = await rRes.json()
      setResponses(rData.responses || [])
      setState('feed')
    } finally { setSubmitting(false) }
  }

  function handleLike(responseId: string) {
    setResponses(prev => prev.map(r => r.id !== responseId ? r : {
      ...r, liked_by_me: !r.liked_by_me, like_count: r.like_count + (r.liked_by_me ? -1 : 1),
    }))
    fetch(`/api/qotw/responses/${responseId}/like`, { method: 'POST' }).catch(() => {
      setResponses(prev => prev.map(r => r.id !== responseId ? r : {
        ...r, liked_by_me: !r.liked_by_me, like_count: r.like_count + (r.liked_by_me ? -1 : 1),
      }))
    })
  }

  const typeInfo = post ? (TYPE_LABELS[post.question_type] ?? TYPE_LABELS.situation) : TYPE_LABELS.situation

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black text-[#FFB627] uppercase tracking-widest">Community</span>
          {isAuto && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>Auto</span>}
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>Weekly Challenge</h1>
        <p className="text-white/40 text-sm mt-1">
          {post && weekEnd ? formatWeekRange(post.week_start, weekEnd) : '—'} · Deep scenario · Responses open all week
        </p>
      </div>

      {state === 'loading' && (
        <div className="flex items-center gap-3 py-16 justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#FFB627]" />
          <span className="text-white/40 text-sm">Loading this week&apos;s challenge…</span>
        </div>
      )}

      {state === 'error' && (
        <div className="glass-card p-8 text-center">
          <p className="text-white/50">Couldn&apos;t load this week&apos;s challenge. Try refreshing.</p>
        </div>
      )}

      {(state === 'compose' || state === 'feed') && post && (
        <>
          {/* Question card */}
          <div className="glass-card p-6 mb-5" style={{ border: '1px solid rgba(255,182,39,0.2)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-white/35 uppercase tracking-widest">
                {post.week_start && weekEnd ? formatWeekRange(post.week_start, weekEnd) : ''}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: typeInfo.bg, color: typeInfo.color, border: `1px solid ${typeInfo.color}33` }}>
                {typeInfo.label}
              </span>
            </div>
            {post.context && (
              <div
                className="text-sm leading-relaxed mb-4 p-4 rounded-xl"
                style={{ background: 'rgba(255,182,39,0.05)', border: '1px solid rgba(255,182,39,0.15)', color: 'rgba(255,255,255,0.65)' }}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FFB627] mb-2">Scenario</p>
                {post.context}
              </div>
            )}
            <p className="text-white font-bold text-lg leading-snug">{post.question_text}</p>
          </div>

          {/* Compose form */}
          {state === 'compose' && (
            <div className="glass-card p-6 mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">Your response</p>
                <p className="text-xs text-white/30">This is a deep question — take your time</p>
              </div>
              <form onSubmit={submit} className="flex flex-col gap-3">
                <textarea
                  value={responseText}
                  onChange={e => { setResponseText(e.target.value); setCharCount(e.target.value.length) }}
                  placeholder="Walk through your full thought process. What would you do and why? Be specific — explain priorities, communication, aircraft control, and contingencies."
                  rows={8}
                  maxLength={4000}
                  className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed resize-none outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-white/30">Anonymous · {charCount}/4000</p>
                  <button
                    type="submit"
                    disabled={submitting || responseText.trim().length < 20}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
                    style={{ background: '#FFB627', color: '#0a1530' }}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit
                  </button>
                </div>
                {submitError && <p className="text-xs text-red-400">{submitError}</p>}
              </form>
            </div>
          )}

          {/* Community feed */}
          {state === 'feed' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">
                  {responses.length} {responses.length === 1 ? 'response' : 'responses'} this week
                </p>
                <p className="text-xs text-white/30">All anonymous</p>
              </div>
              <div className="space-y-3">
                {responses.length === 0 ? (
                  <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-sm text-white/40">You&apos;re the first to respond this week. Come back to see what other pilots say.</p>
                  </div>
                ) : (
                  responses.map(r => (
                    <ResponseCard key={r.id} response={r} commentApiBase="/api/qotw/responses" onLike={handleLike} />
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
