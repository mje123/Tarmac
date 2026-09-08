'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Search, CheckCircle, XCircle, Trash2, Pencil, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string | null
  correct_answer: string
  category: string
  difficulty: string
  explanation: string
  reference: string | null
  exam_type: string
  concept_id: string | null
  cognitive_level: string | null
  scenario_type: string | null
  distractor_rationale: string | null
  common_trap: string | null
  validation_status: string
  novelty_key: string | null
  created_at: string
}

const PAGE_SIZE = 20

const STATUS_COLORS: Record<string, string> = {
  approved: '#22c55e',
  legacy: '#3E92CC',
  rejected: '#ef4444',
  pending: '#FFB627',
}

/** Browse/search/approve/reject/edit the question bank — the admin PATCH/DELETE
 * endpoints already existed and worked, but nothing in the UI ever called them
 * outside the single-question "Add New Question" form below. */
export default function QuestionBrowserTab() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [examType, setExamType] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<Question>>({})
  const [actioning, setActioning] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (examType) params.set('examType', examType)
      if (search) params.set('search', search)
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String(page * PAGE_SIZE))
      const res = await fetch(`/api/admin/questions?${params}`)
      const data = await res.json()
      setQuestions(data.questions || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [status, examType, search, page])

  useEffect(() => { load() }, [load])

  async function patch(id: string, body: Record<string, unknown>) {
    setActioning(id)
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...body }),
      })
      if (res.ok) await load()
    } finally {
      setActioning(null)
    }
  }

  async function remove(id: string) {
    if (!confirm('Permanently delete this question? This cannot be undone.')) return
    setActioning(id)
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) await load()
    } finally {
      setActioning(null)
    }
  }

  function startEdit(q: Question) {
    setEditingId(q.id)
    setEditDraft({
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d ?? '',
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      reference: q.reference ?? '',
    })
  }

  async function saveEdit(id: string) {
    await patch(id, editDraft)
    setEditingId(null)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="glass-card p-6 mb-4">
      <h3 className="font-semibold text-white text-lg mb-4">Question Bank Browser</h3>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <Search className="w-4 h-4 text-white/30" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setPage(0); setSearch(searchInput) } }}
            placeholder="Search question text…"
            className="bg-transparent text-sm text-white outline-none flex-1 placeholder:text-white/30"
          />
        </div>
        <select value={status} onChange={e => { setPage(0); setStatus(e.target.value) }} className="text-sm px-3 py-2 rounded-lg bg-white/5 text-white/70 outline-none">
          <option value="">All statuses</option>
          <option value="approved">Approved</option>
          <option value="legacy">Legacy</option>
          <option value="rejected">Rejected</option>
          <option value="pending">Pending</option>
        </select>
        <select value={examType} onChange={e => { setPage(0); setExamType(e.target.value) }} className="text-sm px-3 py-2 rounded-lg bg-white/5 text-white/70 outline-none">
          <option value="">PPL + IFR</option>
          <option value="ppl">PPL</option>
          <option value="ifr">IFR</option>
        </select>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>
      ) : (
        <div className="space-y-2">
          {questions.map(q => (
            <div key={q.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${STATUS_COLORS[q.validation_status] ?? '#888'}20`, color: STATUS_COLORS[q.validation_status] ?? '#888' }}>
                    {q.validation_status}
                  </span>
                  <span className="text-xs text-white/40">{q.category}</span>
                  <span className="text-xs text-white/30 uppercase">{q.exam_type}</span>
                  {q.cognitive_level && <span className="text-xs text-[#3E92CC]">{q.cognitive_level}</span>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {q.validation_status !== 'approved' && (
                    <button disabled={actioning === q.id} onClick={() => patch(q.id, { validation_status: 'approved' })} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/15 disabled:opacity-40" title="Approve">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {q.validation_status !== 'rejected' && (
                    <button disabled={actioning === q.id} onClick={() => patch(q.id, { validation_status: 'rejected' })} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 disabled:opacity-40" title="Reject">
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button disabled={actioning === q.id} onClick={() => startEdit(q)} className="p-1.5 rounded-lg text-[#3E92CC] hover:bg-[#3E92CC]/15 disabled:opacity-40" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button disabled={actioning === q.id} onClick={() => remove(q.id)} className="p-1.5 rounded-lg text-white/40 hover:bg-red-500/15 hover:text-red-400 disabled:opacity-40" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {editingId === q.id ? (
                <div className="space-y-2 mt-2">
                  <textarea value={editDraft.question_text} onChange={e => setEditDraft(d => ({ ...d, question_text: e.target.value }))} className="w-full text-sm p-2 rounded-lg bg-white/5 text-white outline-none" rows={2} />
                  {(['option_a', 'option_b', 'option_c', 'option_d'] as const).map(key => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-white/40 w-4">{key.slice(-1).toUpperCase()}</span>
                      <input value={editDraft[key] ?? ''} onChange={e => setEditDraft(d => ({ ...d, [key]: e.target.value }))} className="flex-1 text-sm p-2 rounded-lg bg-white/5 text-white outline-none" />
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">Correct</span>
                    <select value={editDraft.correct_answer} onChange={e => setEditDraft(d => ({ ...d, correct_answer: e.target.value }))} className="text-sm p-2 rounded-lg bg-white/5 text-white outline-none">
                      {['A', 'B', 'C', 'D'].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <textarea value={editDraft.explanation} onChange={e => setEditDraft(d => ({ ...d, explanation: e.target.value }))} placeholder="Explanation" className="w-full text-sm p-2 rounded-lg bg-white/5 text-white outline-none" rows={2} />
                  <input value={editDraft.reference ?? ''} onChange={e => setEditDraft(d => ({ ...d, reference: e.target.value }))} placeholder="Reference" className="w-full text-sm p-2 rounded-lg bg-white/5 text-white outline-none" />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(q.id)} className="text-xs px-3 py-1.5 rounded-lg bg-[#3E92CC]/20 text-[#3E92CC] font-semibold">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/50 flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-white/80 mb-1">{q.question_text}</p>
                  <p className="text-xs text-white/40">Correct: {q.correct_answer}</p>
                </>
              )}
            </div>
          ))}
          {questions.length === 0 && (
            <div className="py-8 text-center text-white/30 text-sm">No questions match this filter.</div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 text-sm text-white/40">
        <span>{total} question{total === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2">
          <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
          <span>Page {page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  )
}
