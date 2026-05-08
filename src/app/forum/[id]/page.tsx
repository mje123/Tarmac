'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, CheckCircle, MessageSquare, Send, Loader2, Clock, Pin } from 'lucide-react'

const CAT_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  help:    { color: '#3E92CC', bg: 'rgba(62,146,204,0.15)',    label: 'Get Help' },
  bugs:    { color: '#EF4444', bg: 'rgba(239,68,68,0.15)',     label: 'Bug Report' },
  general: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)',   label: 'General' },
  tips:    { color: '#10B981', bg: 'rgba(16,185,129,0.15)',    label: 'Study Tips' },
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Post {
  id: string; title: string; body: string; category: string
  author_name: string; user_id: string; is_pinned: boolean
  is_resolved: boolean; reply_count: number; created_at: string
}
interface Reply {
  id: string; body: string; author_name: string
  user_id: string; is_solution: boolean; created_at: string
}

export default function PostPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const replyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch(`/api/forum/posts/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { router.replace('/forum'); return }
        setPost(d.post); setReplies(d.replies); setLoading(false)
      })
    createClient().auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      setCurrentUserId(data.user.id)
      const supabase = createClient()
      const { data: profile } = await supabase.from('users').select('is_admin').eq('id', data.user.id).single()
      setIsAdmin(profile?.is_admin ?? false)
    })
  }, [id, router])

  async function submitReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyBody.trim() || submitting) return
    if (!currentUserId) { router.push(`/login?redirect=/forum/${id}`); return }
    setSubmitting(true)
    const res = await fetch(`/api/forum/posts/${id}/replies`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: replyBody }),
    })
    const data = await res.json()
    if (res.ok) {
      setReplies(r => [...r, data.reply])
      setPost(p => p ? { ...p, reply_count: p.reply_count + 1 } : p)
      setReplyBody('')
    }
    setSubmitting(false)
  }

  async function toggleResolve() {
    if (!post) return
    const res = await fetch(`/api/forum/posts/${post.id}/resolve`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) setPost(p => p ? { ...p, is_resolved: data.resolved } : p)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
    </div>
  )
  if (!post) return null

  const cat = CAT_STYLES[post.category]
  const canResolve = currentUserId === post.user_id || isAdmin
  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link href="/forum" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Community
      </Link>

      {/* Post card */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
        {/* Post header */}
        <div className="p-5 pb-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {post.is_pinned && <span className="flex items-center gap-1 text-xs font-semibold text-[#FFB627]"><Pin className="w-3 h-3" /> Pinned</span>}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: cat?.bg, color: cat?.color }}>
              {cat?.label || post.category}
            </span>
            {post.is_resolved && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle className="w-3 h-3" /> Resolved
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-white leading-snug mb-4">{post.title}</h1>
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{post.body}</p>
        </div>

        {/* Post footer */}
        <div className="px-5 py-3 flex items-center justify-between flex-wrap gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: cat?.bg || 'rgba(255,255,255,0.1)', color: cat?.color || '#fff' }}>
              {initials(post.author_name)}
            </div>
            <span className="text-white/50 text-xs font-medium">{post.author_name}</span>
            <span className="text-white/25 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(post.created_at)}</span>
          </div>
          {canResolve && (
            <button
              onClick={toggleResolve}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={post.is_resolved ? {
                background: 'rgba(16,185,129,0.15)',
                color: '#10B981',
                border: '1px solid rgba(16,185,129,0.3)',
              } : {
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {post.is_resolved ? 'Mark Unresolved' : 'Mark Resolved'}
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
        </h2>

        {replies.length === 0 ? (
          <div className="text-center py-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-white/30 text-sm">No replies yet — be the first to help.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {replies.map((reply, i) => (
              <div key={reply.id} className="p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: 'rgba(62,146,204,0.2)', color: '#3E92CC' }}>
                    {initials(reply.author_name)}
                  </div>
                  <span className="text-white/60 text-xs font-semibold">{reply.author_name}</span>
                  <span className="text-white/25 text-xs">{timeAgo(reply.created_at)}</span>
                  <span className="text-white/15 text-xs ml-auto">#{i + 1}</span>
                </div>
                <p className="text-white/75 text-sm leading-relaxed whitespace-pre-wrap">{reply.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply form */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
        <div className="px-5 pt-4 pb-2">
          <h3 className="text-sm font-bold text-white/60">
            {currentUserId ? 'Leave a reply' : 'Sign in to reply'}
          </h3>
        </div>
        {currentUserId ? (
          <form onSubmit={submitReply} className="px-5 pb-5">
            <textarea
              ref={replyRef}
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              placeholder="Write a helpful reply…"
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all resize-none mb-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitReply(e as any) }}
            />
            <div className="flex items-center justify-between">
              <span className="text-white/20 text-xs">⌘↵ to submit</span>
              <button
                type="submit"
                disabled={submitting || !replyBody.trim()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463' }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Post Reply</>}
              </button>
            </div>
          </form>
        ) : (
          <div className="px-5 pb-5 flex items-center gap-3">
            <Link href={`/login?redirect=/forum/${id}`}
              className="flex-1 text-center py-3 rounded-xl text-sm font-semibold text-white/70 transition-all hover:text-white"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Log in to reply
            </Link>
            <Link href="/start"
              className="flex-1 text-center py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463' }}>
              Sign up free
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
