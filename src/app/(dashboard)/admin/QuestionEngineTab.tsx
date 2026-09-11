'use client'

import { Fragment, useEffect, useState, useCallback } from 'react'
import { Loader2, Sparkles, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

interface ConceptRow {
  id: string
  slug: string
  name: string
  exam_type: string
  category: string
  acs_area: string
  is_active: boolean
  archetypeCount: number
  approvedQuestionCount: number
}

interface LogEntry {
  id: string
  concept_id: string | null
  question_id: string | null
  validation_result: 'approved' | 'rejected'
  rejection_reason: string | null
  model: string
  provider: string | null
  model_version: string | null
  mode: string | null
  semantic_validation: Record<string, boolean | string> | null
  prompt_tokens: number | null
  completion_tokens: number | null
  latency_ms: number | null
  estimated_cost_usd: number | null
  raw_output: Record<string, unknown> | null
  created_at: string
  concepts: { name: string; slug: string } | null
  question_archetypes: { scenario_type: string; cognitive_level: string } | null
}

const PROVIDERS = [
  { value: '', label: 'Default (Anthropic, legacy path)' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Gemini' },
] as const

const MODES = [
  { value: 'new_question', label: 'New Question' },
  { value: 'novel_variant', label: 'Novel Variant' },
  { value: 'prove_it', label: 'Prove It' },
  { value: 'weakness_attack', label: 'Weakness Attack' },
  { value: 'transfer', label: 'Transfer' },
] as const

/** Admin visibility into the validated question-generation pipeline
 * (concepts → archetypes → generate → validate → log → approve), which previously
 * had none — every concept, its coverage, and every generation attempt (approved or
 * rejected) is invisible outside this tab otherwise. Concepts are defined in code
 * (src/lib/generation/concepts.ts) and seeded via scripts/seed-concepts.js — this
 * tab reads and triggers generation, it does not create/edit concepts, so the DB
 * and the git-tracked source of truth never drift apart. */
export default function QuestionEngineTab() {
  const [concepts, setConcepts] = useState<ConceptRow[]>([])
  const [log, setLog] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [notReady, setNotReady] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<Record<string, string>>({})
  const [provider, setProvider] = useState('')
  const [mode, setMode] = useState<string>('new_question')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [statusOverride, setStatusOverride] = useState<Record<string, 'approved' | 'rejected'>>({})
  const [actioning, setActioning] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [conceptsRes, logRes] = await Promise.all([
        fetch('/api/admin/concepts'),
        fetch('/api/admin/generation-log?limit=40'),
      ])
      const conceptsData = await conceptsRes.json()
      const logData = await logRes.json()
      if (conceptsData.notReady || logData.notReady) setNotReady(true)
      setConcepts(conceptsData.concepts || [])
      setLog(logData.entries || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function generateNow(slug: string) {
    setGenerating(slug)
    setLastResult(prev => ({ ...prev, [slug]: '' }))
    try {
      const res = await fetch('/api/admin/concepts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(provider ? { slug, provider, mode } : { slug }),
      })
      const data = await res.json()
      setLastResult(prev => ({
        ...prev,
        [slug]: data.error
          ? `Error: ${data.error}`
          : provider
            ? (data.approved ? `Approved via ${data.provider} (${data.model})` : `Rejected: ${data.reason}`)
            : (data.approved ? `Approved (${data.attempts} attempt${data.attempts === 1 ? '' : 's'})` : `Rejected all ${data.attempts} attempts`),
      }))
      await load()
    } finally {
      setGenerating(null)
    }
  }

  async function setQuestionStatus(entry: LogEntry, status: 'approved' | 'rejected') {
    if (!entry.question_id) return
    setActioning(entry.id)
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entry.question_id, validation_status: status }),
      })
      if (res.ok) setStatusOverride(prev => ({ ...prev, [entry.id]: status }))
    } finally {
      setActioning(null)
    }
  }

  if (loading) {
    return <div className="glass-card p-8 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>
  }

  if (notReady) {
    return (
      <div className="glass-card p-6">
        <h3 className="font-semibold text-white mb-2">Question engine tables not found</h3>
        <p className="text-sm text-white/60">
          Run the migrations in <code className="text-[#FFB627]">supabase/migrations/20260831_001_question_engine_foundation.sql</code> and{' '}
          <code className="text-[#FFB627]">20260906_001_mastery_confidence_extension.sql</code> in the Supabase SQL editor, then{' '}
          <code className="text-[#FFB627]">node scripts/seed-concepts.js</code> to populate concepts, and reload this tab.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FFB627]" /> Concepts ({concepts.length})
          </h3>
          <button onClick={load} className="text-white/40 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Phase 5 — provider/mode picker for "Generate now" below. Leaving provider on
            "Default" reproduces the exact prior behavior (Anthropic, no mode concept). */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          <span className="text-white/40">Provider:</span>
          <select value={provider} onChange={e => setProvider(e.target.value)} className="px-2 py-1.5 rounded-lg bg-white/5 text-white/70 outline-none">
            {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {provider && (
            <>
              <span className="text-white/40 ml-2">Mode:</span>
              <select value={mode} onChange={e => setMode(e.target.value)} className="px-2 py-1.5 rounded-lg bg-white/5 text-white/70 outline-none">
                {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 text-xs uppercase tracking-wide">
                <th className="pb-2 pr-4">Concept</th>
                <th className="pb-2 pr-4">Exam</th>
                <th className="pb-2 pr-4">Category</th>
                <th className="pb-2 pr-4">Archetypes</th>
                <th className="pb-2 pr-4">Approved Qs</th>
                <th className="pb-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {concepts.map(c => (
                <tr key={c.id} className="border-t border-white/5">
                  <td className="py-2.5 pr-4 text-white">{c.name}</td>
                  <td className="py-2.5 pr-4 text-white/50 uppercase text-xs">{c.exam_type}</td>
                  <td className="py-2.5 pr-4 text-white/50">{c.category}</td>
                  <td className="py-2.5 pr-4 text-white/50">{c.archetypeCount}</td>
                  <td className="py-2.5 pr-4">
                    <span className={c.approvedQuestionCount < 20 ? 'text-[#FFB627]' : 'text-green-400'}>{c.approvedQuestionCount}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <button
                      onClick={() => generateNow(c.slug)}
                      disabled={generating === c.slug}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[#3E92CC]/15 text-[#3E92CC] hover:bg-[#3E92CC]/25 transition-colors disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                    >
                      {generating === c.slug ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Generate now'}
                    </button>
                    {lastResult[c.slug] && (
                      <div className="text-[10px] text-white/40 mt-1 text-right">{lastResult[c.slug]}</div>
                    )}
                  </td>
                </tr>
              ))}
              {concepts.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-white/30">No concepts seeded yet — run scripts/seed-concepts.js.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold text-white mb-4">Recent generation attempts</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 text-xs uppercase tracking-wide">
                <th className="pb-2 pr-4">Concept</th>
                <th className="pb-2 pr-4">Archetype</th>
                <th className="pb-2 pr-4">Provider</th>
                <th className="pb-2 pr-4">Result</th>
                <th className="pb-2 pr-4">Reason</th>
                <th className="pb-2 pr-4">Latency / Cost</th>
                <th className="pb-2 pr-4">When</th>
                <th className="pb-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {log.map(entry => {
                const effectiveStatus = statusOverride[entry.id]
                const isExpanded = expanded === entry.id
                return (
                  <Fragment key={entry.id}>
                    <tr className="border-t border-white/5">
                      <td className="py-2.5 pr-4 text-white/70">{entry.concepts?.name ?? '—'}</td>
                      <td className="py-2.5 pr-4 text-white/50 text-xs">
                        {entry.question_archetypes
                          ? <span>{entry.question_archetypes.scenario_type} <span className="text-white/30">· {entry.question_archetypes.cognitive_level}</span></span>
                          : '—'}
                      </td>
                      <td className="py-2.5 pr-4">
                        {entry.validation_result === 'approved' ? (
                          effectiveStatus === 'rejected' ? (
                            <span className="flex items-center gap-1 text-white/40 text-xs"><XCircle className="w-3.5 h-3.5" /> Pulled</span>
                          ) : (
                            <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle className="w-3.5 h-3.5" /> Approved</span>
                          )
                        ) : (
                          <span className="flex items-center gap-1 text-red-400 text-xs"><XCircle className="w-3.5 h-3.5" /> Rejected</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-xs">
                        <span className="text-white/60">{entry.provider ?? '—'}</span>
                        {entry.model_version && <span className="text-white/30"> · {entry.model_version}</span>}
                        {entry.mode && entry.mode !== 'new_question' && <span className="text-[#3E92CC]"> · {entry.mode}</span>}
                      </td>
                      <td className="py-2.5 pr-4 text-white/40 text-xs max-w-md truncate" title={entry.rejection_reason ?? ''}>{entry.rejection_reason ?? '—'}</td>
                      <td className="py-2.5 pr-4 text-white/30 text-xs whitespace-nowrap">
                        {entry.latency_ms != null ? `${entry.latency_ms}ms` : '—'}
                        {entry.estimated_cost_usd != null && <span> · ${entry.estimated_cost_usd.toFixed(4)}</span>}
                      </td>
                      <td className="py-2.5 pr-4 text-white/30 text-xs whitespace-nowrap">{new Date(entry.created_at).toLocaleString()}</td>
                      <td className="py-2.5 pr-4 text-right whitespace-nowrap">
                        <button onClick={() => setExpanded(isExpanded ? null : entry.id)} className="text-white/40 hover:text-white transition-colors inline-flex items-center gap-1 text-xs mr-2">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} Details
                        </button>
                        {entry.validation_result === 'approved' && entry.question_id && (
                          effectiveStatus === 'rejected' ? (
                            <button disabled={actioning === entry.id} onClick={() => setQuestionStatus(entry, 'approved')} className="text-xs px-2 py-1 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 disabled:opacity-50">
                              Restore
                            </button>
                          ) : (
                            <button disabled={actioning === entry.id} onClick={() => setQuestionStatus(entry, 'rejected')} className="text-xs px-2 py-1 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 disabled:opacity-50">
                              Pull
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-t border-white/5 bg-black/20">
                        <td colSpan={8} className="py-3 px-4">
                          <div className="text-xs text-white/50 mb-2">Model: {entry.model} · Full reason: {entry.rejection_reason ?? '—'}</div>
                          {entry.semantic_validation && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {Object.entries(entry.semantic_validation).filter(([k]) => k !== 'reason').map(([k, v]) => (
                                <span key={k} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: v ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: v ? '#22c55e' : '#ef4444' }}>
                                  {k.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                          {entry.raw_output ? (
                            <pre className="text-[11px] text-white/60 bg-black/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(entry.raw_output, null, 2)}</pre>
                          ) : (
                            <div className="text-xs text-white/30">No candidate output recorded (failed before generation).</div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
              {log.length === 0 && (
                <tr><td colSpan={8} className="py-6 text-center text-white/30">No generation attempts logged yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
