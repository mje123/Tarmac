'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import {
  Users, BookOpen, CreditCard, TrendingUp, Shield, Plus, Loader2,
  CheckCircle, BarChart3, Target, Activity, UserCheck, UserX,
  ShieldCheck, DollarSign, Trash2, Link2, CheckSquare, Bug, Mail, Send, Lightbulb, Gift, RefreshCw,
} from 'lucide-react'

interface ReferralDetail {
  id: string
  user_name: string
  user_email: string
  amount_cents: number
  commission_paid: boolean
  created_at: string
}

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
  totalCommissionPaidCents: number
  unpaidReferrals: number
  referrals: ReferralDetail[]
}

interface AdminClientProps {
  stats: {
    totalUsers: number
    totalQuestions: number
    totalSessions: number
    totalAnswered: number
    avgScore: number
    passRate: number
    subCounts: Record<string, number>
    mrr: number
  }
  recentUsers: Record<string, unknown>[]
  recentSessions: Record<string, unknown>[]
  answeredPerUser: Record<string, number>
}

const SUB_COLORS: Record<string, string> = {
  study_pass: 'text-[#3E92CC] bg-[#3E92CC]/10',
  free: 'text-white/40 bg-white/5',
}

export default function AdminClient({ stats, recentUsers: initialUsers, recentSessions, answeredPerUser }: AdminClientProps) {
  const [tab, setTab] = useState<'overview' | 'questions' | 'users' | 'influencers' | 'bugs' | 'applications' | 'email' | 'suggestions'>('overview')
  const [users, setUsers] = useState(initialUsers)
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [influencersLoaded, setInfluencersLoaded] = useState(false)
  const [newQ, setNewQ] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_answer: 'A', category: 'Regulations', difficulty: 'medium', explanation: '', reference: '',
  })
  const [newInf, setNewInf] = useState({ name: '', email: '', promo_code: '', commission_pct: 30 })
  const [expandedInf, setExpandedInf] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [infLoading, setInfLoading] = useState<string | null>(null)
  const [addingInf, setAddingInf] = useState(false)
  const [usersRefreshing, setUsersRefreshing] = useState(false)

  const [bugs, setBugs] = useState<Record<string, unknown>[]>([])
  const [bugsLoaded, setBugsLoaded] = useState(false)
  const [bugLoading, setBugLoading] = useState<string | null>(null)
  const [applications, setApplications] = useState<Record<string, unknown>[]>([])
  const [applicationsLoaded, setApplicationsLoaded] = useState(false)
  const [emailHistory, setEmailHistory] = useState<Record<string, unknown>[]>([])
  const [emailHistoryLoaded, setEmailHistoryLoaded] = useState(false)
  const [suggestions, setSuggestions] = useState<Record<string, unknown>[]>([])
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false)
  const [suggestionLoading, setSuggestionLoading] = useState<string | null>(null)
  const [emailForm, setEmailForm] = useState({ subject: '', body: '', recipient_group: 'all', specific_email: '' })
  const [emailSending, setEmailSending] = useState(false)
  const [emailResult, setEmailResult] = useState<{ sent: number; failed: number; total: number } | null>(null)

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

  async function loadEmailHistory() {
    if (emailHistoryLoaded) return
    const res = await fetch('/api/admin/email')
    const data = await res.json()
    setEmailHistory(data)
    setEmailHistoryLoaded(true)
  }

  async function loadSuggestions() {
    if (suggestionsLoaded) return
    const res = await fetch('/api/admin/suggestions')
    const data = await res.json()
    setSuggestions(data)
    setSuggestionsLoaded(true)
  }

  async function deleteSuggestion(id: string) {
    setSuggestionLoading(id)
    try {
      await fetch(`/api/admin/suggestions/${id}`, { method: 'DELETE' })
      setSuggestions(prev => prev.filter(s => s.id !== id))
    } finally { setSuggestionLoading(null) }
  }

  async function archiveSuggestion(id: string) {
    setSuggestionLoading(id)
    try {
      await fetch(`/api/admin/suggestions/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      })
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'archived' } : s))
    } finally { setSuggestionLoading(null) }
  }

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault()
    setEmailSending(true)
    setEmailResult(null)
    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailForm.subject,
          body: emailForm.body,
          recipient_group: emailForm.recipient_group,
          specific_email: emailForm.specific_email,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setEmailResult(data)
        setEmailForm(p => ({ ...p, subject: '', body: '' }))
        setEmailHistory(prev => [{
          subject: emailForm.subject, body: emailForm.body,
          recipient_group: emailForm.recipient_group,
          sent_count: data.sent, failed_count: data.failed,
          recipient_count: data.total, sent_at: new Date().toISOString(),
        }, ...prev])
      } else {
        alert(data.error || 'Send failed')
      }
    } finally {
      setEmailSending(false)
    }
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

  async function refreshUsers() {
    setUsersRefreshing(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (res.ok) setUsers(data.users)
    } finally { setUsersRefreshing(false) }
  }

  function handleTabChange(t: typeof tab) {
    setTab(t)
    if (t === 'influencers') loadInfluencers()
    if (t === 'bugs') loadBugs()
    if (t === 'applications') loadApplications()
    if (t === 'email') loadEmailHistory()
    if (t === 'suggestions') loadSuggestions()
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

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Delete ${name || 'this user'}? This is permanent and cannot be undone.`)) return
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id))
      } else {
        const data = await res.json()
        alert(data.error || 'Delete failed')
      }
    } finally { setActionLoading(null) }
  }

  function grantFreeMonth(id: string, currentExpiry: string | null) {
    const base = currentExpiry && new Date(currentExpiry) > new Date() ? new Date(currentExpiry) : new Date()
    base.setMonth(base.getMonth() + 1)
    updateUser(id, { subscription_status: 'study_pass', subscription_expires_at: base.toISOString() })
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
        setInfluencers(prev => [{ ...data, referralCount: 0, totalRevenueCents: 0, commissionOwedCents: 0, totalCommissionPaidCents: 0, unpaidReferrals: 0, referrals: [] }, ...prev])
        setNewInf({ name: '', email: '', promo_code: '', commission_pct: 30 })
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
  const totalPartnerRevenue = influencers.reduce((sum, inf) => sum + inf.totalRevenueCents, 0)
  const totalCommissionPaid = influencers.reduce((sum, inf) => sum + (inf.totalCommissionPaidCents || 0), 0)

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-7 h-7 text-[#FFB627]" />
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {(['overview', 'questions', 'users', 'influencers', 'bugs', 'applications', 'email', 'suggestions'] as const).map(t => (
          <button key={t} onClick={() => handleTabChange(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all flex items-center gap-1.5 ${tab === t ? 'bg-[#3E92CC] text-white' : 'text-white/50 hover:text-white'}`}>
            {t === 'bugs' && <Bug className="w-3.5 h-3.5" />}
            {t === 'email' && <Mail className="w-3.5 h-3.5" />}
            {t === 'suggestions' && <Lightbulb className="w-3.5 h-3.5" />}
            {t === 'applications' ? 'Applications' : t === 'email' ? 'Email' : t === 'suggestions' ? 'Suggestions' : t}
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
            {t === 'suggestions' && suggestionsLoaded && suggestions.filter(s => s.status !== 'archived').length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFB627] text-black">
                {suggestions.filter(s => s.status !== 'archived').length}
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
              { label: 'Questions Answered', value: stats.totalAnswered.toLocaleString(), icon: <Target className="w-5 h-5 text-purple-400" /> },
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
                  <div key={u.id as string} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white">{u.full_name as string || u.email as string}</div>
                      <div className="text-xs text-white/40">{formatDate(u.created_at as string)}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-white/40">{(answeredPerUser[u.id as string] || 0).toLocaleString()} Qs</span>
                      <span className={`text-xs px-2 py-1 rounded-md font-medium ${SUB_COLORS[(u.subscription_status as string)] || 'text-white/40 bg-white/5'}`}>
                        {u.subscription_status as string}
                      </span>
                    </div>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">All Users ({users.length})</h3>
            <button onClick={refreshUsers} disabled={usersRefreshing} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors disabled:opacity-40">
              <RefreshCw className={`w-3.5 h-3.5 ${usersRefreshing ? 'animate-spin' : ''}`} />
              {usersRefreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-left">
                  <th className="pb-3 font-medium">Name / Email</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Emails</th>
                  <th className="pb-3 font-medium">Qs Answered</th>
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
                      <td className="py-3">
                        {u.marketing_emails !== false ? (
                          <span title="Subscribed to emails" className="flex items-center gap-1 text-green-400 text-xs font-medium">
                            <Mail className="w-3.5 h-3.5" /> Yes
                          </span>
                        ) : (
                          <span title="Unsubscribed" className="text-white/25 text-xs">No</span>
                        )}
                      </td>
                      <td className="py-3 text-white/60">{(answeredPerUser[u.id as string] || 0).toLocaleString()}</td>
                      <td className="py-3 text-white/60">{formatDate(u.created_at as string)}</td>
                      <td className="py-3 text-white/40">{u.subscription_expires_at ? formatDate(u.subscription_expires_at as string) : '—'}</td>
                      <td className="py-3">
                        <div className="flex gap-1.5">
                          {isLoading ? <Loader2 className="w-4 h-4 text-white/40 animate-spin" /> : (
                            <>
                              <button onClick={() => grantFreeMonth(u.id as string, u.subscription_expires_at as string | null)} title="Give 1 free month" className="p-1.5 rounded-lg hover:bg-[#FFB627]/10 text-[#FFB627]/50 hover:text-[#FFB627] transition-colors">
                                <Gift className="w-4 h-4" />
                              </button>
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
                              <button onClick={() => deleteUser(u.id as string, u.full_name as string)} title="Delete user" className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500/40 hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-2"><Link2 className="w-5 h-5 text-[#3E92CC]" /><span className="text-white/50 text-xs">Partners</span></div>
              <div className="text-3xl font-bold text-white">{influencers.length}</div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5 text-green-400" /><span className="text-white/50 text-xs">Total Referrals</span></div>
              <div className="text-3xl font-bold text-white">{influencers.reduce((s, i) => s + i.referralCount, 0)}</div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-green-400" /><span className="text-white/50 text-xs">Partner Revenue</span></div>
              <div className="text-3xl font-bold text-white">${(totalPartnerRevenue / 100).toFixed(2)}</div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5 text-[#FFB627]" /><span className="text-white/50 text-xs">Commission Owed</span></div>
              <div className="text-3xl font-bold text-[#FFB627]">${(totalCommissionOwed / 100).toFixed(2)}</div>
              {totalCommissionPaid > 0 && (
                <div className="text-xs text-white/30 mt-1">${(totalCommissionPaid / 100).toFixed(2)} paid to date</div>
              )}
            </div>
          </div>

          {/* Add influencer */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-[#3E92CC]" /> Add Partner</h3>
            <p className="text-xs text-white/40 mb-4">After adding, create a matching Stripe promotion code (15% off) in Stripe Dashboard → Coupons. The code must match exactly.</p>
            <form onSubmit={addInfluencer} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-white/50 mb-1">Name *</label>
                <input type="text" value={newInf.name} onChange={e => setNewInf(p => ({ ...p, name: e.target.value }))} placeholder="Jake Smith" required />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Email</label>
                <input type="email" value={newInf.email} onChange={e => setNewInf(p => ({ ...p, email: e.target.value }))} placeholder="jake@email.com" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Promo Code * (must match Stripe exactly)</label>
                <input type="text" value={newInf.promo_code} onChange={e => setNewInf(p => ({ ...p, promo_code: e.target.value.toUpperCase() }))} placeholder="JAKE15" required />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Commission %</label>
                <input type="number" min={1} max={100} value={newInf.commission_pct} onChange={e => setNewInf(p => ({ ...p, commission_pct: parseInt(e.target.value) }))} />
              </div>
              <div className="md:col-span-4">
                <button type="submit" disabled={addingInf} className="btn-primary py-2.5 px-6 text-sm">
                  {addingInf ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add Partner</>}
                </button>
              </div>
            </form>
          </div>

          {/* Partner list with expandable referral details */}
          <div className="space-y-3">
            {influencers.length === 0 ? (
              <div className="glass-card p-8 text-center text-white/30 text-sm">No partners yet. Add one above.</div>
            ) : influencers.map(inf => (
              <div key={inf.id} className="glass-card overflow-hidden">
                {/* Partner header row */}
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedInf(expandedInf === inf.id ? null : inf.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-sm">{inf.name}</span>
                      {inf.email && <span className="text-white/40 text-xs">{inf.email}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded font-mono font-bold text-[#FFB627] bg-[#FFB627]/10">{inf.promo_code}</span>
                      <span className="text-xs text-white/40">{inf.commission_pct}% commission · 15% off for users</span>
                      <span className="text-xs text-white/30">Added {formatDate(inf.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0 text-right">
                    <div>
                      <div className="text-lg font-bold text-white">{inf.referralCount}</div>
                      <div className="text-xs text-white/40">referrals</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">${(inf.totalRevenueCents / 100).toFixed(2)}</div>
                      <div className="text-xs text-white/40">revenue</div>
                    </div>
                    <div>
                      <div className={`text-lg font-bold ${inf.commissionOwedCents > 0 ? 'text-[#FFB627]' : 'text-white/30'}`}>
                        ${(inf.commissionOwedCents / 100).toFixed(2)}
                      </div>
                      <div className="text-xs text-white/40">owed</div>
                    </div>
                    <div className="flex gap-1.5">
                      {infLoading === inf.id ? <Loader2 className="w-4 h-4 text-white/40 animate-spin" /> : (
                        <>
                          {inf.unpaidReferrals > 0 && (
                            <button
                              onClick={e => { e.stopPropagation(); markPaid(inf.id) }}
                              title="Mark all commissions paid"
                              className="p-1.5 rounded-lg hover:bg-green-400/10 text-green-400 transition-colors"
                            >
                              <CheckSquare className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); deleteInfluencer(inf.id) }}
                            title="Remove partner"
                            className="p-1.5 rounded-lg hover:bg-red-400/10 text-red-400/60 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded referral details */}
                {expandedInf === inf.id && (
                  <div className="border-t border-white/5">
                    {inf.referrals.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-white/30">No referrals yet.</div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-white/30 text-left bg-white/[0.02]">
                            <th className="px-4 py-2 font-medium">User</th>
                            <th className="px-4 py-2 font-medium">Date</th>
                            <th className="px-4 py-2 font-medium">Amount Paid</th>
                            <th className="px-4 py-2 font-medium">Commission ({inf.commission_pct}%)</th>
                            <th className="px-4 py-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {inf.referrals.map(ref => (
                            <tr key={ref.id}>
                              <td className="px-4 py-2.5">
                                <div className="text-white/80">{ref.user_name}</div>
                                {ref.user_email && ref.user_email !== ref.user_name && (
                                  <div className="text-white/40">{ref.user_email}</div>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-white/50">{formatDate(ref.created_at)}</td>
                              <td className="px-4 py-2.5 text-white">${(ref.amount_cents / 100).toFixed(2)}</td>
                              <td className="px-4 py-2.5 font-semibold text-[#FFB627]">
                                ${(ref.amount_cents * inf.commission_pct / 100 / 100).toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5">
                                {ref.commission_paid ? (
                                  <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Paid</span>
                                ) : (
                                  <span className="text-[#FFB627]">Unpaid</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-white/10 bg-white/[0.02]">
                            <td className="px-4 py-2.5 text-white/40 font-medium" colSpan={2}>Totals</td>
                            <td className="px-4 py-2.5 font-semibold text-white">${(inf.totalRevenueCents / 100).toFixed(2)}</td>
                            <td className="px-4 py-2.5 font-semibold text-[#FFB627]">
                              ${((inf.commissionOwedCents + (inf.totalCommissionPaidCents || 0)) / 100).toFixed(2)} total
                              {inf.commissionOwedCents > 0 && <span className="text-white/40 ml-1">(${(inf.commissionOwedCents / 100).toFixed(2)} owed)</span>}
                            </td>
                            <td className="px-4 py-2.5" />
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
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

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    <span className="text-xs text-green-400 font-medium">Agreed to partnership terms & legal agreement at time of submission</span>
                  </div>
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
      {tab === 'email' && (
        <div className="space-y-6">
          {/* Compose */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-[#3E92CC]" /> Compose Email
            </h3>
            <form onSubmit={sendEmail} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Send To</label>
                  <select value={emailForm.recipient_group} onChange={e => setEmailForm(p => ({ ...p, recipient_group: e.target.value, specific_email: '' }))}>
                    <option value="all">All Users</option>
                    <option value="paid">Paid Subscribers Only</option>
                    <option value="free">Free Users Only</option>
                    <option value="specific">Specific User</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Subject *</label>
                  <input type="text" value={emailForm.subject} onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))} placeholder="Your weekly TARMAC update" required />
                </div>
              </div>
              {emailForm.recipient_group === 'specific' && (
                <div>
                  <label className="block text-xs text-white/50 mb-1">Recipient Email *</label>
                  <input
                    type="email"
                    value={emailForm.specific_email}
                    onChange={e => setEmailForm(p => ({ ...p, specific_email: e.target.value }))}
                    placeholder="user@example.com"
                    required={emailForm.recipient_group === 'specific'}
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-white/50 mb-1">Body *</label>
                <textarea
                  value={emailForm.body}
                  onChange={e => setEmailForm(p => ({ ...p, body: e.target.value }))}
                  placeholder={'Write your message here.\n\nSeparate paragraphs with a blank line.\n\nKeep it focused — one clear topic per email performs best.'}
                  rows={10}
                  required
                />
                <p className="text-white/25 text-xs mt-1">Plain text — separate paragraphs with a blank line. Automatically wrapped in TARMAC branded template.</p>
              </div>
              {emailResult && (
                <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <span className="text-green-400 font-semibold">Sent!</span>
                  <span className="text-white/60 ml-2">{emailResult.sent} delivered · {emailResult.failed} failed · {emailResult.total} total recipients</span>
                </div>
              )}
              <button type="submit" disabled={emailSending} className="btn-primary py-2.5 px-6 text-sm">
                {emailSending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send Email</>}
              </button>
            </form>
          </div>

          {/* History */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-white/40" /> Sent History
            </h3>
            {!emailHistoryLoaded ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>
            ) : emailHistory.length === 0 ? (
              <p className="text-white/30 text-sm">No emails sent yet.</p>
            ) : (
              <div className="space-y-3">
                {emailHistory.map((e, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 py-3 border-b border-white/5 last:border-0">
                    <div className="min-w-0">
                      <div className="font-medium text-white text-sm">{e.subject as string}</div>
                      <div className="text-xs text-white/40 mt-0.5">
                        To: <span className="capitalize">{e.recipient_group as string}</span> · {formatDate(e.sent_at as string)}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-xs text-green-400 font-semibold">{e.sent_count as number} sent</span>
                      {(e.failed_count as number) > 0 && <span className="text-xs text-red-400 ml-2">{e.failed_count as number} failed</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'suggestions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">Feature Suggestions</h2>
            <span className="text-xs text-white/40">{suggestions.filter(s => s.status !== 'archived').length} open · {suggestions.length} total</span>
          </div>
          {!suggestionsLoaded ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-white/30 animate-spin" /></div>
          ) : suggestions.length === 0 ? (
            <div className="glass-card p-10 text-center text-white/30">No suggestions yet.</div>
          ) : (
            <div className="space-y-3">
              {suggestions.map(s => (
                <div key={s.id as string} className="glass-card p-5 flex gap-4 items-start">
                  <Lightbulb className={`w-5 h-5 shrink-0 mt-0.5 ${s.status === 'archived' ? 'text-white/20' : 'text-[#FFB627]'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white/60 text-xs">{s.email as string || 'Anonymous'}</span>
                      {(s.page as string) && <span className="text-white/30 text-xs font-mono">{s.page as string}</span>}
                      <span className="text-white/25 text-xs">{formatDate(s.created_at as string)}</span>
                      {s.status === 'archived' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-white/5 text-white/25">archived</span>
                      )}
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed">{s.message as string}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {suggestionLoading === (s.id as string) ? (
                      <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
                    ) : (
                      <>
                        {s.status !== 'archived' && (
                          <button onClick={() => archiveSuggestion(s.id as string)} title="Archive" className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => deleteSuggestion(s.id as string)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-400/10 text-red-400/50 hover:text-red-400 transition-colors">
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
