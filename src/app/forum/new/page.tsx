'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2 } from 'lucide-react'

const CATEGORIES = [
  { value: 'help',    label: 'Get Help',    desc: 'Questions about concepts, regulations, or the test',  color: '#3E92CC', bg: 'rgba(62,146,204,0.12)' },
  { value: 'bugs',    label: 'Bug Report',  desc: 'Something broken or not working right',                color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  { value: 'general', label: 'General',     desc: 'Anything else — intros, discussion, news',             color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  { value: 'tips',    label: 'Study Tips',  desc: 'Share what\'s working for you',                        color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
]

export default function NewPostPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setAuthed(!!data.user))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category) { setError('Please select a category.'); return }
    if (title.trim().length < 5) { setError('Title is too short.'); return }
    if (body.trim().length < 10) { setError('Post body is too short.'); return }
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/forum/posts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, body, category }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Something went wrong.'); setSubmitting(false); return }
    router.push(`/forum/${data.id}`)
  }

  if (authed === null) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
    </div>
  )

  if (!authed) return (
    <div className="max-w-lg mx-auto py-20 text-center">
      <p className="text-white font-bold text-lg mb-2">Sign in to post</p>
      <p className="text-white/50 text-sm mb-6">Create a free account to post questions, share tips, and join the community.</p>
      <div className="flex gap-3 justify-center">
        <Link href="/login?redirect=/forum/new" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white/70 transition-all hover:text-white"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>Log in</Link>
        <Link href="/start" className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463' }}>Sign up free</Link>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/forum" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Community
      </Link>

      <h1 className="text-2xl font-extrabold text-white mb-6">New Post</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-white/60 mb-2">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className="p-3 rounded-xl text-left transition-all"
                style={category === cat.value ? {
                  background: cat.bg,
                  border: `1px solid ${cat.color}40`,
                } : {
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="font-semibold text-sm mb-0.5" style={{ color: category === cat.value ? cat.color : 'rgba(255,255,255,0.7)' }}>
                  {cat.label}
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{cat.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-white/60 mb-2">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What's your question or topic?"
            maxLength={150}
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <div className="text-right text-xs text-white/20 mt-1">{title.length}/150</div>
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-semibold text-white/60 mb-2">Details</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Give as much detail as you can. The more context, the better the answer."
            rows={7}
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all resize-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463' }}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post to Community'}
        </button>
      </form>
    </div>
  )
}
