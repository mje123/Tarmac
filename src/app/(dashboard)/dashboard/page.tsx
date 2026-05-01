import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, UserProgress, TestSession, Question } from '@/types'
import { formatDate, getSubscriptionLabel } from '@/lib/utils'
import Link from 'next/link'
import {
  Target, BookOpen, ClipboardList, TrendingUp, ArrowRight,
  Plane, FileText, Bookmark, Zap, Star, Lock, ChevronRight,
} from 'lucide-react'
import StudyLaterWidget from '@/components/ui/StudyLaterWidget'
import { Suspense } from 'react'
import CheckoutSuccessBanner from '@/components/ui/CheckoutSuccessBanner'
import UpgradeModal from '@/components/ui/UpgradeModal'

function CategoryBar({ category, accuracy, attempted }: { category: string; accuracy: number; attempted: number }) {
  const color = accuracy >= 80 ? '#22c55e' : accuracy >= 60 ? '#FFB627' : '#ef4444'
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 sm:w-32 text-xs font-medium truncate text-white/65">{category}</div>
      <div className="flex-1 progress-bar">
        <div className="progress-fill" style={{ width: `${accuracy}%`, background: color, boxShadow: `0 0 6px ${color}55` }} />
      </div>
      <div className="text-sm font-bold w-10 text-right tabular-nums" style={{ color }}>{Math.round(accuracy)}%</div>
      <div className="text-xs text-white/35 w-12 text-right tabular-nums">{attempted}Q</div>
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
    { data: savedData },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('user_progress').select('*').eq('user_id', authUser.id).order('accuracy_percentage', { ascending: true }),
    supabase.from('test_sessions').select('*').eq('user_id', authUser.id).order('started_at', { ascending: false }).limit(5),
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
  const savedQuestions = (savedData || []) as unknown as Array<{ question_id: string; saved_at: string; questions: Question }>

  const totalAttempted = progress.reduce((s, p) => s + p.questions_attempted, 0)

  const totalCorrect = progress.reduce((s, p) => s + p.questions_correct, 0)
  const overallAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0
  const examSessions = sessions.filter(s => s.session_type === 'real_exam')
  const practiceSessionCount = sessions.filter(s => s.session_type === 'practice_mode').length

  const isExpired = user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date()
  const isFreeStatus = user.subscription_status === 'free'
  const hasBilling = !!user.stripe_customer_id
  // Treat as paid if they have billing, are admin, or have any non-free subscription
  const isFree = isFreeStatus && !hasBilling && !user.is_admin
  const isTrialing = user.subscription_status === 'trialing'
  const hasPaid = hasBilling || !isFreeStatus

  const trialDaysLeft = isTrialing && user.subscription_expires_at
    ? Math.max(0, Math.ceil((new Date(user.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const volumeScore = Math.min(totalAttempted / 200, 1) * 100
  const readiness = totalAttempted === 0 ? 0 : Math.round(overallAccuracy * 0.65 + volumeScore * 0.35)
  const readinessColor = readiness >= 80 ? '#22c55e' : readiness >= 60 ? '#FFB627' : readiness >= 40 ? '#3E92CC' : '#ef4444'
  const readinessLabel = readiness >= 80 ? 'Exam Ready' : readiness >= 60 ? 'On Track' : readiness >= 40 ? 'Building Up' : 'Just Starting'
  const questionsToReady = Math.max(0, 200 - totalAttempted)

  const criticalCategories = progress.filter(p => p.accuracy_percentage < 60)
  const weakCategories = progress.filter(p => p.accuracy_percentage < 60).length
  const solidCategories = progress.filter(p => p.accuracy_percentage >= 80).length
  const weakestCategory = progress[0]

  const firstName = user.full_name?.split(' ')[0] || 'Pilot'

  const TIPS = [
    'Weather questions make up ~15% of the FAA exam. Review METARs, TAFs, and winds-aloft forecasts.',
    'VFR cloud clearances are tested frequently. Remember 3-1-2 for Class E below 10,000 ft.',
    'Airspace questions often use diagrams. Practice reading sectional charts with the supplement.',
    'For weight & balance, always check both the CG limits and the max gross weight.',
    'METAR decoding is a skill — practice reading them aloud to build fluency.',
    'The POH performance charts are your friend. Know how to interpolate for non-standard conditions.',
    'Regulations questions often hinge on a single word. Read every answer choice carefully.',
    'Ground speed, not airspeed, is used to calculate fuel burn for cross-country planning.',
    'Class B, C, D, and E all have different communication requirements — know them cold.',
    'The most-missed questions involve hypoxia and aerodynamic stall recognition.',
  ]
  const todayTip = TIPS[new Date().getDate() % TIPS.length]

  // Accuracy gap vs FAA minimum
  const accuracyGap = 70 - overallAccuracy
  const sessionGap = Math.max(0, 12 - practiceSessionCount)
  const daysToReady = Math.ceil(questionsToReady / 13)

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
      <Suspense fallback={null}>
        <CheckoutSuccessBanner />
      </Suspense>

      {/* ── No subscription — prompt to start trial ──────────────────── */}
      {isFree && !hasPaid && (
        <div
          className="mb-6 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          style={{ background: 'linear-gradient(135deg, rgba(255,182,39,0.1) 0%, rgba(255,182,39,0.04) 100%)', border: '1px solid rgba(255,182,39,0.3)' }}
        >
          <div className="flex-1">
            <p className="text-sm font-bold text-[#FFB627] mb-1">Start your 7-day free trial</p>
            <p className="text-xs text-white/50">Full access to all 1,400+ questions, AI tutor, and timed exams. $14.99/mo after trial — cancel anytime.</p>
          </div>
          <Link
            href="/upgrade"
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: '#FFB627', color: '#0A1628', boxShadow: '0 4px 16px rgba(255,182,39,0.25)' }}
          >
            Start Free Trial
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ── Trial countdown ──────────────────────────────────────────── */}
      {isTrialing && trialDaysLeft !== null && trialDaysLeft <= 3 && (
        <div
          className="mb-6 rounded-2xl p-4 flex items-center gap-4"
          style={{ background: 'rgba(255,182,39,0.08)', border: '1px solid rgba(255,182,39,0.25)' }}
        >
          <p className="text-xs text-white/60 flex-1">
            <span className="font-semibold text-[#FFB627]">{trialDaysLeft === 0 ? 'Trial ends today' : `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in trial`}</span>
            {' · '}$14.99/mo begins automatically unless cancelled.
          </p>
        </div>
      )}

      {/* Expired banner */}
      {isExpired && !isFree && (
        <div className="mb-6 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-400 mb-1">Your subscription has expired</p>
            <p className="text-xs text-white/50">Every day you&apos;re not practicing, other students are pulling ahead. Renew now.</p>
          </div>
          <Link href="/upgrade" className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
            Renew Access
          </Link>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>
          Welcome back, {firstName} ✈️
        </h1>
        <p className="text-white/50 mt-1.5 text-sm">
          {getSubscriptionLabel(user.subscription_status)}
          {isTrialing && trialDaysLeft !== null && (
            <span className="ml-2 text-white/40">· {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'} remaining</span>
          )}
          {!isTrialing && user.subscription_expires_at && !isExpired && (
            <span className="ml-2 text-white/40">· Renews {formatDate(user.subscription_expires_at)}</span>
          )}
          {totalAttempted > 0 && (
            <span className="ml-2 font-semibold" style={{ color: readiness >= 70 ? '#22c55e' : '#FFB627' }}>
              · Readiness: {readiness}%
            </span>
          )}
        </p>
      </div>

      {/* ── Performance Snapshot (free users get comparison context) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="glass-card glass-card-hover p-5 cursor-default">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-[#3E92CC]" />
            <span className="text-white/45 text-xs font-medium uppercase tracking-wide">Questions</span>
          </div>
          <div className="text-3xl font-bold text-white tabular-nums">{totalAttempted.toLocaleString()}</div>
          {totalAttempted === 0 && (
            <div className="text-xs mt-1 text-white/40">Start your first session</div>
          )}
          {isFree && totalAttempted > 0 && totalAttempted < 200 && (
            <div className="text-xs mt-1 font-semibold text-[#FFB627]">
              {(200 - totalAttempted).toLocaleString()} more to test-ready
            </div>
          )}
          {!isFree && totalAttempted > 0 && totalAttempted < 200 && (
            <div className="text-xs text-white/35 mt-1">{200 - totalAttempted} more to full coverage</div>
          )}
        </div>

        <div className="glass-card glass-card-hover p-5 cursor-default">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-white/45 text-xs font-medium uppercase tracking-wide">Accuracy</span>
          </div>
          <div
            className="text-3xl font-bold tabular-nums"
            style={{ color: totalAttempted === 0 ? 'white' : overallAccuracy >= 70 ? '#22c55e' : '#ef4444' }}
          >
            {totalAttempted > 0 ? `${overallAccuracy}%` : '—'}
          </div>
          {totalAttempted > 0 && overallAccuracy < 70 && (
            <div className="text-xs mt-1 font-semibold" style={{ color: '#ef4444' }}>
              {accuracyGap}% below FAA minimum (70%)
            </div>
          )}
          {totalAttempted > 0 && overallAccuracy >= 70 && (
            <div className="text-xs text-green-400 mt-1 font-semibold">Above FAA minimum ✓</div>
          )}
          {totalAttempted === 0 && (
            <div className="text-xs mt-1 text-white/40">Tracked after first session</div>
          )}
        </div>

        <div className="glass-card glass-card-hover p-5 cursor-default">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-[#FFB627]" />
            <span className="text-white/45 text-xs font-medium uppercase tracking-wide">Sessions</span>
          </div>
          <div className="text-3xl font-bold text-white tabular-nums">{practiceSessionCount}</div>
          {isFree && practiceSessionCount > 0 && practiceSessionCount < 12 && (
            <div className="text-xs mt-1 text-white/40">
              Top students: 12+ sessions
            </div>
          )}
        </div>

        <div className="glass-card glass-card-hover p-5 cursor-default">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-4 h-4 text-purple-400" />
            <span className="text-white/45 text-xs font-medium uppercase tracking-wide">Practice Exams</span>
          </div>
          <div className="text-3xl font-bold text-white tabular-nums">{examSessions.length}</div>
          {examSessions.length > 0 && examSessions[0].score !== null ? (
            <div className={`text-xs mt-1 font-semibold ${(examSessions[0].score / 60) >= 0.7 ? 'text-green-400' : 'text-red-400'}`}>
              Last: {examSessions[0].score}/60 · {Math.round((examSessions[0].score / 60) * 100)}%
            </div>
          ) : (
            <div className="text-xs mt-1 text-white/35">Take 3+ before test day</div>
          )}
        </div>
      </div>

      {/* Warning box — only after they've practiced and are below threshold */}
      {isFree && totalAttempted >= 5 && overallAccuracy < 70 && (
        <div
          className="mb-8 rounded-xl px-5 py-3.5 flex items-start gap-3"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderLeft: '4px solid #ef4444' }}
        >
          <span className="text-red-400 font-bold mt-0.5 shrink-0">⚠</span>
          <div className="flex-1">
            <p className="text-sm text-white/80">
              At <span className="font-bold text-red-400">{overallAccuracy}% accuracy</span>, your estimated pass probability is{' '}
              <span className="font-bold text-red-400">~{readiness}%</span> — below the FAA{`'`}s 70% passing threshold.
              {' '}<span className="text-white/60">Students who upgrade and hit 70%+ accuracy pass on their first attempt at a <span className="text-green-400 font-semibold">91% rate</span>.</span>
            </p>
          </div>
          <UpgradeModal
            readiness={readiness}
            questionsNeeded={questionsToReady}
              questionsAttempted={totalAttempted}
            trigger={
              <button className="shrink-0 text-xs font-semibold text-[#FFB627] hover:text-white/80 transition-colors whitespace-nowrap">
                Fix this →
              </button>
            }
          />
        </div>
      )}

      {!isFree && totalAttempted > 0 && <div className="mb-8" />}

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {/* Exam Readiness */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-5 mb-4">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--ring-track)" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="32" fill="none"
                  stroke={readinessColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - readiness / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${readinessColor}88)` }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-black text-white tabular-nums">{readiness}%</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-white/40 mb-1 uppercase tracking-widest font-medium">Exam Readiness</div>
              <div className="text-xl font-bold" style={{ color: totalAttempted === 0 ? 'var(--text-dim)' : readinessColor }}>
                {totalAttempted === 0 ? 'Not started' : readinessLabel}
              </div>
              {totalAttempted > 0 && readiness < 70 && isFree && (
                <div className="text-xs font-semibold mt-0.5" style={{ color: '#FFB627' }}>
                  {70 - readiness} pts to FAA passing score
                </div>
              )}
              {questionsToReady > 0 && totalAttempted > 0 && (
                <div className="text-xs text-white/40 mt-0.5">~{questionsToReady} questions to test-ready</div>
              )}
              {totalAttempted === 0 && (
                <div className="text-xs text-white/40 mt-0.5">Answer questions to see your score</div>
              )}
            </div>
          </div>

          {/* Critical gaps — only show after they've practiced */}
          {isFree && totalAttempted > 0 && criticalCategories.length > 0 && (
            <div
              className="rounded-lg p-3.5 mb-4"
              style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderLeft: '3px solid #ef4444' }}
            >
              <div className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2.5">
                Focus Areas
              </div>
              <div className="space-y-1.5 mb-3">
                {criticalCategories.slice(0, 4).map(p => (
                  <div key={p.category} className="flex items-center justify-between">
                    <span className="text-xs text-white/70 truncate">{p.category}</span>
                    <span className="text-xs font-bold tabular-nums text-red-400 ml-2 shrink-0">
                      {Math.round(p.accuracy_percentage)}% · {p.questions_attempted}Q
                    </span>
                  </div>
                ))}
              </div>

              <UpgradeModal
                readiness={readiness}
                questionsNeeded={questionsToReady}
                questionsAttempted={totalAttempted}
                trigger={
                  <button
                    className="w-full py-2.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
                    style={{ background: '#FFB627', color: '#0A1628' }}
                  >
                    Start Free Trial — 7 Days Free
                  </button>
                }
              />
            </div>
          )}

          {/* Non-free user motivational message */}
          {!isFree && (
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-[#FFB627] shrink-0 mt-0.5" />
              <p className="text-xs text-white/60 leading-relaxed">
                {readiness >= 80
                  ? "You're performing at exam level. Stay sharp and go get it."
                  : readiness >= 60
                    ? "You're close. Focus on your weakest categories to push past 70%."
                    : totalAttempted === 0
                      ? "Start your first practice session to begin tracking your readiness."
                      : "Keep going — every question builds real knowledge. You're making progress."}
              </p>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="glass-card p-5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(255,182,39,0.12)' }}>
            <Zap className="w-5 h-5 text-[#FFB627]" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-white/40 mb-1 uppercase tracking-wider">Category Breakdown</div>
            {progress.length === 0 ? (
              <p className="text-white/60 text-sm">Start practicing to see your strengths and gaps.</p>
            ) : (
              <div className="space-y-1.5">
                {solidCategories > 0 && <p className="text-sm text-green-400">🟢 {solidCategories} strong area{solidCategories !== 1 ? 's' : ''}</p>}
                {weakCategories > 0 && (
                  <>
                    <p className="text-sm text-red-400">🔴 {weakCategories} area{weakCategories !== 1 ? 's' : ''} to work on</p>
                    {isFree && totalAttempted >= 5 && (
                      <p className="text-xs mt-1 text-white/40">
                        Focus here to push your score above 70%.
                      </p>
                    )}
                  </>
                )}
                {weakCategories === 0 && solidCategories > 0 && (
                  <p className="text-xs text-white/40 mt-0.5">No critical gaps — strong position</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Study Tip */}
        <div className="glass-card p-5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(62,146,204,0.12)' }}>
            <Star className="w-5 h-5 text-[#3E92CC]" />
          </div>
          <div>
            <div className="text-xs text-white/40 mb-1 uppercase tracking-wider">
              {isFree ? 'This is on your FAA exam — can you answer it?' : 'Study Tip'}
            </div>
            <p className="text-white/70 text-sm leading-relaxed">{todayTip}</p>
            {isFree && (
              <p className="text-xs mt-2 text-white/40">
                TARMAC&apos;s AI tutor breaks down every question like this — explaining the why, not just the answer. That&apos;s why students who use it pass at a{' '}
                <span className="text-green-400 font-semibold">91% rate</span>.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* ── Quick actions / What to do now ──────────────────────── */}
        <div className="md:col-span-1 space-y-3">
          <h2 className="text-lg font-bold text-white mb-4 tracking-tight">
            {isFree ? 'What You Should Do Now' : 'Quick Actions'}
          </h2>

          {isFree ? (
            <>
              {/* Numbered action list for free users */}
              {[
                {
                  num: '1',
                  title: 'Drill Your Critical Gaps',
                  sub: criticalCategories.length > 0
                    ? `${criticalCategories.map(c => c.category).slice(0, 2).join(', ')} — you're at ${Math.round(criticalCategories[0]?.accuracy_percentage ?? 0)}% accuracy`
                    : 'Focus on your weakest areas',
                  locked: true,
                  color: 'rgba(239,68,68,0.2)',
                  iconColor: '#ef4444',
                },
                {
                  num: '2',
                  title: 'Take a Full Practice Exam',
                  sub: `60Q · 2.5 hrs. At ${overallAccuracy}% accuracy${totalAttempted > 0 ? `, you'd likely fail today` : ''}. See exactly where you stand.`,
                  locked: true,
                  color: 'rgba(255,182,39,0.15)',
                  iconColor: '#FFB627',
                },
                {
                  num: '3',
                  title: 'Study Like a Top Performer',
                  sub: `200+ questions in ~${daysToReady} days. This is how students go from ${overallAccuracy || 0}% to 85%+ accuracy.`,
                  locked: true,
                  color: 'rgba(34,197,94,0.15)',
                  iconColor: '#22c55e',
                },
              ].map(action => (
                <UpgradeModal
                  key={action.num}
                  readiness={readiness}
                  questionsNeeded={questionsToReady}
              questionsAttempted={totalAttempted}
                  trigger={
                    <div
                      className="glass-card p-4 flex items-start gap-3 cursor-pointer hover:bg-white/10 transition-all group"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm font-black"
                        style={{ background: action.color, color: action.iconColor }}
                      >
                        {action.num}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white text-sm">{action.title}</div>
                        <div className="text-white/50 text-xs mt-0.5">{action.sub}</div>
                        {action.locked && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <Lock className="w-3 h-3 text-[#FFB627]" />
                            <span className="text-[10px] text-[#FFB627] font-semibold">Requires full access</span>
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors mt-0.5 shrink-0" />
                    </div>
                  }
                />
              ))}

              <UpgradeModal
                readiness={readiness}
                questionsNeeded={questionsToReady}
              questionsAttempted={totalAttempted}
                trigger={
                  <button
                    className="w-full py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                    style={{ background: '#FFB627', color: '#0A1628', boxShadow: '0 4px 16px rgba(255,182,39,0.2)' }}
                  >
                    Start Free Trial — 7 Days Free
                  </button>
                }
              />
            </>
          ) : (
            <>
              <Link href="/practice" className="glass-card glass-card-hover p-5 flex items-center gap-4 transition-all group block cursor-pointer">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(62,146,204,0.18)', border: '1px solid rgba(62,146,204,0.2)' }}>
                  <BookOpen className="w-5 h-5 text-[#3E92CC]" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white text-sm">Start Practice</div>
                  <div className="text-white/45 text-xs mt-0.5">Drill weak areas</div>
                </div>
                <ArrowRight className="w-4 h-4 text-white/25 group-hover:text-white/60 transition-colors" />
              </Link>

              <a href="/exam-session" target="_blank" rel="noopener noreferrer" className="glass-card glass-card-hover p-5 flex items-center gap-4 transition-all group block cursor-pointer">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,182,39,0.15)', border: '1px solid rgba(255,182,39,0.2)' }}>
                  <ClipboardList className="w-5 h-5 text-[#FFB627]" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white text-sm">Take Practice Exam</div>
                  <div className="text-white/45 text-xs mt-0.5">60Q · 150 min · Opens in new tab</div>
                </div>
                <ArrowRight className="w-4 h-4 text-white/25 group-hover:text-white/60 transition-colors" />
              </a>

              <a href={process.env.NEXT_PUBLIC_SUPPLEMENT_URL || 'https://vdbrfhuzyffipcjifaui.supabase.co/storage/v1/object/public/public/supplement.pdf'} target="_blank" rel="noopener noreferrer" className="glass-card glass-card-hover p-5 flex items-center gap-4 transition-all group block cursor-pointer">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <FileText className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white text-sm">FAA Supplement</div>
                  <div className="text-white/45 text-xs mt-0.5">Charts, figures &amp; tables</div>
                </div>
                <ArrowRight className="w-4 h-4 text-white/25 group-hover:text-white/60 transition-colors" />
              </a>

              {examSessions.length > 0 && examSessions[0].score !== null && (
                <div className="glass-card p-5">
                  <div className="text-white/50 text-sm mb-1">Last Practice Exam</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">{examSessions[0].score}</span>
                    <span className="text-white/40">/60</span>
                    <span className={`text-sm font-semibold ml-auto ${(examSessions[0].score / 60) >= 0.7 ? 'text-green-400' : 'text-red-400'}`}>
                      {(examSessions[0].score / 60) >= 0.7 ? 'PASSED ✓' : 'FAILED ✗'}
                    </span>
                  </div>
                  <div className="text-white/40 text-xs mt-1">{formatDate(examSessions[0].started_at)}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right two columns ────────────────────────────────────── */}
        <div className="md:col-span-2 space-y-6">
          {/* Study Later widget */}
          {savedQuestions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-[#FFB627]" />
                  <h2 className="text-lg font-semibold text-white">Study Later</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full text-[#FFB627] font-semibold" style={{ background: 'rgba(255,182,39,0.12)' }}>
                    {savedQuestions.length}
                  </span>
                </div>
                <Link href="/saved" className="text-white/40 text-sm hover:text-white/70 transition-colors">View all →</Link>
              </div>
              <StudyLaterWidget questions={savedQuestions.map(s => s.questions)} />
            </div>
          )}

          {/* Progress by category */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white tracking-tight">Progress by Category</h2>
              <span className="text-white/35 text-xs">🔴 &lt;60% · 🟡 60–79% · 🟢 80%+</span>
            </div>
            <div className="glass-card p-6">
              {progress.length === 0 ? (
                <div className="text-center py-8">
                  <Plane className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 mb-1">No data yet. Start practicing to see your knowledge map.</p>
                  {isFree && (
                    <p className="text-xs text-white/30 mb-4">The FAA tests 9 knowledge areas. You need to be strong in all of them.</p>
                  )}
                  <Link href="/practice" className="btn-primary text-sm mt-4 inline-flex">Start Practicing</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {progress.map((p) => (
                    <CategoryBar
                      key={p.category}
                      category={p.category}
                      accuracy={p.accuracy_percentage}
                      attempted={p.questions_attempted}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Warning for free users with weak categories — only after practicing */}
            {isFree && totalAttempted > 0 && criticalCategories.length > 0 && (
              <div
                className="mt-3 rounded-xl p-4 flex items-center justify-between gap-4"
                style={{ background: 'rgba(255,182,39,0.06)', border: '1px solid rgba(255,182,39,0.2)' }}
              >
                <p className="text-xs text-white/50">
                  <span className="text-[#FFB627] font-semibold">{criticalCategories.length} critical gap{criticalCategories.length !== 1 ? 's' : ''}</span>
                  {' '}found. Students who fix these before test day pass at a <span className="text-green-400 font-semibold">91% rate</span>.
                  You are <span className="font-semibold text-white/70">{questionsToReady} questions</span> away from being competitive.
                </p>
                <UpgradeModal
                  readiness={readiness}
                  questionsNeeded={questionsToReady}
              questionsAttempted={totalAttempted}
                  trigger={
                    <button className="shrink-0 text-xs font-bold text-[#FFB627] hover:text-white transition-colors whitespace-nowrap">
                      Fix this →
                    </button>
                  }
                />
              </div>
            )}
          </div>

          {/* Recent sessions or zero state */}
          {isFree && totalAttempted === 0 ? (
            // Zero state for new free users — motivational, not scary
            <div className="glass-card p-6 text-center">
              <div className="text-4xl mb-3">✈️</div>
              <h3 className="text-lg font-bold text-white mb-2">You&apos;re ready for takeoff</h3>
              <p className="text-sm text-white/60 mb-4 max-w-sm mx-auto">
                Start practicing to see exactly how TARMAC works. Track your readiness across all 9 knowledge areas.
              </p>
              <Link
                href="/practice"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                style={{ background: '#FFB627', color: '#0A1628' }}
              >
                Start 7-Day Free Trial
                <ChevronRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-white/30 mt-3">91% of students who practice 200+ questions pass on their first attempt</p>
            </div>
          ) : (
            sessions.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4 tracking-tight">Recent Activity</h2>
                <div className="space-y-2">
                  {sessions.slice(0, 4).map((session) => (
                    <div key={session.id} className="glass-card p-4 flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${session.session_type === 'real_exam' ? 'bg-[#FFB627]' : 'bg-[#3E92CC]'}`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">
                          {session.session_type === 'real_exam' ? 'Practice Exam' : 'Practice Session'}
                        </div>
                        <div className="text-xs text-white/40">{formatDate(session.started_at)}</div>
                      </div>
                      {session.score !== null && (
                        <div className="text-right">
                          <div className="text-sm font-semibold text-white">{session.score}/60</div>
                          <div className={`text-xs ${(session.score / 60) >= 0.7 ? 'text-green-400' : 'text-red-400'}`}>
                            {Math.round((session.score / 60) * 100)}%
                          </div>
                        </div>
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${session.status === 'completed' ? 'text-green-300 bg-green-400/15' : 'text-[#3E92CC] bg-[#3E92CC]/15'}`}>
                        {session.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
