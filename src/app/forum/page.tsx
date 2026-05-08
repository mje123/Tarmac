'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MessageSquare, CheckCircle, Pin, Search, Plus, Clock, ChevronRight, TrendingUp, Inbox, ThumbsUp, Eye } from 'lucide-react'

const CATEGORIES = [
  { value: 'all',     label: 'All',         color: '#ffffff' },
  { value: 'help',    label: 'Get Help',    color: '#3E92CC' },
  { value: 'bugs',    label: 'Bug Reports', color: '#EF4444' },
  { value: 'general', label: 'General',     color: '#8B5CF6' },
  { value: 'tips',    label: 'Study Tips',  color: '#10B981' },
]

const CAT: Record<string, { color: string; bg: string; label: string }> = {
  help:    { color: '#3E92CC', bg: 'rgba(62,146,204,0.15)',   label: 'Get Help' },
  bugs:    { color: '#EF4444', bg: 'rgba(239,68,68,0.15)',    label: 'Bug Report' },
  general: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)',  label: 'General' },
  tips:    { color: '#10B981', bg: 'rgba(16,185,129,0.15)',   label: 'Study Tips' },
}

const SORTS = [
  { value: 'recent',   label: 'Recent',   icon: Clock },
  { value: 'popular',  label: 'Popular',  icon: TrendingUp },
  { value: 'unanswered', label: 'Unanswered', icon: Inbox },
]

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
  id: string; title: string; category: string; author_name: string
  is_pinned: boolean; is_resolved: boolean; reply_count: number
  upvotes: number; view_count: number; created_at: string
}

interface Stats { total_posts: number; total_replies: number; resolved: number }

export default function ForumPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('recent')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category !== 'all') params.set('category', category)
    if (search) params.set('search', search)
    if (sort !== 'recent') params.set('sort', sort)
    Promise.all([
      fetch(`/api/forum/posts?${params}`).then(r => r.json()),
      stats === null ? fetch('/api/forum/stats').then(r => r.json()) : Promise.resolve(null),
    ]).then(([postData, statsData]) => {
      setPosts(postData.posts || [])
      if (statsData) setStats(statsData)
      setLoading(false)
    })
  }, [category, search, sort]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
  }

  const pinnedPosts = posts.filter(p => p.is_pinned)
  const normalPosts = posts.filter(p => !p.is_pinned)

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Community</h1>
          <p className="text-white/45 text-sm">Ask questions, share tips, report bugs. Open to everyone.</p>
        </div>
        {stats && (
          <div className="flex items-center gap-4 text-center shrink-0">
            <div>
              <div className="text-lg font-bold text-white">{stats.total_posts}</div>
              <div className="text-white/30 text-xs">posts</div>
            </div>
            <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div>
              <div className="text-lg font-bold text-white">{stats.total_replies}</div>
              <div className="text-white/30 text-xs">replies</div>
            </div>
            <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div>
              <div className="text-lg font-bold text-emerald-400">{stats.resolved}</div>
              <div className="text-white/30 text-xs">resolved</div>
            </div>
          </div>
        )}
      </div>

      {/* Search + New Post */}
      <div className="flex gap-3 mb-5">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search posts…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
          />
        </form>
        <Link href="/forum/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463' }}>
          <Plus className="w-4 h-4" /> New Post
        </Link>
      </div>

      {/* Filters row */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button key={cat.value} onClick={() => setCategory(cat.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0"
              style={category === cat.value ? {
                background: cat.value === 'all' ? 'rgba(255,255,255,0.12)' : CAT[cat.value]?.bg,
                color: cat.value === 'all' ? '#fff' : CAT[cat.value]?.color,
                border: `1px solid ${cat.value === 'all' ? 'rgba(255,255,255,0.2)' : CAT[cat.value]?.color + '40'}`,
              } : {
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.35)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
              {cat.label}
            </button>
          ))}
        </div>
        {/* Sort */}
        <div className="flex gap-1 shrink-0">
          {SORTS.map(({ value, label, icon: Icon }) => (
            <button key={value} onClick={() => setSort(value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={sort === value ? {
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
              } : {
                color: 'rgba(255,255,255,0.35)',
                border: '1px solid transparent',
              }}>
              <Icon className="w-3 h-3" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Post list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[76px] rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <MessageSquare className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-white/40 font-semibold mb-1">
            {search ? `No results for "${search}"` : 'No posts yet'}
          </p>
          <p className="text-white/25 text-sm mb-5">
            {search ? 'Try a different search.' : 'Be the first to start a conversation.'}
          </p>
          {!search && (
            <Link href="/forum/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463' }}>
              <Plus className="w-4 h-4" /> Create first post
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {/* Pinned posts */}
          {pinnedPosts.map(post => <PostRow key={post.id} post={post} pinned />)}
          {/* Normal posts */}
          {normalPosts.map(post => <PostRow key={post.id} post={post} />)}
        </div>
      )}
    </div>
  )
}

function PostRow({ post, pinned = false }: { post: Post; pinned?: boolean }) {
  const cat = CAT[post.category]
  return (
    <Link href={`/forum/${post.id}`}
      className="group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all hover:bg-white/[0.04]"
      style={{
        background: pinned ? 'rgba(255,182,39,0.04)' : 'rgba(255,255,255,0.02)',
        border: pinned ? '1px solid rgba(255,182,39,0.15)' : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Category dot */}
      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat?.color || '#fff', opacity: 0.6 }} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          {pinned && <Pin className="w-3 h-3 text-[#FFB627] shrink-0" />}
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
            style={{ background: cat?.bg, color: cat?.color }}>
            {cat?.label || post.category}
          </span>
          {post.is_resolved && (
            <span className="flex items-center gap-0.5 text-xs text-emerald-400 shrink-0">
              <CheckCircle className="w-3 h-3" /> Resolved
            </span>
          )}
        </div>
        <p className="text-white/90 font-semibold text-sm leading-snug group-hover:text-[#FFB627] transition-colors truncate">{post.title}</p>
        <div className="flex items-center gap-3 mt-1 text-white/30 text-xs">
          <span>{post.author_name}</span>
          <span>{timeAgo(post.created_at)}</span>
        </div>
      </div>

      {/* Right stats */}
      <div className="flex items-center gap-4 shrink-0 text-white/25 text-xs">
        {post.upvotes > 0 && (
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />{post.upvotes}
          </div>
        )}
        {post.view_count > 0 && (
          <div className="hidden sm:flex items-center gap-1">
            <Eye className="w-3 h-3" />{post.view_count}
          </div>
        )}
        <div className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          <span className={post.reply_count === 0 ? 'text-white/20' : 'text-white/40 font-semibold'}>{post.reply_count}</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 group-hover:text-white/50 transition-colors" />
      </div>
    </Link>
  )
}
