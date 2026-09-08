'use client'

import { useState } from 'react'
import { Loader2, Eye, EyeOff, Trash2, RefreshCw, Sparkles } from 'lucide-react'

interface Accident { id: string; title: string; is_active: boolean; posted_at: string | null; ai_summary: string | null }
export interface FlaggedComment {
  id: string; comment_id: string; reason: string; created_at: string
  accident_comments: { id: string; body: string; accident_id: string; is_removed: boolean } | null
}

export default function AdminDebriefClient({ accidents: initial, flaggedComments: initialFlags }: {
  accidents: Accident[]
  flaggedComments: FlaggedComment[]
}) {
  const [accidents, setAccidents] = useState(initial)
  const [flags, setFlags] = useState(initialFlags)
  const [fetching, setFetching] = useState(false)
  const [fetchResult, setFetchResult] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function fetchNewAccident() {
    setFetching(true); setFetchResult(null)
    try {
      const res = await fetch('/api/accidents/fetch?admin=1&activate=1')
      const data = await res.json()
      setFetchResult(res.ok ? `✓ ${data.title || data.message || 'Fetched'}` : `✗ ${data.error}`)
    } catch { setFetchResult('Network error') }
    finally { setFetching(false) }
  }

  async function toggleActive(id: string, current: boolean) {
    setLoadingId(id)
    await fetch(`/api/admin/accidents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    setAccidents(as => as.map(a => a.id === id ? { ...a, is_active: !current } : a))
    setLoadingId(null)
  }

  async function removeComment(commentId: string) {
    await fetch('/api/accidents/comment', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId }),
    })
    setFlags(fs => fs.filter(f => f.comment_id !== commentId))
  }

  async function generateSummary(accidentId: string) {
    setLoadingId(accidentId + '-summary')
    try {
      const res = await fetch('/api/admin/accidents/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accidentId }),
      })
      const data = await res.json()
      if (data.summary) {
        setAccidents(as => as.map(a => a.id === accidentId ? { ...a, ai_summary: data.summary } : a))
      }
    } finally { setLoadingId(null) }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-6">Debrief Admin</h1>

      {/* Fetch new */}
      <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <h2 className="text-sm font-bold text-white mb-3">Fetch New Accident</h2>
        <button onClick={fetchNewAccident} disabled={fetching}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all"
          style={{ background: 'rgba(232,89,60,0.15)', color: 'var(--debrief-accent)', border: '1px solid rgba(232,89,60,0.3)' }}>
          {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Fetch from NTSB + Anonymize
        </button>
        {fetchResult && <p className="text-xs mt-2" style={{ color: fetchResult.startsWith('✓') ? 'var(--cfi-accent)' : '#ef4444' }}>{fetchResult}</p>}
      </div>

      {/* Scenarios table */}
      <div className="rounded-xl overflow-hidden mb-6" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-1)' }}>
          <h2 className="text-sm font-bold text-white">All Scenarios ({accidents.length})</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-1)' }}>
          {accidents.length === 0 && (
            <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-ter)' }}>No scenarios yet</div>
          )}
          {accidents.map(a => (
            <div key={a.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{a.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-ter)' }}>
                  {a.posted_at ? new Date(a.posted_at).toLocaleDateString() : 'Not posted'}
                  {a.ai_summary ? ' · Has AI summary' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => generateSummary(a.id)} disabled={loadingId === a.id + '-summary'}
                  className="p-1.5 rounded-lg text-xs transition-colors hover:bg-white/10"
                  style={{ color: 'var(--text-ter)' }} title="Generate AI summary">
                  {loadingId === a.id + '-summary' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => toggleActive(a.id, a.is_active)} disabled={loadingId === a.id}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={a.is_active
                    ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }
                    : { background: 'var(--surface-2)', color: 'var(--text-ter)', border: '1px solid var(--border-2)' }}>
                  {loadingId === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : a.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {a.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Flagged comments */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-1)' }}>
          <h2 className="text-sm font-bold text-white">Flagged Comments ({flags.length})</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-1)' }}>
          {flags.length === 0 && (
            <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-ter)' }}>No flagged comments</div>
          )}
          {flags.map(f => (
            <div key={f.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--debrief-accent)' }}>
                    Flag: {f.reason}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-sec)' }}>
                    {f.accident_comments?.body || '(comment not found)'}
                  </p>
                  {f.accident_comments?.is_removed && (
                    <p className="text-xs mt-1 text-green-400">Already removed</p>
                  )}
                </div>
                {!f.accident_comments?.is_removed && (
                  <button onClick={() => removeComment(f.comment_id)}
                    className="shrink-0 p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Remove comment">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
