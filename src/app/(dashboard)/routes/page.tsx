'use client'

import { useState, useEffect } from 'react'
import { Map, Plus, ArrowRight, Loader2, X, Send, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Route {
  id: string
  title: string
  departure: string
  destination: string
  waypoints: string | null
  altitude: string | null
  description: string
  date_of_flight: string | null
  created_at: string
  users: { callsign: string | null; full_name: string | null }
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

export default function RouteCritiquePage() {
  const router = useRouter()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    title: '',
    departure: '',
    destination: '',
    waypoints: '',
    altitude: '',
    description: '',
    date_of_flight: '',
  })

  useEffect(() => {
    fetch('/api/routes')
      .then(r => r.json())
      .then(d => { setRoutes(d.routes || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || 'Failed to post'); return }
      router.push(`/routes/${data.route.id}`)
    } finally { setSubmitting(false) }
  }

  const accent = 'var(--route-accent)'

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(155,89,182,0.15)', border: '1px solid rgba(155,89,182,0.25)' }}>
            <Map className="w-4 h-4" style={{ color: accent }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Route Critique</h1>
            <p className="text-xs" style={{ color: 'var(--text-ter)' }}>Post your route. Get feedback before you fly.</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'rgba(155,89,182,0.15)', color: accent, border: '1px solid rgba(155,89,182,0.3)' }}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Post Route'}
        </button>
      </div>

      {/* Submit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl p-5 mb-6 space-y-4"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
          <h2 className="text-sm font-bold text-white mb-1">Share your route for critique</h2>

          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-ter)' }}>Title</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. KPAO to KSBA via Paso Robles" required maxLength={120}
              className="text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-pri)', borderRadius: '10px', padding: '10px 14px', width: '100%', outline: 'none' }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-ter)' }}>Departure (ICAO)</label>
              <input value={form.departure} onChange={e => setForm(p => ({ ...p, departure: e.target.value.toUpperCase() }))}
                placeholder="KPAO" required maxLength={6}
                className="text-sm font-mono" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-pri)', borderRadius: '10px', padding: '10px 14px', width: '100%', outline: 'none' }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-ter)' }}>Destination (ICAO)</label>
              <input value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value.toUpperCase() }))}
                placeholder="KSBA" required maxLength={6}
                className="text-sm font-mono" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-pri)', borderRadius: '10px', padding: '10px 14px', width: '100%', outline: 'none' }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-ter)' }}>
                Waypoints <span style={{ color: 'var(--text-qua)' }}>(optional, space-separated)</span>
              </label>
              <input value={form.waypoints} onChange={e => setForm(p => ({ ...p, waypoints: e.target.value.toUpperCase() }))}
                placeholder="SJC PRB"
                className="text-sm font-mono" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-pri)', borderRadius: '10px', padding: '10px 14px', width: '100%', outline: 'none' }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-ter)' }}>Cruising Altitude</label>
              <input value={form.altitude} onChange={e => setForm(p => ({ ...p, altitude: e.target.value }))}
                placeholder="5,500 MSL"
                className="text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-pri)', borderRadius: '10px', padding: '10px 14px', width: '100%', outline: 'none' }} />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-ter)' }}>Date of flight <span style={{ color: 'var(--text-qua)' }}>(optional)</span></label>
            <input type="date" value={form.date_of_flight} onChange={e => setForm(p => ({ ...p, date_of_flight: e.target.value }))}
              className="text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-pri)', borderRadius: '10px', padding: '10px 14px', width: '100%', outline: 'none' }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-ter)' }}>
              Notes / what you want feedback on
            </label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe your route, terrain concerns, weather you're expecting, anything specific you'd like the community to review..."
              required rows={4} maxLength={2000}
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-pri)', borderRadius: '10px', padding: '10px 14px', width: '100%', outline: 'none', resize: 'none', fontSize: '14px' }} />
          </div>

          {formError && <p className="text-sm text-red-400">{formError}</p>}

          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            style={{ background: accent, color: 'white' }}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Posting...' : 'Post for Critique'}
          </button>
        </form>
      )}

      {/* Feed */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'var(--surface-1)' }} />
          ))}
        </div>
      ) : routes.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ border: '1px dashed var(--border-2)' }}>
          <Map className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-ter)' }} />
          <p className="text-sm font-medium text-white mb-1">No routes posted yet</p>
          <p className="text-xs" style={{ color: 'var(--text-ter)' }}>Be the first to share a route for critique.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map(route => (
            <Link key={route.id} href={`/routes/${route.id}`}
              className="block rounded-2xl p-5 transition-all hover:border-[rgba(155,89,182,0.3)]"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {/* Route badge */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold"
                      style={{ background: 'rgba(155,89,182,0.12)', color: accent, border: '1px solid rgba(155,89,182,0.2)' }}>
                      {route.departure}
                      <ArrowRight className="w-3 h-3" />
                      {route.destination}
                    </span>
                    {route.altitude && (
                      <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--surface-2)', color: 'var(--text-ter)' }}>
                        {route.altitude}
                      </span>
                    )}
                    {route.date_of_flight && (
                      <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--surface-2)', color: 'var(--text-ter)' }}>
                        {new Date(route.date_of_flight).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-white mb-1.5 truncate">{route.title}</h3>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-sec)' }}>
                    {route.description}
                  </p>

                  <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: 'var(--text-ter)' }}>
                    <span className="font-mono font-bold" style={{ color: 'var(--text-sec)' }}>
                      {route.users?.callsign || route.users?.full_name?.split(' ')[0] || 'Pilot'}
                    </span>
                    <span>·</span>
                    <span>{timeAgo(route.created_at)}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 mt-1" style={{ color: 'var(--text-ter)' }} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
