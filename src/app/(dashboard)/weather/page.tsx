'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CloudRain, Plus, X, Loader2, Send } from 'lucide-react'
import Link from 'next/link'

interface WeatherScenario {
  id: string; title: string; route: string | null; metar: string | null
  go_count: number; nogo_count: number; comment_count: number; created_at: string
}

function VoteBar({ go, nogo }: { go: number; nogo: number }) {
  const total = go + nogo
  if (total === 0) return <div className="h-1.5 rounded-full" style={{ background: 'var(--surface-3)' }} />
  const goPct = Math.round((go / total) * 100)
  return (
    <div className="h-1.5 rounded-full overflow-hidden flex" style={{ background: 'var(--surface-3)' }}>
      <div className="h-full transition-all" style={{ width: `${goPct}%`, background: '#22c55e' }} />
      <div className="h-full flex-1" style={{ background: '#ef4444' }} />
    </div>
  )
}

export default function WeatherRoomPage() {
  const [scenarios, setScenarios] = useState<WeatherScenario[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', route: '', metar: '', taf: '', pireps: '', notams: '', context: '' })

  useEffect(() => { loadScenarios() }, [])

  async function loadScenarios() {
    const { data } = await createClient().from('weather_scenarios').select('*').order('created_at', { ascending: false })
    setScenarios(data || [])
    setLoading(false)
  }

  async function submitScenario(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/weather/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      setForm({ title: '', route: '', metar: '', taf: '', pireps: '', notams: '', context: '' })
      setShowForm(false)
      await loadScenarios()
    } finally { setSubmitting(false) }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded"
          style={{ background: 'rgba(243,156,18,0.15)', color: 'var(--weather-accent)', border: '1px solid rgba(243,156,18,0.3)' }}>
          <CloudRain style={{ width: '11px', height: '11px' }} />
          Weather Room
        </span>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ background: 'rgba(243,156,18,0.15)', color: 'var(--weather-accent)', border: '1px solid rgba(243,156,18,0.3)' }}>
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Post Scenario'}
        </button>
      </div>

      {/* Post form */}
      {showForm && (
        <form onSubmit={submitScenario} className="rounded-xl p-5 mb-6 space-y-3" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
          <h2 className="text-sm font-bold text-white mb-1">Post a weather scenario</h2>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What's the decision? (e.g., 'Go or no-go KDSM → KORD Saturday morning')" required className="w-full text-sm" />
          <input value={form.route} onChange={e => setForm(f => ({ ...f, route: e.target.value }))}
            placeholder="Route (optional, e.g. KDSM → KORD)" className="w-full text-sm" />
          <textarea value={form.metar} onChange={e => setForm(f => ({ ...f, metar: e.target.value }))}
            placeholder="METAR" rows={3} className="w-full resize-none text-sm font-mono" />
          <textarea value={form.taf} onChange={e => setForm(f => ({ ...f, taf: e.target.value }))}
            placeholder="TAF (optional)" rows={3} className="w-full resize-none text-sm font-mono" />
          <textarea value={form.pireps} onChange={e => setForm(f => ({ ...f, pireps: e.target.value }))}
            placeholder="PIREPs (optional)" rows={2} className="w-full resize-none text-sm font-mono" />
          <textarea value={form.notams} onChange={e => setForm(f => ({ ...f, notams: e.target.value }))}
            placeholder="NOTAMs (optional)" rows={2} className="w-full resize-none text-sm font-mono" />
          <textarea value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
            placeholder="Context — what's the flight, who's on board, aircraft, your experience, what are you deciding?" rows={3} className="w-full resize-none text-sm" />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={submitting || !form.title.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
            style={{ background: 'var(--weather-accent)', color: '#060e1c' }}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Post Scenario
          </button>
        </form>
      )}

      {/* Scenarios */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'var(--surface-1)' }} />)}</div>
      ) : scenarios.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ border: '1px dashed var(--border-2)' }}>
          <CloudRain className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-ter)' }} />
          <p className="text-sm font-medium text-white/60 mb-1">No scenarios posted yet</p>
          <p className="text-xs" style={{ color: 'var(--text-ter)' }}>Post a real weather situation and get the community's read.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map(s => {
            const total = s.go_count + s.nogo_count
            const goPct = total > 0 ? Math.round((s.go_count / total) * 100) : 0
            return (
              <Link key={s.id} href={`/weather/${s.id}`}
                className="block rounded-xl p-4 transition-all hover:border-white/15"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
                <h3 className="text-sm font-semibold text-white mb-1">{s.title}</h3>
                {s.route && <p className="text-xs mb-2" style={{ color: 'var(--text-ter)' }}>{s.route}</p>}
                {s.metar && (
                  <p className="text-xs font-mono mb-3 truncate" style={{ color: 'var(--text-sec)' }}>{s.metar.slice(0, 80)}</p>
                )}
                <VoteBar go={s.go_count} nogo={s.nogo_count} />
                <div className="flex items-center justify-between mt-2 text-xs" style={{ color: 'var(--text-ter)' }}>
                  <div className="flex gap-4">
                    <span style={{ color: '#22c55e' }}>✓ {s.go_count} Go</span>
                    <span style={{ color: '#ef4444' }}>✗ {s.nogo_count} No-Go</span>
                  </div>
                  <span className="font-medium" style={{ color: 'var(--weather-accent)' }}>Cast your vote →</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
