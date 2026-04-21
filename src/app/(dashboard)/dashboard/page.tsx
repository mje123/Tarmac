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

const FREE_QUESTION_LIMIT = 10

function CategoryBar({ category, accuracy, attempted }: { category: string; accuracy: number; attempted: number }) {
  const dot = accuracy >= 80 ? '🟢' : accuracy >= 60 ? '🟡' : '🔴'
  const color = accuracy >= 80 ? '#22c55e' : accuracy >= 60 ? '#FFB627' : '#ef4444'
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm shrink-0">{dot}</span>
      <div className="w-20 sm:w-32 text-xs text-white/60 truncate">{category}</div>
      <div className="flex-1 progress-bar">
        <div className="progress-fill" style={{ width: `${accuracy}%`, background: color }} />
      </div>
      <div className="text-sm font-medium text-white w-10 text-right">{Math.round(accuracy)}%</div>
      <div className="text-xs text-white/40 w-16 text-right">{attempted} Q</div>
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
  const savedQuestions = (savedData || []) as unknown as Array<{ question_id: string; saved_at: string; questions: Question }>

  const totalAttempted = progress.reduce((s, p) => s + p.questions_attempted, 0)
  const totalCorrect = progress.reduce((s, p) => s + p.questions_correct, 0)
  const overallAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0
  const examSessions = sessions.filter(s => s.session_type === 'real_exam')
  const practiceSessionCount = sessions.filter(s => s.session_type === 'practice_mode').length

  const isExpired = user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date()
  const isFree = user.subscription_status === 'free'

  const freeQuestionsUsed = (totalAnswers || []).length
  const freeQuestionsRemaining = Math.max(0, FREE_QUESTION_LIMIT - freeQuestionsUsed)
  const freeUsedPct = Math.min(100, (freeQuestionsUsed / FREE_QUESTION_LIMIT) * 100)

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

      {/* ── Free trial urgent banner ─────────────────────────────────── */}
      {isFree && (
        <div
          className="mb-6 rounded-2xl p-5"
          style={{
            background: freeQuestionsRemaining === 0
              ? 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.06) 100%)'
              : 'linear-gradient(135deg, rgba(255,182,39,0.12) 0%, rgba(255,182,39,0.06) 100%)',
            border: `1px solid ${freeQuestionsRemaining === 0 ? 'rgba(239,68,68,0.4)' : 'rgba(255,182,39,0.3)'}`,
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold uppercase tracking-wider" style={{ color: freeQuestionsRemaining === 0 ? '#ef4444' : '#FFB627' }}>
                  {freeQuestionsRemaining === 0 ? '⚠ Free Trial Ended' : '⚠ Free Trial'}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{
                    background: freeQuestionsRemaining === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(255,182,39,0.15)',
                    color: freeQuestionsRemaining === 0 ? '#ef4444' : '#FFB627',
                  }}
                >
                  {freeQuestionsRemaining === 0 ? '0 questions remaining' : `${freeQuestionsRemaining} of ${FREE_QUESTION_LIMIT} left`}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${freeUsedPct}%`, background: freeQuestionsRemaining === 0 ? '#ef4444' : '#FFB627' }}
                  />
                </div>
                <span className="text-xs font-bold text-white/60 shrink-0 tabular-nums">
                  {freeQuestionsUsed}/{FREE_QUESTION_LIMIT} used
                </span>
              </div>

              <p className="text-xs text-white/50">
                {freeQuestionsRemaining === 0
                  ? `You've used all ${FREE_QUESTION_LIMIT} free questions. Unlock everything to keep building toward your checkride.`
                  : freeQuestionsUsed === 0
                    ? `Start with your 10 free questions — no credit card needed. See exactly how TARMAC works before you commit.`
                    : `${freeQuestionsUsed} down, ${freeQuestionsRemaining} free questions left. Students who pass practice 200+ — unlock the full bank when you're ready.`}
              </p>
            </div>

            <UpgradeModal
              readiness={readiness}
              questionsNeeded={questionsToReady}
              trigger={
                <button
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: '#FFB627', color: '#0A1628', boxShadow: '0 4px 16px rgba(255,182,39,0.25)' }}
                >
                  Unlock Full Access
                  <ChevronRight className="w-4 h-4" />
                </button>
              }
            />
          </div>
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
        <h1 className="text-3xl font-bold text-white">
          {isFree ? `Welcome, ${firstName} ✈️` : `Welcome back, ${firstName} ✈️`}
        </h1>
        <p className="text-white/60 mt-1 text-sm">
          {isFree
            ? <span>Free Trial &middot; {totalAttempted > 0
                ? <span className="font-semibold" style={{ color: readiness >= 70 ? '#22c55e' : '#FFB627' }}>Pass prediction: {readiness}% — {readiness >= 70 ? 'on track' : 'keep practicing to reach 70%'}</span>
                : <span className="text-white/50">Start practicing to track your readiness</span>
              }</span>
            : <>
                {getSubscriptionLabel(user.subscription_status)}
                {user.subscription_expires_at && !isExpired && (
                  <span className="ml-2 text-white/40">· Expires {formatDate(user.subscription_expires_at)}</span>
                )}
              </>
          }
        </p>
      </div>

      {/* ── Performance Snapshot (free users get comparison context) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-[#3E92CC]" />
            <span className="text-white/50 text-xs">Questions Practiced</span>
          </div>
          <div className="text-3xl font-bold text-white">{totalAttempted.toLocaleString()}</div>
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

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-white/50 text-xs">Accuracy</span>
          </div>
          <div
            className="text-3xl font-bold"
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

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-[#FFB627]" />
            <span className="text-white/50 text-xs">Study Sessions</span>
          </div>
          <div className="text-3xl font-bold text-white">{practiceSessionCount}</div>
          {isFree && practiceSessionCount > 0 && practiceSessionCount < 12 && (
            <div className="text-xs mt-1 text-white/40">
              Top students: 12+ sessions
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-5 h-5 text-purple-400" />
            <span className="text-white/50 text-xs">Practice Exams</span>
          </div>
          <div className="text-3xl font-bold text-white">{examSessions.length}</div>
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
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle
                  cx="32" cy="32" r="26" fill="none"
                  stroke={readinessColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - readiness / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-white">{readiness}%</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-0.5 uppercase tracking-wider">Exam Readiness</div>
              <div className="text-lg font-bold" style={{ color: totalAttempted === 0 ? 'rgba(255,255,255,0.4)' : readinessColor }}>
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
                Critical Gaps — These WILL appear on your exam
              </div>
              <div className="space-y-1.5 mb-3">
                {criticalCategories.slice(0, 4).map(p => (
                  <div key={p.category} className="flex items-center justify-between">
                    <span className="text-xs text-white/70 truncate">{p.category}</span>
                    <span className="text-xs font-bold tabular-nums text-red-400 ml-2 shrink-0">
                      {Math.round(p.accuracy_percentage)}% · {p.questions_attempted}Q practiced
                    </span>
                  </div>
                ))}
              </div>

              <div
                className="text-xs space-y-1 mb-3 pt-2.5"
                style={{ borderTop: '1px solid rgba(239,68,68,0.15)' }}
              >
                <div className="font-semibold text-white/60 mb-1">If you ignore these:</div>
                {['68% of students who skip critical gaps fail', 'You waste $175 on a retake fee', 'You delay your training by 2–4 weeks'].map(c => (
                  <div key={c} className="flex items-start gap-1.5">
                    <span className="text-red-400 shrink-0">•</span>
                    <span className="text-white/50">{c}</span>
                  </div>
                ))}
                <div className="font-semibold text-white/60 mt-2 mb-1">If you drill them now:</div>
                {['91% of students who hit 70%+ accuracy pass first try', 'You save the $175 retake fee', 'You pass in ~' + daysToReady + ' days of focused practice'].map(c => (
                  <div key={c} className="flex items-start gap-1.5">
                    <span className="text-green-400 shrink-0">•</span>
                    <span className="text-white/50">{c}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs font-semibold text-white/50 mb-2.5 text-center">
                Full access is $89. A retake costs $175. Do the math.
              </p>

              <UpgradeModal
                readiness={readiness}
                questionsNeeded={questionsToReady}
                trigger={
                  <button
                    className="w-full py-2.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
                    style={{ background: '#FFB627', color: '#0A1628' }}
                  >
                    UNLOCK FULL ACCESS — $89
                  </button>
                }
              />
              <button
                className="w-full mt-2 py-2 rounded-lg text-xs text-white/25 hover:text-white/50 transition-colors"
              >
                I&apos;ll risk the $175 retake fee
              </button>
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
          <h2 className="text-lg font-semibold text-white mb-4">
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
                trigger={
                  <button
                    className="w-full py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                    style={{ background: '#FFB627', color: '#0A1628', boxShadow: '0 4px 16px rgba(255,182,39,0.2)' }}
                  >
                    Unlock Everything — $89
                  </button>
                }
              />
            </>
          ) : (
            <>
              <Link href="/practice" className="glass-card p-5 flex items-center gap-4 hover:bg-white/10 transition-all group block">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(62,146,204,0.2)' }}>
                  <BookOpen className="w-6 h-6 text-[#3E92CC]" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">Start Practice</div>
                  <div className="text-white/50 text-sm">Drill weak areas</div>
                </div>
                <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
              </Link>

              <a href="/exam-session" target="_blank" rel="noopener noreferrer" className="glass-card p-5 flex items-center gap-4 hover:bg-white/10 transition-all group block">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,182,39,0.15)' }}>
                  <ClipboardList className="w-6 h-6 text-[#FFB627]" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">Take Practice Exam</div>
                  <div className="text-white/50 text-sm">60Q · 150 min · Opens in new tab</div>
                </div>
                <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
              </a>

              <a href={process.env.NEXT_PUBLIC_SUPPLEMENT_URL || 'https://vdbrfhuzyffipcjifaui.supabase.co/storage/v1/object/public/public/supplement.pdf'} target="_blank" rel="noopener noreferrer" className="glass-card p-5 flex items-center gap-4 hover:bg-white/10 transition-all group block">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.15)' }}>
                  <FileText className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">FAA Supplement</div>
                  <div className="text-white/50 text-sm">Charts, figures &amp; tables</div>
                </div>
                <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
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
              <h2 className="text-lg font-semibold text-white">Progress by Category</h2>
              <span className="text-white/40 text-sm text-xs">🔴 &lt;60% · 🟡 60–79% · 🟢 80%+</span>
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
                  trigger={
                    <button className="shrink-0 text-xs font-bold text-[#FFB627] hover:text-white transition-colors whitespace-nowrap">
                      Fix this →
                    </button>
                  }
                />
              </div>
            )}
          </div>

          {/* Progress vs Top Students (free users with data) OR Recent Activity (paid) */}
          {isFree && totalAttempted > 0 ? (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Your Progress vs. Top Students</h2>
              <div className="glass-card p-5">
                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  {/* You */}
                  <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <div className="text-xs font-bold uppercase tracking-wider text-red-400 mb-3">You (right now)</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/50">Questions practiced</span>
                        <span className="font-bold text-white">{totalAttempted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Accuracy</span>
                        <span className="font-bold" style={{ color: overallAccuracy >= 70 ? '#22c55e' : '#ef4444' }}>
                          {totalAttempted > 0 ? `${overallAccuracy}%` : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Study sessions</span>
                        <span className="font-bold text-white">{practiceSessionCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Pass prediction</span>
                        <span className="font-bold text-red-400">{readiness}% ✗</span>
                      </div>
                    </div>
                  </div>

                  {/* Top students */}
                  <div className="rounded-xl p-4" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <div className="text-xs font-bold uppercase tracking-wider text-green-400 mb-3">Students Who Passed (1st try)</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/50">Questions practiced</span>
                        <span className="font-bold text-white">200+</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Accuracy</span>
                        <span className="font-bold text-green-400">70–90%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Study sessions</span>
                        <span className="font-bold text-white">12+</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Pass rate</span>
                        <span className="font-bold text-green-400">91% ✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-lg p-3.5 mb-4 text-sm"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/50 text-xs">At current pace</span>
                    <span className="font-bold text-red-400">Not test-ready</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-xs">With full access + daily practice</span>
                    <span className="font-bold text-green-400">~{daysToReady} days to ready</span>
                  </div>
                </div>

                <UpgradeModal
                  readiness={readiness}
                  questionsNeeded={questionsToReady}
                  trigger={
                    <button
                      className="w-full py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                      style={{ background: '#FFB627', color: '#0A1628' }}
                    >
                      Join Students Who Pass — $89
                    </button>
                  }
                />

                {/* Social proof */}
                <div className="mt-3 pt-3 flex items-center justify-center gap-4 text-[10px] text-white/25" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span>247 students upgraded this week</span>
                  <span>·</span>
                  <span>91% pass rate on first attempt</span>
                </div>
              </div>
            </div>
          ) : isFree && totalAttempted === 0 ? (
            // Zero state for new free users — motivational, not scary
            <div className="glass-card p-6 text-center">
              <div className="text-4xl mb-3">✈️</div>
              <h3 className="text-lg font-bold text-white mb-2">You're ready for takeoff</h3>
              <p className="text-sm text-white/60 mb-4 max-w-sm mx-auto">
                Start your 10 free questions to see exactly how TARMAC works. No credit card, no commitment — just real FAA prep.
              </p>
              <Link
                href="/practice"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                style={{ background: '#FFB627', color: '#0A1628' }}
              >
                Start Practicing — Free
                <ChevronRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-white/30 mt-3">91% of students who practice 200+ questions pass on their first attempt</p>
            </div>
          ) : (
            sessions.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
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
