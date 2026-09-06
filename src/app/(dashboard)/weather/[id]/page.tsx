'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CloudRain, ArrowLeft, Loader2, Send } from 'lucide-react'
import Link from 'next/link'

interface WeatherScenario {
  id: string; title: string; route: string | null; metar: string | null
  taf: string | null; pireps: string | null; notams: string | null; context: string | null
  go_count: number; nogo_count: number; created_at: string
}
interface WeatherVote {
  vote: 'go' | 'nogo'; reasoning: string | null; created_at: string
}

export default function WeatherScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [scenario, setScenario] = useState<WeatherScenario | null>(null)
  const [myVote, setMyVote] = useState<'go' | 'nogo' | null>(null)
  const [votes, setVotes] = useState<WeatherVote[]>([])
  const [reasoning, setReasoning] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingVote, setPendingVote] = useState<'go' | 'nogo' | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: s }, { data: { user } }] = await Promise.all([
        supabase.from('weather_scenarios').select('*').eq('id', id).single(),
        supabase.auth.getUser(),
      ])
      setScenario(s)
      if (user) {
        const { data: existing } = await supabase.from('weather_votes').select('vote').eq('scenario_id', id).eq('user_id', user.id).maybeSingle()
        if (existing) setMyVote(existing.vote as 'go' | 'nogo')
      }
      const { data: allVotes } = await supabase.from('weather_votes').select('vote,reasoning,created_at')
        .eq('scenario_id', id).not('reasoning', 'is', null).order('created_at', { ascending: false })
      setVotes((allVotes || []).filter(v => v.reasoning) as WeatherVote[])
      setLoading(false)
    }
    load()
  }, [id])

  async function castVote(vote: 'go' | 'nogo') {
    if (submitting) return
    if (!reasoning.trim() && !myVote) {
      setPendingVote(vote)
      return
    }
    submitVote(vote, reasoning)
  }

  async function submitVote(vote: 'go' | 'nogo', r: string) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/weather/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: id, vote, reasoning: r }),
      })
      const data = await res.json()
      setMyVote(vote)
      setPendingVote(null)
      setReasoning('')
      if (scenario) setScenario({ ...scenario, go_count: data.go_count, nogo_count: data.nogo_count })
    } finally { setSubmitting(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
  if (!scenario) return <div className="p-6 text-center text-white/40">Scenario not found.</div>

  const total = scenario.go_count + scenario.nogo_count
  const goPct = total > 0 ? Math.round((scenario.go_count / total) * 100) : 0

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/weather" className="text-white/40 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded"
          style={{ background: 'rgba(243,156,18,0.15)', color: 'var(--weather-accent)', border: '1px solid rgba(243,156,18,0.3)' }}>
          <CloudRain style={{ width: '11px', height: '11px' }} /> Weather Room
        </span>
      </div>

      {/* Scenario */}
      <div className="rounded-xl p-5 mb-5" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <h1 className="text-lg font-bold text-white mb-3">{scenario.title}</h1>
        {scenario.route && <p className="text-xs mb-3 font-medium" style={{ color: 'var(--weather-accent)' }}>{scenario.route}</p>}
        {scenario.context && (
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-pri)' }}>{scenario.context}</p>
        )}
        {[
          { label: 'METAR', value: scenario.metar },
          { label: 'TAF', value: scenario.taf },
          { label: 'PIREPs', value: scenario.pireps },
          { label: 'NOTAMs', value: scenario.notams },
        ].filter(f => f.value).map(f => (
          <div key={f.label} className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-ter)' }}>{f.label}</p>
            <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono p-3 rounded-lg overflow-x-auto"
              style={{ background: 'var(--surface-2)', color: 'var(--text-sec)' }}>{f.value}</pre>
          </div>
        ))}
      </div>

      {/* Vote section */}
      <div className="rounded-xl p-5 mb-5" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <h2 className="text-sm font-bold text-white mb-4">What's your call?</h2>

        {myVote ? (
          <div className="mb-4">
            <p className="text-sm mb-3" style={{ color: 'var(--text-sec)' }}>
              You voted: <span className="font-bold" style={{ color: myVote === 'go' ? '#22c55e' : '#ef4444' }}>
                {myVote === 'go' ? '✓ Go' : '✗ No-Go'}
              </span>
            </p>
          </div>
        ) : (
          <div className="flex gap-3 mb-4">
            {(['go', 'nogo'] as const).map(v => (
              <button key={v} onClick={() => castVote(v)}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                style={v === 'go'
                  ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
                  : { background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                {v === 'go' ? '✓ Go' : '✗ No-Go'}
              </button>
            ))}
          </div>
        )}

        {(pendingVote || myVote) && (
          <div className="space-y-2">
            <textarea
              value={reasoning}
              onChange={e => setReasoning(e.target.value)}
              placeholder="Why did you decide this way? (optional)"
              rows={3}
              className="w-full resize-none text-sm"
            />
            {pendingVote && (
              <button onClick={() => submitVote(pendingVote, reasoning)} disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
                style={{
                  background: pendingVote === 'go' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                  color: pendingVote === 'go' ? '#22c55e' : '#ef4444',
                }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {pendingVote === 'go' ? 'Confirm Go' : 'Confirm No-Go'}
              </button>
            )}
          </div>
        )}

        {/* Results */}
        {total > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-1)' }}>
            <div className="h-3 rounded-full overflow-hidden flex mb-2">
              <div className="h-full transition-all" style={{ width: `${goPct}%`, background: '#22c55e' }} />
              <div className="h-full flex-1" style={{ background: '#ef4444' }} />
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: '#22c55e' }}>✓ {scenario.go_count} Go ({goPct}%)</span>
              <span style={{ color: '#ef4444' }}>✗ {scenario.nogo_count} No-Go ({100 - goPct}%)</span>
            </div>
          </div>
        )}
      </div>

      {/* Reasonings */}
      {votes.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-white mb-3">Community reasoning</h2>
          <div className="space-y-3">
            {votes.map((v, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold" style={{ color: v.vote === 'go' ? '#22c55e' : '#ef4444' }}>
                    {v.vote === 'go' ? '✓ Go' : '✗ No-Go'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-pri)' }}>{v.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
