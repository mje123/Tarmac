'use client'

import { useEffect, useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { ResponseCard, type ResponseItem } from '@/components/ui/CommunityCard'

interface QotdPost {
  id: string
  question_text: string
  question_type: 'situation' | 'checkride' | 'written'
  context: string | null
  active_date: string
}

type PageState = 'loading' | 'compose' | 'feed' | 'error'

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  situation: { label: 'Situation',  color: '#3E92CC', bg: 'rgba(62,146,204,0.15)' },
  checkride: { label: 'Checkride',  color: '#FFB627', bg: 'rgba(255,182,39,0.15)' },
  written:   { label: 'Written',    color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function QOTDPage() {
  const [state, setState] = useState<PageState>('loading')
  const [post, setPost] = useState<QotdPost | null>(null)
  const [responses, setResponses] = useState<ResponseItem[]>([])
  const [responseText, setResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isAuto, setIsAuto] = useState(false)

  useEffect(() => {
    async function init() {
      const postRes = await fetch('/api/qotd')
      if (!postRes.ok) { setState('error'); return }
      const postData = await postRes.json()
      setPost(postData.post)
      setIsAuto(postData.auto)

      const rRes = await fetch(`/api/qotd/responses?postId=${postData.post.id}`)
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
      const res = await fetch('/api/qotd/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, responseText }),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError(data.error || 'Failed to submit'); return }

      // If auto post, update postId to the real DB id
      const realId = data.realPostId || post.id
      const rRes = await fetch(`/api/qotd/responses?postId=${realId}`)
      const rData = await rRes.json()
      setResponses(rData.responses || [])
      setState('feed')
    } finally { setSubmitting(false) }
  }

  function handleLike(responseId: string) {
    setResponses(prev => prev.map(r => r.id !== responseId ? r : {
      ...r, liked_by_me: !r.liked_by_me, like_count: r.like_count + (r.liked_by_me ? -1 : 1),
    }))
    fetch(`/api/qotd/responses/${responseId}/like`, { method: 'POST' }).catch(() => {
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
          <span className="text-[10px] font-black text-[#3E92CC] uppercase tracking-widest">Community</span>
          {isAuto && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>Auto</span>}
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>Question of the Day</h1>
        <p className="text-white/40 text-sm mt-1">
          {post ? formatDate(post.active_date) : '—'} · Anonymous responses · New question every day
        </p>
      </div>

      {state === 'loading' && (
        <div className="flex items-center gap-3 py-16 justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#3E92CC]" />
          <span className="text-white/40 text-sm">Loading today&apos;s question…</span>
        </div>
      )}

      {state === 'error' && (
        <div className="glass-card p-8 text-center">
          <p className="text-white/50">Couldn&apos;t load today&apos;s question. Try refreshing.</p>
        </div>
      )}

      {(state === 'compose' || state === 'feed') && post && (
        <>
          {/* Question card */}
          <div className="glass-card p-6 mb-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-white/35 uppercase tracking-widest">{formatDate(post.active_date)}</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: typeInfo.bg, color: typeInfo.color, border: `1px solid ${typeInfo.color}33` }}>
                {typeInfo.label}
              </span>
            </div>
            {post.context && (
              <div className="text-sm leading-relaxed mb-4 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}>
                {post.context}
              </div>
            )}
            <p className="text-white font-semibold text-lg leading-snug">{post.question_text}</p>
          </div>

          {/* Compose form */}
          {state === 'compose' && (
            <div className="glass-card p-6 mb-5">
              <p className="text-sm font-semibold text-white mb-3">Your answer</p>
              <form onSubmit={submit} className="flex flex-col gap-3">
                <textarea
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  placeholder="Write your response… explain your reasoning like you're talking to your DPE."
                  rows={5}
                  maxLength={2000}
                  className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed resize-none outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-white/30">Posted anonymously · {responseText.length}/2000</p>
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
                {submitError && <p className="text-xs text-red-400">{submitError}</p>}
              </form>
            </div>
          )}

          {/* Community feed */}
          {state === 'feed' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">
                  {responses.length} {responses.length === 1 ? 'response' : 'responses'} today
                </p>
                <p className="text-xs text-white/30">All anonymous</p>
              </div>
              <div className="space-y-3">
                {responses.length === 0 ? (
                  <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-sm text-white/40">You&apos;re the first to answer today. Check back later to see what others said.</p>
                  </div>
                ) : (
                  responses.map(r => (
                    <ResponseCard key={r.id} response={r} commentApiBase="/api/qotd/responses" onLike={handleLike} />
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
