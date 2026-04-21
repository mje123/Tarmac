import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, UserProgress, TestSession, Question } from '@/types'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { BookOpen, ClipboardList, FileText, Bookmark, ArrowRight } from 'lucide-react'
import StudyLaterWidget from '@/components/ui/StudyLaterWidget'
import { Suspense } from 'react'
import CheckoutSuccessBanner from '@/components/ui/CheckoutSuccessBanner'

const FREE_QUESTION_LIMIT = 10

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      '#0B1220',
  card:    '#0F1A2E',
  border:  '#1A2540',
  borderD: '#0F1A2E',
  red:     '#EF4444',
  yellow:  '#FDB022',
  green:   '#10B981',
  blue:    '#3B82F6',
  t1:      '#FFFFFF',
  t2:      '#94A3B8',
  t3:      '#4A5568',
}

function ProgressRow({
  category,
  accuracy,
  attempted,
}: {
  category: string
  accuracy: number
  attempted: number
}) {
  const color = accuracy >= 80 ? C.green : accuracy >= 60 ? C.yellow : C.red

  return (
    <div
      className="group flex items-center gap-3 py-2.5 px-3 -mx-3 rounded transition-colors hover:bg-white/[0.03] cursor-default"
    >
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      <div className="w-36 text-sm text-white/80 truncate font-medium">{category}</div>
      <div className="flex-1 relative h-1.5 rounded-sm overflow-hidden" style={{ background: '#1A2540' }}>
        <div
          className="absolute inset-y-0 left-0 rounded-sm transition-all duration-700"
          style={{ width: `${accuracy}%`, background: color }}
        />
      </div>
      <div className="w-11 text-right text-sm font-bold tabular-nums" style={{ color }}>
        {Math.round(accuracy)}%
      </div>
      <div className="w-12 text-right text-xs tabular-nums" style={{ color: C.t3 }}>
        {attempted}Q
      </div>
    </div>
  )
}

function CategoryGroup({
  label,
  color,
  items,
}: {
  label: string
  color: string
  items: UserProgress[]
}) {
  if (items.length === 0) return null
  return (
    <div className="mb-5">
      <div
        className="flex items-center gap-2 mb-1 pb-1.5"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color }}>
          {label}
        </span>
        <span className="text-[10px] ml-auto" style={{ color: C.t3 }}>
          {items.length} area{items.length !== 1 ? 's' : ''}
        </span>
      </div>
      {items.map((p) => (
        <ProgressRow
          key={p.category}
          category={p.category}
          accuracy={p.accuracy_percentage}
          attempted={p.questions_attempted}
        />
      ))}
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const [
    { data: userProfile },
    { data: progressData },
    { data: recentSessions },
    { data: totalAnswers },
    { data: savedData },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('user_progress').select('*').eq('user_id', authUser.id).order('accuracy_percentage', { ascending: true }),
    supabase.from('test_sessions').select('*').eq('user_id', authUser.id).order('started_at', { ascending: false }).limit(5),
    supabase.from('test_answers').select('id', { count: 'exact' }).eq('user_id', authUser.id),
    supabase.from('saved_questions').select('question_id, saved_at, questions(*)').eq('user_id', authUser.id).order('saved_at', { ascending: false }).limit(5),
  ])

  const user: User = userProfile ?? {
    id: authUser.id,
    email: authUser.email ?? '',
    full_name: authUser.user_metadata?.full_name || 'Pilot',
    subscription_status: 'free',
    subscription_expires_at: null,
    stripe_customer_id: null,
    is_admin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const progress = (progressData || []) as UserProgress[]
  const sessions = (recentSessions || []) as TestSession[]
  const savedQuestions = (savedData || []) as unknown as Array<{
    question_id: string
    saved_at: string
    questions: Question
  }>

  const totalAttempted  = progress.reduce((s, p) => s + p.questions_attempted, 0)
  const totalCorrect    = progress.reduce((s, p) => s + p.questions_correct, 0)
  const overallAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0
  const examSessions    = sessions.filter(s => s.session_type === 'real_exam')
  const practiceSessions = sessions.filter(s => s.session_type === 'practice_mode').length

  const isExpired = user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date()
  const isFree    = user.subscription_status === 'free'

  const freeUsed      = (totalAnswers || []).length
  const freeRemaining = Math.max(0, FREE_QUESTION_LIMIT - freeUsed)
  const freeUsedPct   = Math.min(100, (freeUsed / FREE_QUESTION_LIMIT) * 100)

  // Readiness: accuracy 65% + volume 35% (200 Q = full credit)
  const volumeScore = Math.min(totalAttempted / 200, 1) * 100
  const readiness   = totalAttempted === 0 ? 0 : Math.round(overallAccuracy * 0.65 + volumeScore * 0.35)
  const readinessColor = readiness >= 80 ? C.green : readiness >= 60 ? C.yellow : readiness >= 40 ? C.blue : C.red
  const readinessLabel = readiness >= 80 ? 'Exam Ready' : readiness >= 60 ? 'On Track' : readiness >= 40 ? 'Building Up' : 'Just Starting'

  const criticalCategories = progress.filter(p => p.accuracy_percentage < 60)
  const warningCategories  = progress.filter(p => p.accuracy_percentage >= 60 && p.accuracy_percentage < 80)
  const readyCategories    = progress.filter(p => p.accuracy_percentage >= 80)

  const weakestCategory = progress[0] // sorted asc by accuracy
  const lastExam        = examSessions[0]
  const questionsToReady = Math.max(0, 200 - totalAttempted)

  const TIPS = [
    'Weather questions make up ~15% of the FAA exam. Review METARs, TAFs, and winds-aloft forecasts.',
    'VFR cloud clearances: 3-1-2 for Class E below 10,000 ft.',
    'Airspace questions often use diagrams. Practice reading sectional charts.',
    'Weight & balance: always check both CG limits and max gross weight.',
    'METAR decoding is a skill — practice reading them aloud.',
    'POH performance charts: know how to interpolate for non-standard conditions.',
    'Regulations questions hinge on a single word. Read every answer choice.',
    'Ground speed — not airspeed — is used for cross-country fuel burn.',
    'Class B, C, D, E: know the communication requirements cold.',
    'Most-missed: hypoxia symptoms and aerodynamic stall recognition.',
  ]
  const todayTip = TIPS[new Date().getDate() % TIPS.length]

  // Name display
  const displayName = (user.full_name || 'PILOT').toUpperCase()

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 animate-fade-in">
        <Suspense fallback={null}>
          <CheckoutSuccessBanner />
        </Suspense>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-sm font-bold tracking-[0.1em] mb-0.5" style={{ color: C.t2 }}>
              {displayName}
            </h1>
            {!isFree && !isExpired && user.subscription_expires_at && (
              <p className="text-[11px]" style={{ color: C.t3 }}>
                Study Pass &middot; Active until {formatDate(user.subscription_expires_at)}
              </p>
            )}
            {!isFree && !isExpired && !user.subscription_expires_at && (
              <p className="text-[11px]" style={{ color: C.t3 }}>Founding Member &middot; Lifetime</p>
            )}
            {isExpired && (
              <p className="text-[11px] font-semibold" style={{ color: C.red }}>Subscription expired</p>
            )}
          </div>

          {isFree && (
            <Link
              href="/upgrade"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold tracking-wide rounded-sm transition-all hover:opacity-90 shrink-0"
              style={{ background: C.yellow, color: '#080E1C', boxShadow: `0 4px 16px rgba(253,176,34,0.25)` }}
            >
              UNLOCK FULL ACCESS
            </Link>
          )}
          {isExpired && (
            <Link
              href="/upgrade"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold tracking-wide rounded-sm transition-all hover:opacity-90 shrink-0"
              style={{ background: C.red, color: '#fff' }}
            >
              RENEW ACCESS
            </Link>
          )}
        </div>

        {/* ── Free trial bar ───────────────────────────────────────────── */}
        {isFree && (
          <div className="mb-6 rounded-sm p-4" style={{ background: C.card, border: `1px solid ${freeRemaining === 0 ? C.red : '#1E2D45'}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: C.t3 }}>
                Free Trial
              </span>
              <span className="text-xs font-bold" style={{ color: freeRemaining === 0 ? C.red : C.t2 }}>
                {freeUsed} / {FREE_QUESTION_LIMIT} QUESTIONS USED
              </span>
            </div>
            <div className="h-2 rounded-sm overflow-hidden" style={{ background: '#1A2540' }}>
              <div
                className="h-full rounded-sm transition-all duration-500"
                style={{ width: `${freeUsedPct}%`, background: freeRemaining === 0 ? C.red : C.yellow }}
              />
            </div>
            {freeRemaining === 0 && (
              <p className="text-[11px] mt-2" style={{ color: C.t3 }}>
                All free questions used. Upgrade to access all 1,400+ questions and track your real progress.
              </p>
            )}
          </div>
        )}

        {/* ── Performance Snapshot ─────────────────────────────────────── */}
        <div className="mb-6 rounded-sm overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          <div
            className="px-4 py-2.5 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: C.t3 }}>
              Performance Snapshot
            </span>
            {totalAttempted > 0 && (
              <span className="text-[10px]" style={{ color: C.t3 }}>
                Last updated: today
              </span>
            )}
          </div>

          <div style={{ background: C.card }}>
            {/* Row */}
            {([
              {
                label: 'Questions Practiced',
                value: totalAttempted.toLocaleString(),
                valueColor: C.t1,
                context: totalAttempted >= 200
                  ? 'Full coverage reached'
                  : totalAttempted === 0
                    ? 'Start your first session'
                    : `${(200 - totalAttempted).toLocaleString()} more to full coverage`,
                contextColor: totalAttempted === 0 ? C.red : C.t3,
              },
              {
                label: 'Overall Accuracy',
                value: totalAttempted === 0 ? '—' : `${overallAccuracy}%`,
                valueColor: totalAttempted === 0 ? C.t3 : overallAccuracy >= 70 ? C.green : overallAccuracy >= 60 ? C.yellow : C.red,
                context: totalAttempted === 0
                  ? 'No data yet'
                  : overallAccuracy >= 70
                    ? `${overallAccuracy - 70}% above FAA minimum`
                    : `${70 - overallAccuracy}% below FAA minimum (70%)`,
                contextColor: totalAttempted > 0 && overallAccuracy < 70 ? C.red : C.t3,
              },
              {
                label: 'Study Sessions',
                value: String(practiceSessions),
                valueColor: C.t1,
                context: 'Practice mode sessions',
                contextColor: C.t3,
              },
              {
                label: 'Practice Exams Taken',
                value: String(examSessions.length),
                valueColor: C.t1,
                context: examSessions.length === 0
                  ? 'Take 3+ before test day'
                  : lastExam?.score != null
                    ? `Last: ${lastExam.score}/60 (${Math.round((lastExam.score / 60) * 100)}%)`
                    : 'Target: 3+ before test day',
                contextColor: examSessions.length === 0 ? C.t3 : lastExam?.score != null && (lastExam.score / 60) >= 0.7 ? C.green : C.t3,
              },
              ...(weakestCategory ? [{
                label: 'Weakest Category',
                value: `${weakestCategory.category.length > 18 ? weakestCategory.category.slice(0, 16) + '…' : weakestCategory.category} — ${Math.round(weakestCategory.accuracy_percentage)}%`,
                valueColor: weakestCategory.accuracy_percentage < 40 ? C.red : C.yellow,
                context: weakestCategory.accuracy_percentage < 40 ? 'HIGH RISK' : weakestCategory.accuracy_percentage < 60 ? 'NEEDS WORK' : 'MONITOR',
                contextColor: weakestCategory.accuracy_percentage < 40 ? C.red : C.yellow,
                badge: true,
              }] : []),
            ] as Array<{ label: string; value: string; valueColor: string; context: string; contextColor: string; badge?: boolean }>).map((row, i, arr) => (
              <div
                key={row.label}
                className="flex items-center gap-4 px-4 py-3"
                style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : undefined }}
              >
                <div className="w-44 text-xs shrink-0" style={{ color: C.t3 }}>{row.label}</div>
                <div className="w-48 text-sm font-bold tabular-nums" style={{ color: row.valueColor }}>{row.value}</div>
                <div className="flex-1 text-xs" style={{ color: row.contextColor }}>
                  {row.badge ? (
                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold" style={{ background: `${row.contextColor}18`, color: row.contextColor }}>
                      {row.context}
                    </span>
                  ) : row.context}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main 3-column grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_280px] gap-5">

          {/* ── Column 1: Readiness + Quick Actions ─────────────────── */}
          <div className="space-y-4">
            {/* Readiness */}
            <div className="rounded-sm p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <div className="flex items-end justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: C.t3 }}>
                  Test Readiness
                </span>
                <span className="text-2xl font-black tabular-nums" style={{ color: readinessColor }}>
                  {readiness}<span className="text-sm font-bold text-white/30">/100</span>
                </span>
              </div>

              {/* Linear bar */}
              <div className="h-3 rounded-sm overflow-hidden mb-1" style={{ background: '#1A2540' }}>
                <div
                  className="h-full rounded-sm transition-all duration-700"
                  style={{ width: `${readiness}%`, background: readinessColor }}
                />
              </div>
              {/* FAA passing line marker */}
              <div className="relative h-3 mb-3">
                <div className="absolute top-0 bottom-0 w-px" style={{ left: '70%', background: 'rgba(255,255,255,0.15)' }} />
                <div className="absolute top-0 text-[9px] font-bold" style={{ left: 'calc(70% + 4px)', color: C.t3 }}>
                  FAA min 70
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold" style={{ color: readinessColor }}>{readinessLabel}</span>
                {questionsToReady > 0 && (
                  <span className="text-[11px]" style={{ color: C.t3 }}>~{questionsToReady} Q to ready</span>
                )}
              </div>

              {/* Critical gaps */}
              {criticalCategories.length > 0 && (
                <div className="rounded-sm p-3" style={{ background: 'rgba(239,68,68,0.05)', borderLeft: `3px solid ${C.red}` }}>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] mb-2" style={{ color: C.red }}>
                    Critical Gaps — will cause failure
                  </div>
                  <div className="space-y-1.5">
                    {criticalCategories.slice(0, 4).map(p => (
                      <div key={p.category} className="flex items-center justify-between">
                        <span className="text-xs text-white/70 truncate">{p.category}</span>
                        <span className="text-xs font-bold tabular-nums ml-2 shrink-0" style={{ color: C.red }}>
                          {Math.round(p.accuracy_percentage)}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 pt-2.5 text-[10px]" style={{ borderTop: '1px solid rgba(239,68,68,0.15)', color: C.t3 }}>
                    Students who drilled these: <span style={{ color: C.green }}>91% pass rate</span>
                  </div>
                  <Link
                    href="/practice"
                    className="mt-2.5 flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold tracking-wide rounded-sm transition-opacity hover:opacity-90"
                    style={{ background: C.red, color: '#fff' }}
                  >
                    DRILL CRITICAL GAPS
                  </Link>
                </div>
              )}

              {totalAttempted === 0 && (
                <p className="text-xs mt-2" style={{ color: C.t3 }}>
                  Start practicing to see your readiness score.
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-sm overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: C.t3 }}>Actions</span>
              </div>
              <div style={{ background: C.card }}>
                {[
                  { href: '/practice', icon: BookOpen, label: 'Start Practice', sub: 'Drill weak areas', color: C.blue },
                  { href: '/exam-session', icon: ClipboardList, label: 'Practice Exam', sub: '60Q · 150 min', color: C.yellow, external: true },
                  {
                    href: process.env.NEXT_PUBLIC_SUPPLEMENT_URL || 'https://vdbrfhuzyffipcjifaui.supabase.co/storage/v1/object/public/public/supplement.pdf',
                    icon: FileText,
                    label: 'FAA Supplement',
                    sub: 'Charts & figures',
                    color: C.green,
                    external: true,
                  },
                ].map(({ href, icon: Icon, label, sub, color, external }, i, arr) => {
                  const props = external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {}
                  return (
                    <Link
                      key={href}
                      href={href}
                      {...props as { target?: string; rel?: string }}
                      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.025]"
                      style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : undefined }}
                    >
                      <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">{label}</div>
                        <div className="text-[11px]" style={{ color: C.t3 }}>{sub}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: C.t1 }} />
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Column 2: Progress by Category ──────────────────────── */}
          <div className="space-y-4">
            {/* Study Later widget */}
            {savedQuestions.length > 0 && (
              <div className="rounded-sm overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                <div
                  className="px-4 py-2.5 flex items-center justify-between"
                  style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}
                >
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-3.5 h-3.5" style={{ color: C.yellow }} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: C.t3 }}>
                      Saved for Review
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                      style={{ background: `${C.yellow}18`, color: C.yellow }}
                    >
                      {savedQuestions.length}
                    </span>
                  </div>
                  <Link href="/saved" className="text-[11px] transition-colors hover:text-white" style={{ color: C.t3 }}>
                    View all →
                  </Link>
                </div>
                <div className="p-3" style={{ background: C.card }}>
                  <StudyLaterWidget questions={savedQuestions.map(s => s.questions)} />
                </div>
              </div>
            )}

            {/* Knowledge Areas */}
            <div className="rounded-sm overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              <div
                className="px-4 py-2.5 flex items-center justify-between"
                style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: C.t3 }}>
                  Knowledge Areas
                </span>
                <span className="text-[10px]" style={{ color: C.t3 }}>Sorted by accuracy</span>
              </div>
              <div className="px-4 py-3" style={{ background: C.card }}>
                {progress.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm" style={{ color: C.t3 }}>No data yet — start practicing to see your knowledge map.</p>
                    <Link
                      href="/practice"
                      className="inline-flex mt-3 px-4 py-2 text-xs font-bold rounded-sm"
                      style={{ background: C.blue, color: '#fff' }}
                    >
                      Start Practicing
                    </Link>
                  </div>
                ) : (
                  <>
                    <CategoryGroup label="Critical (< 60%)" color={C.red}    items={criticalCategories} />
                    <CategoryGroup label="Needs Work (60–79%)" color={C.yellow} items={warningCategories} />
                    <CategoryGroup label="Test Ready (80%+)" color={C.green}  items={readyCategories} />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Column 3: Context + Activity ────────────────────────── */}
          <div className="space-y-4">
            {/* Today's focus */}
            <div className="rounded-sm p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <div className="text-[10px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: C.t3 }}>
                Today&apos;s Study Tip
              </div>
              <p className="text-sm leading-relaxed" style={{ color: C.t2 }}>{todayTip}</p>
            </div>

            {/* Upgrade prompt for free users */}
            {isFree && (
              <div className="rounded-sm p-4" style={{ background: '#0D1525', border: `1px solid ${C.yellow}30` }}>
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: C.yellow }}>
                  Unlock Everything
                </div>
                <ul className="space-y-1.5 mb-4">
                  {[
                    'All 1,400+ exam questions',
                    'AI tutor on every question',
                    'Unlimited practice exams',
                    'Full progress tracking',
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs" style={{ color: C.t2 }}>
                      <div className="w-1 h-1 rounded-full shrink-0" style={{ background: C.yellow }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/upgrade"
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-bold tracking-wide rounded-sm transition-opacity hover:opacity-90"
                  style={{ background: C.yellow, color: '#080E1C', boxShadow: `0 4px 12px rgba(253,176,34,0.2)` }}
                >
                  SEE PLANS FROM $89
                </Link>
              </div>
            )}

            {/* Last exam */}
            {examSessions.length > 0 && lastExam?.score != null && (
              <div className="rounded-sm p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: C.t3 }}>
                  Last Practice Exam
                </div>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-black tabular-nums text-white">{lastExam.score}</span>
                  <span className="text-sm" style={{ color: C.t3 }}>/60</span>
                  <span
                    className="ml-auto text-xs font-bold"
                    style={{ color: (lastExam.score / 60) >= 0.7 ? C.green : C.red }}
                  >
                    {(lastExam.score / 60) >= 0.7 ? 'PASSED' : 'FAILED'} &middot; {Math.round((lastExam.score / 60) * 100)}%
                  </span>
                </div>
                <div className="text-[11px]" style={{ color: C.t3 }}>{formatDate(lastExam.started_at)}</div>
              </div>
            )}

            {/* Recent Activity */}
            {sessions.length > 0 && (
              <div className="rounded-sm overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}>
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: C.t3 }}>
                    Recent Activity
                  </span>
                </div>
                <div style={{ background: C.card }}>
                  {sessions.slice(0, 4).map((session, i, arr) => (
                    <div
                      key={session.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                      style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : undefined }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: session.session_type === 'real_exam' ? C.yellow : C.blue }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white">
                          {session.session_type === 'real_exam' ? 'Practice Exam' : 'Practice'}
                        </div>
                        <div className="text-[10px]" style={{ color: C.t3 }}>{formatDate(session.started_at)}</div>
                      </div>
                      {session.score != null && (
                        <div
                          className="text-xs font-bold tabular-nums"
                          style={{ color: (session.score / 60) >= 0.7 ? C.green : C.red }}
                        >
                          {session.score}/60
                        </div>
                      )}
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-sm font-semibold"
                        style={{
                          background: session.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                          color: session.status === 'completed' ? C.green : C.blue,
                        }}
                      >
                        {session.status === 'completed' ? 'Done' : 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
