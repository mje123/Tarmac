'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Map, ArrowRight, Send, Loader2, Trash2, BadgeCheck, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface RouteDetail {
  id: string
  title: string
  departure: string
  destination: string
  waypoints: string | null
  altitude: string | null
  description: string
  date_of_flight: string | null
  created_at: string
  user_id: string
  users: { callsign: string | null; full_name: string | null }
}

interface Comment {
  id: string
  body: string
  created_at: string
  user_id: string
  users: { callsign: string | null; full_name: string | null; is_cfi: boolean; cfi_verified: boolean }
}

function buildSkyVectorUrl(departure: string, destination: string, waypoints?: string | null) {
  const parts = [departure, ...(waypoints ? waypoints.split(/[\s,]+/).filter(Boolean) : []), destination]
  return `https://skyvector.com/?fpl=${encodeURIComponent(parts.join(' '))}&chart=301`
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function displayName(u: { callsign: string | null; full_name: string | null }) {
  return u.callsign || u.full_name?.split(' ')[0] || 'Pilot'
}

export default function RouteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const accent = 'var(--route-accent)'

  const [route, setRoute] = useState<RouteDetail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [mapExpanded, setMapExpanded] = useState(false)
  const commentRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))
  }, [])

  useEffect(() => {
    fetch(`/api/routes/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(d => {
        if (!d) return
        setRoute(d.route)
        setComments(d.comments)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  async function postComment(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return
    setCommentError('')
    setPosting(true)
    try {
      const res = await fetch(`/api/routes/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: comment.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setCommentError(data.error || 'Failed to post'); return }
      setComments(prev => [...prev, data.comment])
      setComment('')
    } finally { setPosting(false) }
  }

  async function deleteComment(commentId: string) {
    await fetch(`/api/routes/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId }),
    })
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="h-8 w-40 rounded-lg animate-pulse mb-6" style={{ background: 'var(--surface-1)' }} />
        <div className="h-64 rounded-2xl animate-pulse mb-4" style={{ background: 'var(--surface-1)' }} />
        <div className="h-96 rounded-2xl animate-pulse" style={{ background: 'var(--surface-1)' }} />
      </div>
    )
  }

  if (notFound || !route) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center py-20">
        <Map className="w-10 h-10 mx-auto mb-4" style={{ color: 'var(--text-ter)' }} />
        <h2 className="text-lg font-bold text-white mb-2">Route not found</h2>
        <Link href="/routes" className="text-sm" style={{ color: accent }}>Back to Route Critique</Link>
      </div>
    )
  }

  const skyVectorUrl = buildSkyVectorUrl(route.departure, route.destination, route.waypoints)
  const skyVectorEmbedUrl = `https://skyvector.com/?fpl=${encodeURIComponent([route.departure, ...(route.waypoints ? route.waypoints.split(/[\s,]+/).filter(Boolean) : []), route.destination].join(' '))}&chart=301`

  const fullRoute = [route.departure, ...(route.waypoints ? route.waypoints.split(/[\s,]+/).filter(Boolean) : []), route.destination]

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Back */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/routes" className="transition-colors hover:text-white" style={{ color: 'var(--text-ter)' }}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-mono font-bold"
          style={{ background: 'rgba(155,89,182,0.12)', color: accent, border: '1px solid rgba(155,89,182,0.2)' }}>
          {fullRoute.map((p, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {p}
              {i < fullRoute.length - 1 && <ArrowRight className="w-3 h-3 opacity-50" />}
            </span>
          ))}
        </div>
      </div>

      {/* Route card */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <h1 className="text-lg font-bold text-white mb-2">{route.title}</h1>

        <div className="flex flex-wrap gap-2 mb-4">
          {route.altitude && (
            <span className="text-xs px-2.5 py-1 rounded-lg" style={{ background: 'var(--surface-2)', color: 'var(--text-sec)', border: '1px solid var(--border-2)' }}>
              {route.altitude}
            </span>
          )}
          {route.date_of_flight && (
            <span className="text-xs px-2.5 py-1 rounded-lg" style={{ background: 'var(--surface-2)', color: 'var(--text-sec)', border: '1px solid var(--border-2)' }}>
              {new Date(route.date_of_flight).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>

        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-sec)' }}>{route.description}</p>

        <div className="text-xs" style={{ color: 'var(--text-ter)' }}>
          Posted by{' '}
          <span className="font-mono font-bold" style={{ color: 'var(--text-sec)' }}>{displayName(route.users)}</span>
          {' · '}{timeAgo(route.created_at)}
        </div>
      </div>

      {/* SkyVector Map */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid rgba(155,89,182,0.25)' }}>
        {/* Map header */}
        <div className="flex items-center justify-between px-4 py-3"
          style={{ background: 'rgba(155,89,182,0.1)', borderBottom: '1px solid rgba(155,89,182,0.2)' }}>
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4" style={{ color: accent }} />
            <span className="text-sm font-bold text-white">VFR Sectional</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded"
              style={{ background: 'rgba(155,89,182,0.15)', color: accent }}>
              via SkyVector
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMapExpanded(v => !v)}
              className="text-xs px-2.5 py-1 rounded-lg transition-all"
              style={{ background: 'var(--surface-2)', color: 'var(--text-sec)', border: '1px solid var(--border-2)' }}>
              {mapExpanded ? 'Collapse' : 'Expand'}
            </button>
            <a href={skyVectorUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
              style={{ background: 'rgba(155,89,182,0.2)', color: accent, border: '1px solid rgba(155,89,182,0.3)' }}>
              Open in SkyVector
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Map embed */}
        <div className="relative bg-black" style={{ height: mapExpanded ? '600px' : '380px', transition: 'height 0.3s ease' }}>
          <iframe
            src={skyVectorEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 'none', display: 'block' }}
            title={`VFR Sectional: ${route.departure} to ${route.destination}`}
            loading="lazy"
          />
          {/* Overlay note */}
          <div className="absolute bottom-3 left-3 pointer-events-none">
            <div className="text-[10px] px-2 py-1 rounded-md"
              style={{ background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)' }}>
              VFR Sectional · Powered by SkyVector
            </div>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-3 mb-6">
        <h2 className="text-sm font-bold text-white mb-3">
          Critique ({comments.length})
        </h2>

        {comments.length === 0 && (
          <div className="rounded-xl p-6 text-center" style={{ border: '1px dashed var(--border-2)' }}>
            <p className="text-sm" style={{ color: 'var(--text-ter)' }}>No critique yet — be the first to weigh in.</p>
          </div>
        )}

        {comments.map(c => (
          <div key={c.id} className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono" style={{ color: 'var(--text-pri)' }}>
                  {displayName(c.users)}
                </span>
                {c.users.is_cfi && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(46,204,113,0.12)', color: '#2ECC71', border: '1px solid rgba(46,204,113,0.25)' }}>
                    <BadgeCheck className="w-2.5 h-2.5" />
                    {c.users.cfi_verified ? 'CFI ✓' : 'CFI'}
                  </span>
                )}
                <span className="text-xs" style={{ color: 'var(--text-ter)' }}>{timeAgo(c.created_at)}</span>
              </div>
              {c.user_id === currentUserId && (
                <button onClick={() => deleteComment(c.id)}
                  className="p-1 rounded transition-colors hover:text-red-400"
                  style={{ color: 'var(--text-ter)' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-sec)' }}>{c.body}</p>
          </div>
        ))}
      </div>

      {/* Post comment */}
      <form onSubmit={postComment} className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <h3 className="text-sm font-bold text-white mb-3">Add your critique</h3>
        <textarea
          ref={commentRef}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Terrain concerns, airspace, alternates, weather considerations, preflight tips..."
          rows={3}
          maxLength={2000}
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-pri)', borderRadius: '10px', padding: '10px 14px', width: '100%', outline: 'none', resize: 'none', fontSize: '14px', marginBottom: '12px' }}
        />
        {commentError && <p className="text-sm text-red-400 mb-2">{commentError}</p>}
        <button type="submit" disabled={posting || !comment.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
          style={{ background: accent, color: 'white' }}>
          {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {posting ? 'Posting...' : 'Post Critique'}
        </button>
      </form>
    </div>
  )
}
