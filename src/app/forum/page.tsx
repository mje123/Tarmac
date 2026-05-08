'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare, CheckCircle, Pin, Search, Plus, Clock, ChevronRight } from 'lucide-react'

const CATEGORIES = [
  { value: 'all', label: 'All Posts', color: '#ffffff' },
  { value: 'help', label: 'Get Help', color: '#3E92CC' },
  { value: 'bugs', label: 'Bug Reports', color: '#EF4444' },
  { value: 'general', label: 'General', color: '#8B5CF6' },
  { value: 'tips', label: 'Study Tips', color: '#10B981' },
]

const CAT_STYLES: Record<string, { color: string; bg: string }> = {
  help:    { color: '#3E92CC', bg: 'rgba(62,146,204,0.15)' },
  bugs:    { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  general: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  tips:    { color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
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
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Post {
  id: string
  title: string
  category: string
  author_name: string
  is_pinned: boolean
  is_resolved: boolean
  reply_count: number
  upvotes: number
  created_at: string
}

export default function ForumPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category !== 'all') params.set('category', category)
    if (search) params.set('search', search)
    fetch(`/api/forum/posts?${params}`)
      .then(r => r.json())
      .then(d => { setPosts(d.posts || []); setLoading(false) })
  }, [category, search])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Community</h1>
        <p className="text-white/50 text-sm">Ask questions, share tips, report bugs. Open to everyone.</p>
      </div>

      {/* Search + New Post */}
      <div className="flex gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search posts…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </form>
        <Link
          href="/forum/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463' }}
        >
          <Plus className="w-4 h-4" /> New Post
        </Link>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0"
            style={category === cat.value ? {
              background: cat.value === 'all' ? 'rgba(255,255,255,0.12)' : CAT_STYLES[cat.value]?.bg,
              color: cat.value === 'all' ? '#ffffff' : CAT_STYLES[cat.value]?.color,
              border: `1px solid ${cat.value === 'all' ? 'rgba(255,255,255,0.2)' : CAT_STYLES[cat.value]?.color + '40'}`,
            } : {
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-white/40 font-semibold mb-1">No posts yet</p>
          <p className="text-white/25 text-sm mb-5">Be the first to start a conversation.</p>
          <Link href="/forum/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463' }}>
            <Plus className="w-4 h-4" /> Create first post
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(post => {
            const cat = CAT_STYLES[post.category]
            return (
              <Link
                key={post.id}
                href={`/forum/${post.id}`}
                className="group flex items-start gap-4 p-4 rounded-2xl transition-all hover:bg-white/[0.04]"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {/* Left: category indicator */}
                <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: cat?.color || '#fff', opacity: 0.4 }} />

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {post.is_pinned && <Pin className="w-3 h-3 text-[#FFB627]" />}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: cat?.bg, color: cat?.color }}>
                      {CATEGORIES.find(c => c.value === post.category)?.label || post.category}
                    </span>
                    {post.is_resolved && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-white font-semibold text-sm leading-snug mb-1.5 group-hover:text-[#FFB627] transition-colors line-clamp-2">{post.title}</p>
                  <div className="flex items-center gap-3 text-white/30 text-xs">
                    <span>{post.author_name}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(post.created_at)}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.reply_count}</span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-white/20 shrink-0 mt-1 group-hover:text-white/40 transition-colors" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
