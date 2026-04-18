'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import {
  Users,
  BookOpen,
  CreditCard,
  TrendingUp,
  Shield,
  Plus,
  Loader2,
  CheckCircle,
} from 'lucide-react'

interface AdminClientProps {
  stats: {
    totalUsers: number
    totalQuestions: number
    subCounts: Record<string, number>
  }
  recentUsers: Record<string, unknown>[]
  recentSessions: Record<string, unknown>[]
}

const SUB_COLORS: Record<string, string> = {
  study_pass: 'text-[#3E92CC] bg-[#3E92CC]/10',
  checkride_prep: 'text-[#FFB627] bg-[#FFB627]/10',
  annual: 'text-green-400 bg-green-400/10',
  free: 'text-white/40 bg-white/5',
}

export default function AdminClient({ stats, recentUsers, recentSessions }: AdminClientProps) {
  const [tab, setTab] = useState<'overview' | 'questions' | 'users'>('overview')
  const [newQ, setNewQ] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    category: 'Regulations',
    difficulty: 'medium',
    explanation: '',
    reference: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const totalPaid = Object.values(stats.subCounts).reduce((a, b) => a + b, 0)

  async function saveQuestion(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQ),
      })
      if (res.ok) {
        setSaved(true)
        setNewQ({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', category: 'Regulations', difficulty: 'medium', explanation: '', reference: '' })
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-7 h-7 text-[#FFB627]" />
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {(['overview', 'questions', 'users'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-[#3E92CC] text-white' : 'text-white/50 hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: <Users className="w-5 h-5 text-[#3E92CC]" /> },
              { label: 'Total Questions', value: stats.totalQuestions, icon: <BookOpen className="w-5 h-5 text-[#FFB627]" /> },
              { label: 'Paid Subscribers', value: totalPaid, icon: <CreditCard className="w-5 h-5 text-green-400" /> },
              { label: 'Study Pass', value: stats.subCounts['study_pass'] || 0, icon: <TrendingUp className="w-5 h-5 text-purple-400" /> },
            ].map(s => (
              <div key={s.label} className="glass-card p-5">
                <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-white/50 text-xs">{s.label}</span></div>
                <div className="text-3xl font-bold text-white">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="font-semibold text-white mb-4">Recent Users</h3>
              <div className="space-y-3">
                {recentUsers.map((u: Record<string, unknown>) => (
                  <div key={u.id as string} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{u.full_name as string || u.email as string}</div>
                      <div className="text-xs text-white/40">{formatDate(u.created_at as string)}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${SUB_COLORS[(u.subscription_status as string)] || ''}`}>
                      {u.subscription_status as string}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-semibold text-white mb-4">Recent Sessions</h3>
              <div className="space-y-3">
                {recentSessions.map((s: Record<string, unknown>) => {
                  const u = s.users as Record<string, unknown> | null
                  return (
                    <div key={s.id as string} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">{u?.email as string || 'Unknown'}</div>
                        <div className="text-xs text-white/40">{s.session_type as string} · {formatDate(s.started_at as string)}</div>
                      </div>
                      {s.score !== null && (
                        <span className={`text-sm font-semibold ${((s.score as number) / 60) >= 0.7 ? 'text-green-400' : 'text-red-400'}`}>
                          {s.score as number}/60
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'questions' && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Plus className="w-5 h-5 text-[#3E92CC]" />
            <h3 className="font-semibold text-white text-lg">Add New Question</h3>
          </div>
          <form onSubmit={saveQuestion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Question Text</label>
              <textarea
                value={newQ.question_text}
                onChange={e => setNewQ(p => ({ ...p, question_text: e.target.value }))}
                placeholder="Enter the question..."
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(['a', 'b', 'c', 'd'] as const).map(opt => (
                <div key={opt}>
                  <label className="block text-sm font-medium text-white/80 mb-2">Option {opt.toUpperCase()}</label>
                  <input
                    type="text"
                    value={newQ[`option_${opt}` as keyof typeof newQ] as string}
                    onChange={e => setNewQ(p => ({ ...p, [`option_${opt}`]: e.target.value }))}
                    placeholder={`Option ${opt.toUpperCase()}`}
                    required
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Correct Answer</label>
                <select value={newQ.correct_answer} onChange={e => setNewQ(p => ({ ...p, correct_answer: e.target.value }))}>
                  {['A','B','C','D'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Category</label>
                <select value={newQ.category} onChange={e => setNewQ(p => ({ ...p, category: e.target.value }))}>
                  {['Regulations','Airspace','Weather Theory','Weather Services','Aircraft Performance','Weight & Balance','Aerodynamics','Flight Instruments','Navigation'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Difficulty</label>
                <select value={newQ.difficulty} onChange={e => setNewQ(p => ({ ...p, difficulty: e.target.value }))}>
                  {['easy','medium','hard'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Explanation</label>
              <textarea
                value={newQ.explanation}
                onChange={e => setNewQ(p => ({ ...p, explanation: e.target.value }))}
                placeholder="Brief explanation of the correct answer..."
                rows={2}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Reference (optional)</label>
              <input
                type="text"
                value={newQ.reference}
                onChange={e => setNewQ(p => ({ ...p, reference: e.target.value }))}
                placeholder="e.g. FAR 91.155"
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary justify-center py-3">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <><CheckCircle className="w-5 h-5" /> Saved!</> : <><Plus className="w-5 h-5" /> Add Question</>}
            </button>
          </form>
        </div>
      )}

      {tab === 'users' && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">All Users ({recentUsers.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-left">
                  <th className="pb-3 font-medium">Name / Email</th>
                  <th className="pb-3 font-medium">Subscription</th>
                  <th className="pb-3 font-medium">Joined</th>
                  <th className="pb-3 font-medium">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentUsers.map((u: Record<string, unknown>) => (
                  <tr key={u.id as string}>
                    <td className="py-3">
                      <div className="font-medium text-white">{u.full_name as string || '—'}</div>
                      <div className="text-white/40 text-xs">{u.email as string}</div>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-md font-medium ${SUB_COLORS[(u.subscription_status as string)] || ''}`}>
                        {u.subscription_status as string}
                      </span>
                    </td>
                    <td className="py-3 text-white/60">{formatDate(u.created_at as string)}</td>
                    <td className="py-3 text-white/40">{u.subscription_expires_at ? formatDate(u.subscription_expires_at as string) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
