'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, CheckCircle, MessageSquare, Send, Loader2,
  Clock, Pin, ThumbsUp, Eye, Share2, Check,
} from 'lucide-react'

const CAT: Record<string, { color: string; bg: string; label: string }> = {
  help:    { color: '#3E92CC', bg: 'rgba(62,146,204,0.15)',  label: 'Get Help' },
  bugs:    { color: '#EF4444', bg: 'rgba(239,68,68,0.15)',   label: 'Bug Report' },
  general: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)', label: 'General' },
  tips:    { color: '#10B981', bg: 'rgba(16,185,129,0.15)',  label: 'Study Tips' },
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
  return new Date(ts).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
      style={{ background: `${color}25`, color, border: `1px solid ${color}30` }}>
      {initials}
    </div>
  )
}

interface Post {
  id: string; title: string; body: string; category: string
  author_name: string; user_id: string; is_pinned: boolean
  is_resolved: boolean; reply_count: number; upvotes: number
  view_count: number; created_at: string
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
  const [upvoted, setUpvoted] = useState(false)
  const [upvoting, setUpvoting] = useState(false)
  const [copied, setCopied] = useState(false)
  const replyRef = useRef<HTMLTextAreaElement>(null)
  const replyBoxRef = useRef<HTMLDivElement>(null)

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
      // Check if already upvoted (localStorage)
      const voted = localStorage.getItem(`forum_upvoted_${id}`)
      if (voted) setUpvoted(true)
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

  async function handleUpvote() {
    if (!currentUserId || upvoted || upvoting) return
    setUpvoting(true)
    const res = await fetch(`/api/forum/posts/${id}/upvote`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setPost(p => p ? { ...p, upvotes: data.upvotes } : p)
      setUpvoted(true)
      localStorage.setItem(`forum_upvoted_${id}`, '1')
    }
    setUpvoting(false)
  }

  async function toggleResolve() {
    if (!post) return
    const res = await fetch(`/api/forum/posts/${post.id}/resolve`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) setPost(p => p ? { ...p, is_resolved: data.resolved } : p)
  }

  async function handleShare() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function scrollToReply() {
    replyBoxRef.current?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => replyRef.current?.focus(), 400)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
    </div>
  )
  if (!post) return null

  const cat = CAT[post.category]
  const canResolve = currentUserId === post.user_id || isAdmin

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link href="/forum" className="inline-flex items-center gap-2 text-white/35 hover:text-white/70 text-sm mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Community
      </Link>

      {/* Post */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
        <div className="p-6">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {post.is_pinned && (
              <span className="flex items-center gap-1 text-xs font-semibold text-[#FFB627] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,182,39,0.1)', border: '1px solid rgba(255,182,39,0.2)' }}>
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
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

          <h1 className="text-2xl font-bold text-white leading-snug mb-5">{post.title}</h1>

          {/* Author row */}
          <div className="flex items-center gap-3 mb-5 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <Avatar name={post.author_name} color={cat?.color || '#3E92CC'} />
            <div>
              <div className="text-white/80 text-sm font-semibold">{post.author_name}</div>
              <div className="text-white/35 text-xs flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> {timeAgo(post.created_at)}
                {post.view_count > 0 && (
                  <><span className="text-white/20">·</span><Eye className="w-3 h-3" /> {post.view_count} views</>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap mb-6">{post.body}</p>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleUpvote}
              disabled={!currentUserId || upvoted || upvoting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={upvoted ? {
                background: 'rgba(62,146,204,0.15)',
                color: '#3E92CC',
                border: '1px solid rgba(62,146,204,0.3)',
              } : {
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {upvoting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
              {post.upvotes > 0 ? post.upvotes : ''} {upvoted ? 'Helpful' : 'Helpful'}
            </button>

            <button onClick={scrollToReply}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <MessageSquare className="w-3.5 h-3.5" /> Reply
            </button>

            <button onClick={handleShare}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Share'}
            </button>

            {canResolve && (
              <button onClick={toggleResolve}
                className="ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                style={post.is_resolved ? {
                  background: 'rgba(16,185,129,0.12)',
                  color: '#10B981',
                  border: '1px solid rgba(16,185,129,0.25)',
                } : {
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.35)',
                  border: '1px solid rgba(255,255,255,0.09)',
                }}>
                <CheckCircle className="w-3.5 h-3.5" />
                {post.is_resolved ? 'Mark Unresolved' : 'Mark Resolved'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-white/35 uppercase tracking-widest mb-4 flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5" />
          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
        </h2>

        {replies.length === 0 ? (
          <div className="py-10 text-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-white/25 text-sm">No replies yet.</p>
            <button onClick={scrollToReply} className="text-[#FFB627] text-sm font-semibold mt-2 hover:underline">
              Be the first to reply →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {replies.map((reply, i) => (
              <div key={reply.id} className="p-5 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={reply.author_name} color="#3E92CC" />
                  <div>
                    <span className="text-white/75 text-sm font-semibold">{reply.author_name}</span>
                    <div className="text-white/30 text-xs">{timeAgo(reply.created_at)}</div>
                  </div>
                  <span className="ml-auto text-white/15 text-xs font-mono">#{i + 1}</span>
                </div>
                <p className="text-white/75 text-sm leading-relaxed whitespace-pre-wrap pl-11">{reply.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply form */}
      <div ref={replyBoxRef} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
        <div className="px-5 pt-5 pb-3">
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
              placeholder="Write a helpful reply… The more detail the better."
              rows={5}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none resize-none mb-3 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitReply(e as any) }}
            />
            <div className="flex items-center justify-between">
              <span className="text-white/20 text-xs hidden sm:block">⌘↵ to post</span>
              <button type="submit" disabled={submitting || !replyBody.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 ml-auto"
                style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463' }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Post Reply</>}
              </button>
            </div>
          </form>
        ) : (
          <div className="px-5 pb-5 space-y-3">
            <p className="text-white/35 text-xs">Join the conversation — it's free.</p>
            <div className="flex gap-3">
              <Link href={`/login?redirect=/forum/${id}`}
                className="flex-1 text-center py-3 rounded-xl text-sm font-semibold text-white/60 transition-all hover:text-white"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Log in
              </Link>
              <Link href="/start"
                className="flex-1 text-center py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463' }}>
                Sign up free
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
