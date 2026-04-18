'use client'

import { useState, useEffect } from 'react'
import { Question, AnswerOption, QuestionCategory } from '@/types'
import AIChat from '@/components/ui/AIChat'
import SupplementViewer from '@/components/ui/SupplementViewer'
import GeneralChat from '@/components/ui/GeneralChat'
import {
  CheckCircle,
  XCircle,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Loader2,
  Bookmark,
  Plane,
  Zap,
  Target,
  TrendingUp,
  Cloud,
  Compass,
  Wind,
  Gauge,
  Scale,
  Radio,
  Map,
  Play,
  Trophy,
  Flame,
} from 'lucide-react'

const CATEGORIES: { value: QuestionCategory; icon: React.ElementType; color: string }[] = [
  { value: 'Regulations', icon: BookOpen, color: '#3E92CC' },
  { value: 'Airspace', icon: Compass, color: '#8B5CF6' },
  { value: 'Weather Theory', icon: Cloud, color: '#06B6D4' },
  { value: 'Weather Services', icon: Wind, color: '#10B981' },
  { value: 'Aircraft Performance', icon: Gauge, color: '#F59E0B' },
  { value: 'Weight & Balance', icon: Scale, color: '#EF4444' },
  { value: 'Aerodynamics', icon: Plane, color: '#EC4899' },
  { value: 'Flight Instruments', icon: Radio, color: '#6366F1' },
  { value: 'Navigation', icon: Map, color: '#14B8A6' },
]

const PRACTICE_KEY = 'tarmac_practice_state'
const MAX_AGE_MS = 24 * 60 * 60 * 1000

type Phase = 'setup' | 'question' | 'correct' | 'wrong' | 'summary'

interface PracticeState {
  sessionId: string
  category: QuestionCategory | 'all' | 'weak'
  selectedCategories?: QuestionCategory[]
  correctCount: number
  totalAnswered: number
  askedIds: string[]
  savedAt: number
}

function loadPracticeState(): PracticeState | null {
  try {
    const raw = localStorage.getItem(PRACTICE_KEY)
    if (!raw) return null
    const state: PracticeState = JSON.parse(raw)
    if (Date.now() - state.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(PRACTICE_KEY)
      return null
    }
    return state
  } catch {
    return null
  }
}

export default function PracticePage() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [category, setCategory] = useState<QuestionCategory | 'all' | 'weak'>('all')
  const [selectedCategories, setSelectedCategories] = useState<Set<QuestionCategory>>(new Set())
  const [question, setQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [askedIds, setAskedIds] = useState<string[]>([])
  const [freeQuestionsLeft, setFreeQuestionsLeft] = useState<number | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [resumeState, setResumeState] = useState<PracticeState | null>(null)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    setResumeState(loadPracticeState())
  }, [])

  function savePracticeProgress(
    sid: string,
    cat: QuestionCategory | 'all' | 'weak',
    correct: number,
    total: number,
    asked: string[],
    selCats?: QuestionCategory[]
  ) {
    localStorage.setItem(PRACTICE_KEY, JSON.stringify({
      sessionId: sid, category: cat, selectedCategories: selCats,
      correctCount: correct, totalAnswered: total, askedIds: asked, savedAt: Date.now(),
    }))
  }

  async function startSession() {
    setLoading(true)
    try {
      const [sessionRes, savedRes] = await Promise.all([
        fetch('/api/sessions/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionType: 'practice_mode' }),
        }),
        fetch('/api/questions/save'),
      ])
      const data = await sessionRes.json()
      if (data.error === 'FREE_LIMIT') {
        setFreeQuestionsLeft(0)
        setLoading(false)
        return
      }
      const savedData = await savedRes.json()
      setSavedIds(new Set(savedData.savedIds || []))
      setSessionId(data.sessionId)
      setFreeQuestionsLeft(data.freeQuestionsLeft ?? null)
      setCorrectCount(0)
      setTotalAnswered(0)
      setAskedIds([])
      setStreak(0)
      setResumeState(null)
      await fetchQuestion(data.sessionId, [], category, selectedCategories)
    } finally {
      setLoading(false)
    }
  }

  async function resumeSession(state: PracticeState) {
    setLoading(true)
    try {
      const savedRes = await fetch('/api/questions/save')
      const savedData = await savedRes.json()
      setSavedIds(new Set(savedData.savedIds || []))
      const restoredCats = new Set<QuestionCategory>(state.selectedCategories ?? [])
      setSessionId(state.sessionId)
      setCategory(state.category)
      setSelectedCategories(restoredCats)
      setCorrectCount(state.correctCount)
      setTotalAnswered(state.totalAnswered)
      setAskedIds(state.askedIds)
      setResumeState(null)
      await fetchQuestion(state.sessionId, state.askedIds, state.category, restoredCats)
    } finally {
      setLoading(false)
    }
  }

  async function fetchQuestion(
    sid: string,
    excludeIds: string[],
    cat: QuestionCategory | 'all' | 'weak',
    selCats?: Set<QuestionCategory>
  ) {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      const multi = selCats && selCats.size > 0 ? selCats : null
      if (multi) {
        multi.forEach(c => params.append('categories', c))
      } else if (cat !== 'all' && cat !== 'weak') {
        params.set('category', cat)
      } else if (cat === 'weak') {
        params.set('weak', '1')
      }
      excludeIds.forEach(id => params.append('exclude', id))
      const res = await fetch(`/api/questions/random?${params}`)
      const data = await res.json()
      if (!data.question) {
        setPhase('summary')
        return
      }
      setQuestion(data.question)
      setSelectedAnswer(null)
      setPhase('question')
    } finally {
      setLoading(false)
    }
  }

  async function submitAnswer(answer: AnswerOption) {
    if (!question || !sessionId) return
    setSelectedAnswer(answer)
    const isCorrect = answer === question.correct_answer
    const newCorrect = correctCount + (isCorrect ? 1 : 0)
    const newTotal = totalAnswered + 1
    setTotalAnswered(newTotal)
    if (isCorrect) {
      setCorrectCount(newCorrect)
      setStreak(s => s + 1)
    } else {
      setStreak(0)
    }
    await fetch('/api/sessions/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, questionId: question.id, answer, isCorrect }),
    })
    savePracticeProgress(sessionId, category, newCorrect, newTotal, askedIds, [...selectedCategories])
    if (isCorrect) setPhase('correct')
    else setPhase('wrong')
  }

  async function nextQuestion() {
    const newIds = [...askedIds, question!.id]
    setAskedIds(newIds)
    setLoading(true)
    const params = new URLSearchParams()
    if (category !== 'all' && category !== 'weak') params.set('category', category)
    if (category === 'weak') params.set('weak', '1')
    newIds.forEach(id => params.append('exclude', id))
    const res = await fetch(`/api/questions/random?${params}`)
    const data = await res.json()
    if (!data.question) {
      setAskedIds([])
      await fetchQuestion(sessionId!, [], category, selectedCategories)
    } else {
      setQuestion(data.question)
      setSelectedAnswer(null)
      setPhase('question')
      setLoading(false)
    }
  }

  function endSession() {
    if (sessionId) savePracticeProgress(sessionId, category, correctCount, totalAnswered, askedIds, [...selectedCategories])
    setPhase('summary')
  }

  function reset() {
    localStorage.removeItem(PRACTICE_KEY)
    setPhase('setup')
    setCorrectCount(0)
    setTotalAnswered(0)
    setAskedIds([])
    setSessionId(null)
    setQuestion(null)
    setStreak(0)
    setResumeState(loadPracticeState())
  }

  async function toggleSave() {
    if (!question) return
    const isSaved = savedIds.has(question.id)
    await fetch('/api/questions/save', {
      method: isSaved ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: question.id }),
    })
    setSavedIds(prev => {
      const next = new Set(prev)
      isSaved ? next.delete(question.id) : next.add(question.id)
      return next
    })
  }

  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0

  const optionKeys: AnswerOption[] = question
    ? (['A', 'B', 'C', 'D'] as AnswerOption[]).filter(k =>
        k === 'A' || k === 'B' || k === 'C' || (k === 'D' && !!question.option_d)
      )
    : ['A', 'B', 'C']
  const optionValues: Record<string, string> = question ? {
    A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d || '',
  } : { A: '', B: '', C: '', D: '' }

  // ── Free limit wall ──────────────────────────────────────────────────────────
  if (freeQuestionsLeft === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="glass-card p-10 max-w-md text-center animate-fade-in">
          <Plane className="w-16 h-16 text-[#FFB627] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Free trial complete</h2>
          <p className="text-white/60 mb-6">You've used your 20 free questions. Upgrade to keep learning.</p>
          <a href="/#pricing" className="btn-gold inline-flex justify-center px-8 py-3">View Plans</a>
        </div>
      </div>
    )
  }

  // ── Setup screen ─────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    const isMulti = selectedCategories.size > 0
    const isAll = !isMulti && category === 'all'
    const isWeak = !isMulti && category === 'weak'

    function toggleCategory(val: QuestionCategory) {
      setSelectedCategories(prev => {
        const next = new Set(prev)
        if (next.has(val)) next.delete(val)
        else next.add(val)
        return next
      })
      setCategory('all') // mode = multi when selectedCategories.size > 0
    }

    function selectSpecial(mode: 'all' | 'weak') {
      setSelectedCategories(new Set())
      setCategory(mode)
    }

    const startLabel = isMulti
      ? `Start Practice — ${selectedCategories.size} topic${selectedCategories.size > 1 ? 's' : ''}`
      : isWeak ? 'Start Practice — Weak Areas'
      : 'Start Practice — All Topics'

    return (
      <div className="min-h-screen p-6 md:p-10 max-w-4xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3E92CC22, #3E92CC44)' }}>
              <BookOpen className="w-5 h-5 text-[#3E92CC]" />
            </div>
            <h1 className="text-3xl font-bold text-white">Practice Mode</h1>
          </div>
          <p className="text-white/50 text-sm ml-13 pl-1">Answer questions, get instant AI feedback, and build real knowledge.</p>
        </div>

        {/* Resume banner */}
        {resumeState && (
          <div className="mb-6 p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(62,146,204,0.12), rgba(62,146,204,0.06))', border: '1px solid rgba(62,146,204,0.25)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Play className="w-4 h-4 text-[#3E92CC]" />
              <span className="text-sm font-bold text-white">Session in Progress</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{resumeState.totalAnswered}</div>
                <div className="text-white/40 text-xs">Answered</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-[#FFB627]">
                  {resumeState.totalAnswered > 0 ? Math.round((resumeState.correctCount / resumeState.totalAnswered) * 100) : 0}%
                </div>
                <div className="text-white/40 text-xs">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-[#3E92CC] truncate">
                  {resumeState.selectedCategories && resumeState.selectedCategories.length > 0
                    ? `${resumeState.selectedCategories.length} topics`
                    : resumeState.category === 'all' ? 'All' : resumeState.category === 'weak' ? 'Weak' : resumeState.category.split(' ')[0]}
                </div>
                <div className="text-white/40 text-xs">Topic</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => resumeSession(resumeState)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #3E92CC, #2a7ab5)' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-4 h-4" /> Resume Session</>}
              </button>
              <button
                onClick={() => { localStorage.removeItem(PRACTICE_KEY); setResumeState(null) }}
                className="px-4 py-2.5 rounded-xl text-xs text-white/40 hover:text-white/60 transition-colors border border-white/10"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Topic selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Select Topics</h2>
            {isMulti && (
              <button onClick={() => selectSpecial('all')} className="text-xs text-[#3E92CC] hover:text-[#5aabdf]">
                Clear ({selectedCategories.size})
              </button>
            )}
          </div>

          {/* Special options */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => selectSpecial('all')}
              className="p-3 rounded-xl text-left transition-all"
              style={{
                background: isAll ? 'linear-gradient(135deg, rgba(255,182,39,0.2), rgba(255,182,39,0.1))' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isAll ? 'rgba(255,182,39,0.4)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,182,39,0.15)' }}>
                  <Zap className="w-3.5 h-3.5 text-[#FFB627]" />
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">All Topics</div>
                  <div className="text-white/40 text-xs">Mixed practice</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => selectSpecial('weak')}
              className="p-3 rounded-xl text-left transition-all"
              style={{
                background: isWeak ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isWeak ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
                  <Target className="w-3.5 h-3.5 text-red-400" />
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">Weak Areas</div>
                  <div className="text-white/40 text-xs">Focus on misses</div>
                </div>
              </div>
            </button>
          </div>

          {/* Category grid — multi-select checkboxes */}
          <p className="text-white/30 text-xs mb-2">Or pick specific topics to combine:</p>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(({ value, icon: Icon, color }) => {
              const checked = selectedCategories.has(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleCategory(value)}
                  className="p-3 rounded-xl text-left transition-all relative"
                  style={{
                    background: checked ? `linear-gradient(135deg, ${color}22, ${color}11)` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${checked ? `${color}55` : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {/* Checkmark */}
                  <div
                    className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: checked ? color : 'rgba(255,255,255,0.08)',
                      border: `1px solid ${checked ? color : 'rgba(255,255,255,0.15)'}`,
                    }}
                  >
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: `${color}20` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                  <div className="text-white text-xs font-medium leading-tight pr-4">{value}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={startSession}
          disabled={loading}
          className="btn-gold w-full justify-center py-4 text-base font-bold gap-3"
          style={{ borderRadius: '16px' }}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Play className="w-5 h-5" />
              {resumeState ? 'Start New Session' : startLabel}
            </>
          )}
        </button>

        {freeQuestionsLeft !== null && freeQuestionsLeft > 0 && (
          <p className="text-center text-white/30 text-xs mt-3">{freeQuestionsLeft} free questions remaining</p>
        )}
      </div>
    )
  }

  // ── Summary screen ────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const grade = accuracy >= 90 ? 'Outstanding! You\'re killing it! 🔥' : accuracy >= 70 ? 'Solid work — you\'re on track! ✈️' : accuracy >= 50 ? 'Good effort — keep pushing! 💪' : 'Every question is progress — don\'t stop! 🛫'
    const gradeColor = accuracy >= 90 ? '#10B981' : accuracy >= 70 ? '#FFB627' : accuracy >= 50 ? '#3E92CC' : '#EF4444'
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="glass-card p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: `${gradeColor}20`, border: `2px solid ${gradeColor}40` }}>
            <Trophy className="w-9 h-9" style={{ color: gradeColor }} />
          </div>
          <div className="text-5xl font-bold text-white mb-1">{accuracy}%</div>
          <div className="font-semibold mb-1" style={{ color: gradeColor }}>{grade}</div>
          <div className="text-white/40 text-sm mb-8">{correctCount} of {totalAnswered} questions correct</div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: 'Correct', value: correctCount, color: '#10B981' },
              { label: 'Missed', value: totalAnswered - correctCount, color: '#EF4444' },
              { label: 'Streak', value: streak, color: '#FFB627' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                <div className="text-2xl font-bold" style={{ color }}>{value}</div>
                <div className="text-white/40 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <button onClick={reset} className="btn-primary w-full justify-center py-3 gap-2">
            <RotateCcw className="w-4 h-4" />
            New Practice Session
          </button>
        </div>
      </div>
    )
  }

  // ── Loading ────────────────────────────────────────────────────────────────────
  if (!question || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-[#3E92CC] animate-spin" />
      </div>
    )
  }

  const supplementRef = question.question_text.match(/FAA-CT-8080-2H[,\s]+(Figure|Legend)\s+\d+/i)?.[0]
    || question.question_text.match(/\(Refer to (Figure|Legend)\s+\d+/i)?.[0]?.replace('(Refer to ', '')

  const isSaved = savedIds.has(question.id)
  const catInfo = CATEGORIES.find(c => c.value === question.category)

  const optionLetterColors: Record<string, string> = { A: '#3E92CC', B: '#8B5CF6', C: '#10B981', D: '#F59E0B' }

  // ── Question screen ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 md:p-6 flex flex-col max-w-3xl mx-auto animate-fade-in">
      {/* Top bar */}
      <div className="mb-5 flex items-center gap-4">
        {/* Stats row */}
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <TrendingUp className="w-3.5 h-3.5 text-[#3E92CC]" />
            <span className="text-white text-sm font-semibold">{correctCount}/{totalAnswered}</span>
          </div>
          {totalAnswered > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: accuracy >= 70 ? 'rgba(16,185,129,0.1)' : 'rgba(255,182,39,0.1)', border: `1px solid ${accuracy >= 70 ? 'rgba(16,185,129,0.25)' : 'rgba(255,182,39,0.25)'}` }}>
              <span className="text-sm font-bold" style={{ color: accuracy >= 70 ? '#10B981' : '#FFB627' }}>{accuracy}%</span>
            </div>
          )}
          {streak >= 2 && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400 text-sm font-bold">{streak}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a href="/supplement.pdf" target="_blank" rel="noopener noreferrer"
            className="text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1">
            Supplement ↗
          </a>
          <button onClick={endSession} className="text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1">
            End
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: totalAnswered > 0 ? `${accuracy}%` : '0%',
            background: accuracy >= 70 ? 'linear-gradient(90deg, #10B981, #34D399)' : 'linear-gradient(90deg, #3E92CC, #60B4E8)',
          }}
        />
      </div>

      {supplementRef && (
        <div className="mb-4">
          <SupplementViewer figureRef={supplementRef} />
        </div>
      )}

      {/* Question card */}
      <div className="glass-card p-6 flex-1 flex flex-col" style={{ borderRadius: '20px' }}>
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {catInfo && (
            <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: `${catInfo.color}18`, color: catInfo.color, border: `1px solid ${catInfo.color}30` }}>
              <catInfo.icon className="w-3 h-3" />
              {question.category}
            </span>
          )}
          <span className="text-xs px-3 py-1.5 rounded-full font-medium capitalize"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {question.difficulty}
          </span>
          <button
            onClick={toggleSave}
            title={isSaved ? 'Remove from Study Later' : 'Save to Study Later'}
            className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
            style={{
              background: isSaved ? 'rgba(255,182,39,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isSaved ? 'rgba(255,182,39,0.35)' : 'rgba(255,255,255,0.1)'}`,
              color: isSaved ? '#FFB627' : 'rgba(255,255,255,0.3)',
            }}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            {isSaved ? 'Saved' : 'Study Later'}
          </button>
        </div>

        <p className="text-white text-lg leading-relaxed mb-7 font-medium flex-shrink-0">{question.question_text}</p>

        <div className="space-y-2.5 flex-1">
          {optionKeys.map(key => {
            const isCorrect = key === question.correct_answer
            const isSelected = key === selectedAnswer
            const revealed = phase !== 'question'

            let bg = 'rgba(255,255,255,0.04)'
            let border = 'rgba(255,255,255,0.09)'
            let letterBg = 'rgba(255,255,255,0.08)'
            let letterColor = 'rgba(255,255,255,0.5)'
            let textColor = 'rgba(255,255,255,0.85)'
            let hoverScale = phase === 'question' ? 'hover:scale-[1.005]' : ''

            if (revealed) {
              if (isCorrect) {
                bg = 'rgba(16,185,129,0.1)'
                border = 'rgba(16,185,129,0.35)'
                letterBg = 'rgba(16,185,129,0.2)'
                letterColor = '#10B981'
                textColor = 'white'
              } else if (isSelected && !isCorrect) {
                bg = 'rgba(239,68,68,0.1)'
                border = 'rgba(239,68,68,0.35)'
                letterBg = 'rgba(239,68,68,0.2)'
                letterColor = '#EF4444'
                textColor = 'rgba(255,255,255,0.6)'
              } else {
                textColor = 'rgba(255,255,255,0.3)'
                letterColor = 'rgba(255,255,255,0.2)'
              }
            }

            return (
              <button
                key={key}
                onClick={() => phase === 'question' && submitAnswer(key)}
                className={`w-full text-left p-4 flex items-center gap-3 transition-all duration-150 rounded-2xl ${hoverScale}`}
                style={{ background: bg, border: `1px solid ${border}`, cursor: phase === 'question' ? 'pointer' : 'default' }}
              >
                <span className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-colors"
                  style={{ background: letterBg, color: letterColor }}>
                  {key}
                </span>
                <span className="leading-relaxed text-sm transition-colors" style={{ color: textColor }}>{optionValues[key]}</span>
                {revealed && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 ml-auto" />}
                {revealed && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400 shrink-0 ml-auto" />}
              </button>
            )
          })}
        </div>

        {/* Correct feedback */}
        {phase === 'correct' && (
          <div className="mt-5 animate-fade-in">
            <div className="p-4 rounded-2xl mb-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1.5 text-sm">
                <CheckCircle className="w-4 h-4" />
                {streak >= 5 ? '🔥 On fire! Keep it up!' : streak >= 3 ? '⚡ You\'re on a roll!' : totalAnswered <= 3 ? '✈️ Great start!' : '✅ Correct!'}
                {streak >= 3 && <span className="ml-1 text-red-400 flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> {streak} streak</span>}
              </div>
              <p className="text-white/65 text-sm leading-relaxed">{question.explanation}</p>
            </div>
            <button
              onClick={nextQuestion}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463', boxShadow: '0 4px 20px rgba(255,182,39,0.35)' }}
            >
              Next Question <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Wrong feedback */}
        {phase === 'wrong' && (
          <div className="mt-5 animate-fade-in">
            <div className="p-4 rounded-2xl mb-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div className="flex items-center gap-2 text-red-400 font-bold mb-1.5 text-sm">
                <XCircle className="w-4 h-4" />
                Not quite — review the explanation
              </div>
              <p className="text-white/65 text-sm leading-relaxed">{question.explanation}</p>
              {question.reference && (
                <p className="text-white/30 text-xs mt-2">Ref: {question.reference}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowAI(true)}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #3E92CC, #2a7ab5)', color: 'white', boxShadow: '0 4px 20px rgba(62,146,204,0.35)' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Ask AI Tutor
              </button>
              <button
                onClick={nextQuestion}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463', boxShadow: '0 4px 20px rgba(255,182,39,0.35)' }}
              >
                Next Question
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* General AI Tutor — always available */}
      <GeneralChat
        currentQuestionContext={question
          ? `Category: ${question.category}\nQuestion: ${question.question_text}`
          : undefined
        }
      />

      {showAI && question && selectedAnswer && (
        <AIChat
          question={question}
          userAnswer={selectedAnswer}
          correctAnswer={question.correct_answer}
          onClose={() => setShowAI(false)}
          onContinue={() => { setShowAI(false); endSession() }}
        />
      )}
    </div>
  )
}
