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
  BarChart3,
  Target,
  Activity,
  UserCheck,
  UserX,
  ShieldCheck,
  DollarSign,
  Trash2,
} from 'lucide-react'

interface AdminClientProps {
  stats: {
    totalUsers: number
    totalQuestions: number
    totalSessions: number
    avgScore: number
    passRate: number
    subCounts: Record<string, number>
    mrr: number
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

export default function AdminClient({ stats, recentUsers: initialUsers, recentSessions }: AdminClientProps) {
  const [tab, setTab] = useState<'overview' | 'questions' | 'users'>('overview')
  const [users, setUsers] = useState(initialUsers)
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
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const totalPaid = Object.values(stats.subCounts).reduce((a, b) => a + b, 0)
  const freeUsers = stats.totalUsers - totalPaid

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

  async function updateUser(id: string, payload: Record<string, unknown>) {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const updated = await res.json()
        setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updated } : u)))
      }
    } finally {
      setActionLoading(null)
    }
  }

  function grantStudyPass(id: string) {
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    updateUser(id, { subscription_status: 'study_pass', subscription_expires_at: expires.toISOString() })
  }

  function revokeSubscription(id: string) {
    updateUser(id, { subscription_status: 'free', subscription_expires_at: null })
  }

  function toggleAdmin(id: string, currentIsAdmin: boolean) {
    updateUser(id, { is_admin: !currentIsAdmin })
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
          {/* Top stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

          {/* Second row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Sessions', value: stats.totalSessions, icon: <Activity className="w-5 h-5 text-blue-400" /> },
              { label: 'Avg Exam Score', value: stats.avgScore > 0 ? `${stats.avgScore}%` : '—', icon: <Target className="w-5 h-5 text-orange-400" /> },
              { label: 'Pass Rate', value: stats.passRate > 0 ? `${stats.passRate}%` : '—', icon: <BarChart3 className="w-5 h-5 text-green-400" /> },
              { label: 'Est. MRR', value: `$${stats.mrr}`, icon: <DollarSign className="w-5 h-5 text-[#FFB627]" /> },
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
                {recentSessions.slice(0, 8).map((u: Record<string, unknown>) => (
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
                      {s.score !== null && s.score !== undefined && (
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

          {/* Subscription breakdown */}
          <div className="glass-card p-6 mt-6">
            <h3 className="font-semibold text-white mb-4">User Breakdown</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="text-2xl font-bold text-white/40">{freeUsers}</div>
                <div className="text-xs text-white/30 mt-1">Free Trial</div>
              </div>
              <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(62,146,204,0.08)' }}>
                <div className="text-2xl font-bold text-[#3E92CC]">{stats.subCounts['study_pass'] || 0}</div>
                <div className="text-xs text-white/50 mt-1">Study Pass</div>
              </div>
              <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,182,39,0.08)' }}>
                <div className="text-2xl font-bold text-[#FFB627]">{totalPaid}</div>
                <div className="text-xs text-white/50 mt-1">Total Paid</div>
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
          <h3 className="font-semibold text-white mb-4">All Users ({users.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-left">
                  <th className="pb-3 font-medium">Name / Email</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Joined</th>
                  <th className="pb-3 font-medium">Expires</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u: Record<string, unknown>) => {
                  const isLoading = actionLoading === u.id
                  const isAdmin = u.is_admin as boolean
                  const isFree = (u.subscription_status as string) === 'free'
                  return (
                    <tr key={u.id as string}>
                      <td className="py-3">
                        <div className="font-medium text-white flex items-center gap-1.5">
                          {u.full_name as string || '—'}
                          {isAdmin && <Shield className="w-3 h-3 text-[#FFB627]" />}
                        </div>
                        <div className="text-white/40 text-xs">{u.email as string}</div>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${SUB_COLORS[(u.subscription_status as string)] || ''}`}>
                          {u.subscription_status as string}
                        </span>
                      </td>
                      <td className="py-3 text-white/60">{formatDate(u.created_at as string)}</td>
                      <td className="py-3 text-white/40">{u.subscription_expires_at ? formatDate(u.subscription_expires_at as string) : '—'}</td>
                      <td className="py-3">
                        <div className="flex gap-1.5">
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                          ) : (
                            <>
                              {isFree ? (
                                <button
                                  onClick={() => grantStudyPass(u.id as string)}
                                  title="Grant Study Pass (1 year)"
                                  className="p-1.5 rounded-lg hover:bg-green-400/10 text-green-400 transition-colors"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => revokeSubscription(u.id as string)}
                                  title="Revoke subscription"
                                  className="p-1.5 rounded-lg hover:bg-red-400/10 text-red-400 transition-colors"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => toggleAdmin(u.id as string, isAdmin)}
                                title={isAdmin ? 'Remove admin' : 'Make admin'}
                                className={`p-1.5 rounded-lg transition-colors ${isAdmin ? 'text-[#FFB627] hover:bg-[#FFB627]/10' : 'text-white/30 hover:text-[#FFB627] hover:bg-[#FFB627]/10'}`}
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
