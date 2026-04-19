'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import {
  Users, BookOpen, CreditCard, TrendingUp, Shield, Plus, Loader2,
  CheckCircle, BarChart3, Target, Activity, UserCheck, UserX,
  ShieldCheck, DollarSign, Trash2, Link2, CheckSquare, Bug,
} from 'lucide-react'

interface Influencer {
  id: string
  name: string
  email: string
  promo_code: string
  commission_pct: number
  created_at: string
  referralCount: number
  totalRevenueCents: number
  commissionOwedCents: number
  unpaidReferrals: number
}

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
  free: 'text-white/40 bg-white/5',
}

export default function AdminClient({ stats, recentUsers: initialUsers, recentSessions }: AdminClientProps) {
  const [tab, setTab] = useState<'overview' | 'questions' | 'users' | 'influencers' | 'bugs' | 'applications'>('overview')
  const [users, setUsers] = useState(initialUsers)
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [influencersLoaded, setInfluencersLoaded] = useState(false)
  const [newQ, setNewQ] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_answer: 'A', category: 'Regulations', difficulty: 'medium', explanation: '', reference: '',
  })
  const [newInf, setNewInf] = useState({ name: '', email: '', promo_code: '', commission_pct: 20 })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [infLoading, setInfLoading] = useState<string | null>(null)
  const [addingInf, setAddingInf] = useState(false)
  const [bugs, setBugs] = useState<Record<string, unknown>[]>([])
  const [bugsLoaded, setBugsLoaded] = useState(false)
  const [bugLoading, setBugLoading] = useState<string | null>(null)
  const [applications, setApplications] = useState<Record<string, unknown>[]>([])
  const [applicationsLoaded, setApplicationsLoaded] = useState(false)

  const totalPaid = Object.values(stats.subCounts).reduce((a, b) => a + b, 0)
  const freeUsers = stats.totalUsers - totalPaid

  async function loadInfluencers() {
    if (influencersLoaded) return
    const res = await fetch('/api/admin/influencers')
    const data = await res.json()
    setInfluencers(data)
    setInfluencersLoaded(true)
  }

  async function loadBugs() {
    if (bugsLoaded) return
    const res = await fetch('/api/admin/bug-reports')
    const data = await res.json()
    setBugs(data)
    setBugsLoaded(true)
  }

  async function loadApplications() {
    if (applicationsLoaded) return
    const res = await fetch('/api/admin/influencer-applications')
    const data = await res.json()
    setApplications(data)
    setApplicationsLoaded(true)
  }

  async function updateBugStatus(id: string, status: string) {
    setBugLoading(id)
    try {
      await fetch(`/api/admin/bug-reports/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      setBugs(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    } finally { setBugLoading(null) }
  }

  async function deleteBug(id: string) {
    setBugLoading(id)
    try {
      await fetch(`/api/admin/bug-reports/${id}`, { method: 'DELETE' })
      setBugs(prev => prev.filter(b => b.id !== id))
    } finally { setBugLoading(null) }
  }

  function handleTabChange(t: typeof tab) {
    setTab(t)
    if (t === 'influencers') loadInfluencers()
    if (t === 'bugs') loadBugs()
    if (t === 'applications') loadApplications()
  }

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
    } finally { setSaving(false) }
  }

  async function updateUser(id: string, payload: Record<string, unknown>) {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const updated = await res.json()
        setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updated } : u)))
      }
    } finally { setActionLoading(null) }
  }

  function grantStudyPass(id: string) {
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    updateUser(id, { subscription_status: 'study_pass', subscription_expires_at: expires.toISOString() })
  }
  function revokeSubscription(id: string) { updateUser(id, { subscription_status: 'free', subscription_expires_at: null }) }
  function toggleAdmin(id: string, current: boolean) { updateUser(id, { is_admin: !current }) }

  async function addInfluencer(e: React.FormEvent) {
    e.preventDefault()
    setAddingInf(true)
    try {
      const res = await fetch('/api/admin/influencers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInf),
      })
      const data = await res.json()
      if (res.ok) {
        setInfluencers(prev => [{ ...data, referralCount: 0, totalRevenueCents: 0, commissionOwedCents: 0, unpaidReferrals: 0 }, ...prev])
        setNewInf({ name: '', email: '', promo_code: '', commission_pct: 20 })
      } else {
        alert(`Error: ${data.error || res.status}`)
      }
    } finally { setAddingInf(false) }
  }

  async function markPaid(id: string) {
    setInfLoading(id)
    try {
      const res = await fetch(`/api/admin/influencers/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllPaid: true }),
      })
      if (res.ok) {
        setInfluencers(prev => prev.map(inf => inf.id === id
          ? { ...inf, commissionOwedCents: 0, unpaidReferrals: 0 }
          : inf
        ))
      }
    } finally { setInfLoading(null) }
  }

  async function deleteInfluencer(id: string) {
    setInfLoading(id)
    try {
      await fetch(`/api/admin/influencers/${id}`, { method: 'DELETE' })
      setInfluencers(prev => prev.filter(inf => inf.id !== id))
    } finally { setInfLoading(null) }
  }

  const totalCommissionOwed = influencers.reduce((sum, inf) => sum + inf.commissionOwedCents, 0)

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-7 h-7 text-[#FFB627]" />
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {(['overview', 'questions', 'users', 'influencers', 'bugs', 'applications'] as const).map(t => (
          <button key={t} onClick={() => handleTabChange(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all flex items-center gap-1.5 ${tab === t ? 'bg-[#3E92CC] text-white' : 'text-white/50 hover:text-white'}`}>
            {t === 'bugs' && <Bug className="w-3.5 h-3.5" />}
            {t === 'applications' ? 'Applications' : t}
            {t === 'bugs' && bugs.filter(b => b.status === 'open').length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">
                {bugs.filter(b => b.status === 'open').length}
              </span>
            )}
            {t === 'applications' && applicationsLoaded && applications.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFB627] text-black">
                {applications.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
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
                {users.slice(0, 8).map((u: Record<string, unknown>) => (
                  <div key={u.id as string} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{u.full_name as string || u.email as string}</div>
                      <div className="text-xs text-white/40">{formatDate(u.created_at as string)}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${SUB_COLORS[(u.subscription_status as string)] || 'text-white/40 bg-white/5'}`}>
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
              <textarea value={newQ.question_text} onChange={e => setNewQ(p => ({ ...p, question_text: e.target.value }))} placeholder="Enter the question..." rows={3} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(['a', 'b', 'c', 'd'] as const).map(opt => (
                <div key={opt}>
                  <label className="block text-sm font-medium text-white/80 mb-2">Option {opt.toUpperCase()}</label>
                  <input type="text" value={newQ[`option_${opt}` as keyof typeof newQ] as string} onChange={e => setNewQ(p => ({ ...p, [`option_${opt}`]: e.target.value }))} placeholder={`Option ${opt.toUpperCase()}`} required />
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
              <textarea value={newQ.explanation} onChange={e => setNewQ(p => ({ ...p, explanation: e.target.value }))} placeholder="Explanation..." rows={2} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Reference (optional)</label>
              <input type="text" value={newQ.reference} onChange={e => setNewQ(p => ({ ...p, reference: e.target.value }))} placeholder="e.g. FAR 91.155" />
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
                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${SUB_COLORS[(u.subscription_status as string)] || 'text-white/40 bg-white/5'}`}>
                          {u.subscription_status as string}
                        </span>
                      </td>
                      <td className="py-3 text-white/60">{formatDate(u.created_at as string)}</td>
                      <td className="py-3 text-white/40">{u.subscription_expires_at ? formatDate(u.subscription_expires_at as string) : '—'}</td>
                      <td className="py-3">
                        <div className="flex gap-1.5">
                          {isLoading ? <Loader2 className="w-4 h-4 text-white/40 animate-spin" /> : (
                            <>
                              {isFree ? (
                                <button onClick={() => grantStudyPass(u.id as string)} title="Grant Study Pass (1 year)" className="p-1.5 rounded-lg hover:bg-green-400/10 text-green-400 transition-colors">
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              ) : (
                                <button onClick={() => revokeSubscription(u.id as string)} title="Revoke" className="p-1.5 rounded-lg hover:bg-red-400/10 text-red-400 transition-colors">
                                  <UserX className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={() => toggleAdmin(u.id as string, isAdmin)} title={isAdmin ? 'Remove admin' : 'Make admin'} className={`p-1.5 rounded-lg transition-colors ${isAdmin ? 'text-[#FFB627] hover:bg-[#FFB627]/10' : 'text-white/30 hover:text-[#FFB627] hover:bg-[#FFB627]/10'}`}>
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

      {tab === 'influencers' && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-2"><Link2 className="w-5 h-5 text-[#3E92CC]" /><span className="text-white/50 text-xs">Total Influencers</span></div>
              <div className="text-3xl font-bold text-white">{influencers.length}</div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5 text-green-400" /><span className="text-white/50 text-xs">Total Referrals</span></div>
              <div className="text-3xl font-bold text-white">{influencers.reduce((s, i) => s + i.referralCount, 0)}</div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5 text-[#FFB627]" /><span className="text-white/50 text-xs">Commission Owed</span></div>
              <div className="text-3xl font-bold text-[#FFB627]">${(totalCommissionOwed / 100).toFixed(2)}</div>
            </div>
          </div>

          {/* Add influencer */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-[#3E92CC]" /> Add Influencer</h3>
            <form onSubmit={addInfluencer} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-white/50 mb-1">Name *</label>
                <input type="text" value={newInf.name} onChange={e => setNewInf(p => ({ ...p, name: e.target.value }))} placeholder="Jake Paul" required />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Email</label>
                <input type="email" value={newInf.email} onChange={e => setNewInf(p => ({ ...p, email: e.target.value }))} placeholder="jake@email.com" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Promo Code * (must match Stripe exactly)</label>
                <input type="text" value={newInf.promo_code} onChange={e => setNewInf(p => ({ ...p, promo_code: e.target.value.toUpperCase() }))} placeholder="JAKE20" required />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Commission %</label>
                <input type="number" min={1} max={100} value={newInf.commission_pct} onChange={e => setNewInf(p => ({ ...p, commission_pct: parseInt(e.target.value) }))} />
              </div>
              <div className="md:col-span-4">
                <button type="submit" disabled={addingInf} className="btn-primary py-2.5 px-6 text-sm">
                  {addingInf ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add Influencer</>}
                </button>
              </div>
            </form>
          </div>

          {/* Influencer table */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4">Influencers</h3>
            {influencers.length === 0 ? (
              <p className="text-white/30 text-sm">No influencers yet. Add one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/40 text-left">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Code</th>
                      <th className="pb-3 font-medium">Commission</th>
                      <th className="pb-3 font-medium">Referrals</th>
                      <th className="pb-3 font-medium">Revenue</th>
                      <th className="pb-3 font-medium">Owed</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {influencers.map(inf => (
                      <tr key={inf.id}>
                        <td className="py-3">
                          <div className="font-medium text-white">{inf.name}</div>
                          {inf.email && <div className="text-xs text-white/40">{inf.email}</div>}
                        </td>
                        <td className="py-3">
                          <span className="text-xs px-2 py-1 rounded-md font-mono font-bold text-[#FFB627] bg-[#FFB627]/10">
                            {inf.promo_code}
                          </span>
                        </td>
                        <td className="py-3 text-white/60">{inf.commission_pct}%</td>
                        <td className="py-3 text-white">{inf.referralCount}</td>
                        <td className="py-3 text-white">${(inf.totalRevenueCents / 100).toFixed(2)}</td>
                        <td className="py-3">
                          <span className={`font-semibold ${inf.commissionOwedCents > 0 ? 'text-[#FFB627]' : 'text-white/30'}`}>
                            ${(inf.commissionOwedCents / 100).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1.5">
                            {infLoading === inf.id ? <Loader2 className="w-4 h-4 text-white/40 animate-spin" /> : (
                              <>
                                {inf.unpaidReferrals > 0 && (
                                  <button onClick={() => markPaid(inf.id)} title="Mark commission paid" className="p-1.5 rounded-lg hover:bg-green-400/10 text-green-400 transition-colors">
                                    <CheckSquare className="w-4 h-4" />
                                  </button>
                                )}
                                <button onClick={() => deleteInfluencer(inf.id)} title="Remove influencer" className="p-1.5 rounded-lg hover:bg-red-400/10 text-red-400/60 hover:text-red-400 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {tab === 'applications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">Influencer Applications</h2>
            <span className="text-xs text-white/40">{applications.length} total</span>
          </div>
          {!applicationsLoaded ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-white/30 animate-spin" /></div>
          ) : applications.length === 0 ? (
            <div className="glass-card p-10 text-center text-white/30">No applications yet.</div>
          ) : (
            <div className="space-y-4">
              {applications.map(app => (
                <div key={app.id as string} className="glass-card p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="font-semibold text-white text-base">{app.name as string}</div>
                      <a href={`mailto:${app.email as string}`} className="text-[#3E92CC] text-sm hover:underline">{app.email as string}</a>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2.5 py-1 rounded-md font-mono font-bold text-[#FFB627] bg-[#FFB627]/10">
                        Requested: {app.requested_code as string}
                      </span>
                      <span className="text-xs text-white/30">{formatDate(app.created_at as string)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {(app.instagram_handle as string) && (
                      <div><span className="text-white/40 text-xs block">Instagram</span><span className="text-white">@{app.instagram_handle as string}</span></div>
                    )}
                    {(app.tiktok_handle as string) && (
                      <div><span className="text-white/40 text-xs block">TikTok</span><span className="text-white">@{app.tiktok_handle as string}</span></div>
                    )}
                    {(app.youtube_handle as string) && (
                      <div><span className="text-white/40 text-xs block">YouTube</span><span className="text-white">{app.youtube_handle as string}</span></div>
                    )}
                    {(app.audience_size as string) && (
                      <div><span className="text-white/40 text-xs block">Audience Size</span><span className="text-white">{app.audience_size as string}</span></div>
                    )}
                    {(app.other_platforms as string) && (
                      <div className="md:col-span-2"><span className="text-white/40 text-xs block">Other Platforms</span><span className="text-white">{app.other_platforms as string}</span></div>
                    )}
                  </div>

                  {(app.why_tarmac as string) && (
                    <div>
                      <span className="text-white/40 text-xs block mb-1">Why TARMAC?</span>
                      <p className="text-white/80 text-sm leading-relaxed">{app.why_tarmac as string}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'bugs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">Bug Reports</h2>
            <span className="text-xs text-white/40">{bugs.filter(b => b.status === 'open').length} open · {bugs.length} total</span>
          </div>
          {!bugsLoaded ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-white/30 animate-spin" /></div>
          ) : bugs.length === 0 ? (
            <div className="glass-card p-10 text-center text-white/30">No bug reports yet.</div>
          ) : (
            <div className="space-y-3">
              {bugs.map(b => (
                <div key={b.id as string} className="glass-card p-5 flex gap-4 items-start">
                  <Bug className={`w-5 h-5 shrink-0 mt-0.5 ${b.status === 'open' ? 'text-red-400' : 'text-white/20'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white/60 text-xs">{b.email as string || 'Anonymous'}</span>
                      {(b.page as string) && <span className="text-white/30 text-xs font-mono">{b.page as string}</span>}
                      <span className="text-white/25 text-xs">{formatDate(b.created_at as string)}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${b.status === 'open' ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-white/25'}`}>
                        {b.status as string}
                      </span>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed">{b.message as string}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {bugLoading === (b.id as string) ? (
                      <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
                    ) : (
                      <>
                        {b.status === 'open' ? (
                          <button onClick={() => updateBugStatus(b.id as string, 'resolved')} title="Mark resolved" className="p-1.5 rounded-lg hover:bg-green-400/10 text-green-400 transition-colors">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => updateBugStatus(b.id as string, 'open')} title="Reopen" className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors">
                            <Bug className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => deleteBug(b.id as string)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-400/10 text-red-400/50 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
