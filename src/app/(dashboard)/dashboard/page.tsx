import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, UserProgress, TestSession, Question } from '@/types'
import { formatDate, getSubscriptionLabel } from '@/lib/utils'
import Link from 'next/link'
import {
  Target,
  BookOpen,
  ClipboardList,
  TrendingUp,
  ArrowRight,
  Plane,
  AlertCircle,
  FileText,
  Bookmark,
  Zap,
  Star,
  Trophy,
} from 'lucide-react'
import StudyLaterWidget from '@/components/ui/StudyLaterWidget'

function CategoryBar({ category, accuracy, attempted }: { category: string; accuracy: number; attempted: number }) {
  const color = accuracy >= 80 ? '#22c55e' : accuracy >= 60 ? '#FFB627' : '#ef4444'
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-xs text-white/60 truncate">{category}</div>
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
    supabase.from('test_answers').select('id, is_correct', { count: 'exact' }).eq('user_id', authUser.id),
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

  // Readiness score: accuracy weighted 65%, volume 35% (200 questions = full credit)
  const volumeScore = Math.min(totalAttempted / 200, 1) * 100
  const readiness = totalAttempted === 0 ? 0 : Math.round(overallAccuracy * 0.65 + volumeScore * 0.35)
  const readinessColor = readiness >= 80 ? '#22c55e' : readiness >= 60 ? '#FFB627' : readiness >= 40 ? '#3E92CC' : '#ef4444'
  const readinessLabel = readiness >= 80 ? 'Exam Ready' : readiness >= 60 ? 'On Track' : readiness >= 40 ? 'Building Up' : 'Just Starting'

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

  const motivationalMessage =
    overallAccuracy >= 80 ? "You're performing at exam level. Stay sharp and go get it!"
    : overallAccuracy >= 70 ? "You're right at the passing threshold. A bit more practice and you'll be solid."
    : overallAccuracy >= 60 ? "Good momentum. Focus on your weakest categories to push past 70%."
    : overallAccuracy >= 40 ? "Keep going — every question you practice builds real knowledge."
    : totalAttempted === 0 ? "Start your first practice session to begin tracking your readiness."
    : "Everyone starts here. The concepts will click — just stay consistent."

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user.full_name?.split(' ')[0] || 'Pilot'} ✈️
        </h1>
        <p className="text-white/60 mt-1">
          {getSubscriptionLabel(user.subscription_status)}
          {user.subscription_expires_at && !isExpired && (
            <span className="ml-2 text-white/40">· Expires {formatDate(user.subscription_expires_at)}</span>
          )}
          {isExpired && (
            <span className="ml-2 text-red-400">· Subscription expired</span>
          )}
        </p>
      </div>


      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Questions Attempted', value: totalAttempted.toLocaleString(), icon: <Target className="w-5 h-5 text-[#3E92CC]" /> },
          { label: 'Overall Accuracy', value: `${overallAccuracy}%`, icon: <TrendingUp className="w-5 h-5 text-green-400" /> },
          { label: 'Practice Sessions', value: practiceSessionCount, icon: <BookOpen className="w-5 h-5 text-[#FFB627]" /> },
          { label: 'Practice Exams Taken', value: examSessions.length, icon: <ClipboardList className="w-5 h-5 text-purple-400" /> },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2">
              {stat.icon}
              <span className="text-white/50 text-xs">{stat.label}</span>
            </div>
            <div className="text-3xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Readiness + motivation row */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {/* Exam Readiness */}
        <div className="glass-card p-5 flex items-center gap-4">
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
            <div className="text-lg font-bold" style={{ color: readinessColor }}>{readinessLabel}</div>
            <div className="text-xs text-white/40 mt-0.5">{totalAttempted} questions practiced</div>
          </div>
        </div>

        {/* Motivational message */}
        <div className="glass-card p-5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(255,182,39,0.12)' }}>
            <Zap className="w-5 h-5 text-[#FFB627]" />
          </div>
          <div>
            <div className="text-xs text-white/40 mb-1 uppercase tracking-wider">Your Progress</div>
            <p className="text-white/85 text-sm leading-relaxed">{motivationalMessage}</p>
          </div>
        </div>

        {/* Daily tip */}
        <div className="glass-card p-5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(62,146,204,0.12)' }}>
            <Star className="w-5 h-5 text-[#3E92CC]" />
          </div>
          <div>
            <div className="text-xs text-white/40 mb-1 uppercase tracking-wider">Study Tip</div>
            <p className="text-white/70 text-sm leading-relaxed">{todayTip}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="md:col-span-1 space-y-3">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>

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

          <a href="/supplement.pdf" target="_blank" rel="noopener noreferrer" className="glass-card p-5 flex items-center gap-4 hover:bg-white/10 transition-all group block">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.15)' }}>
              <FileText className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">FAA Supplement</div>
              <div className="text-white/50 text-sm">Charts, figures &amp; tables</div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
          </a>

          {/* Last exam score */}
          {examSessions.length > 0 && examSessions[0].score !== null && (
            <div className="glass-card p-5">
              <div className="text-white/50 text-sm mb-1">Last Practice Exam Score</div>
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
        </div>

        {/* Right column */}
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
              <span className="text-white/40 text-sm">Sorted by accuracy</span>
            </div>
            <div className="glass-card p-6">
              {progress.length === 0 ? (
                <div className="text-center py-8">
                  <Plane className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40">No data yet. Start practicing to see your progress.</p>
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
          </div>

          {/* Recent sessions */}
          {sessions.length > 0 && (
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
          )}
        </div>
      </div>
    </div>
  )
}
