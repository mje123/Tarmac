'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plane, Flame, Trophy, RotateCcw } from 'lucide-react'

const TOTAL = 20
const SECS = 12
const ALT_GAIN = 500
const ALT_LOSS = 200
const MAX_ALT = 10000

interface Q {
  id: string
  question_text: string
  option_a: string; option_b: string; option_c: string; option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  explanation: string
  category: string
  difficulty: string
}

type Phase = 'intro' | 'loading' | 'playing' | 'feedback' | 'summary'
const LETTERS = ['A', 'B', 'C', 'D'] as const

function speedMult(t: number) { return t >= 10 ? 3 : t >= 7 ? 2 : 1 }
function streakMult(s: number) { return s >= 8 ? 3 : s >= 5 ? 2 : s >= 3 ? 1.5 : 1 }
function speedLabel(t: number) { return t >= 10 ? '⚡ ×3 SPEED!' : t >= 7 ? '⚡ ×2 SPEED!' : '' }

export default function AltitudePage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [questions, setQuestions] = useState<Q[]>([])
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [altitude, setAltitude] = useState(0)
  const [timeLeft, setTimeLeft] = useState(SECS)
  const [chosen, setChosen] = useState<string | null>(null)
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const [lastPoints, setLastPoints] = useState(0)
  const [history, setHistory] = useState<boolean[]>([])
  const [pb, setPb] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem('tarmac_altitude_pb')
    if (stored) setPb(parseInt(stored, 10))
  }, [])

  // Countdown
  useEffect(() => {
    if (phase !== 'playing' || timeLeft <= 0) return
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, timeLeft])

  // Auto-submit on timeout
  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0 && chosen === null) {
      submitAnswer(null)
    }
  }, [phase, timeLeft]) // eslint-disable-line

  // Save PB
  useEffect(() => {
    if (phase === 'summary' && score > pb) {
      localStorage.setItem('tarmac_altitude_pb', score.toString())
      setPb(score)
    }
  }, [phase]) // eslint-disable-line

  async function startGame() {
    setPhase('loading')
    try {
      const res = await fetch('/api/altitude/questions')
      const data = await res.json()
      if (!data.questions?.length) throw new Error('empty')
      setQuestions(data.questions)
    } catch {
      setPhase('intro')
      return
    }
    setScore(0); setStreak(0); setBestStreak(0); setAltitude(0)
    setIdx(0); setHistory([]); setChosen(null)
    setLastCorrect(null); setLastPoints(0); setTimeLeft(SECS)
    setPhase('playing')
  }

  function submitAnswer(choice: string | null) {
    if (chosen !== null) return
    const q = questions[idx]
    if (!q) return

    const correct = choice !== null && choice === q.correct_answer
    const pts = correct ? Math.round(100 * speedMult(timeLeft) * streakMult(streak)) : 0

    setChosen(choice)
    setLastCorrect(correct)
    setLastPoints(pts)
    setScore(s => s + pts)
    if (correct) {
      setStreak(s => s + 1)
      setBestStreak(b => Math.max(b, streak + 1))
      setAltitude(a => Math.min(MAX_ALT, a + ALT_GAIN))
    } else {
      setStreak(0)
      setAltitude(a => Math.max(0, a - ALT_LOSS))
    }
    setHistory(h => [...h, correct])
    setPhase('feedback')

    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        setPhase('summary')
      } else {
        setIdx(i => i + 1)
        setChosen(null); setLastCorrect(null); setLastPoints(0)
        setTimeLeft(SECS); setPhase('playing')
      }
    }, 1000)
  }

  const q = questions[idx]
  const opts: Record<string, string> = q ? { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d } : {}
  const timerPct = (timeLeft / SECS) * 100
  const timerColor = timerPct > 55 ? '#22c55e' : timerPct > 25 ? '#FFB627' : '#ef4444'
  const altPct = (altitude / MAX_ALT) * 100
  const correctCount = history.filter(Boolean).length

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <div className="min-h-[82vh] flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="max-w-sm w-full text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-3xl"
            style={{ background: 'linear-gradient(135deg, rgba(62,146,204,0.2), rgba(62,146,204,0.04))', border: '1px solid rgba(62,146,204,0.3)' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Plane className="w-11 h-11 text-[#3E92CC]" />
          </div>
        </div>

        <h1 className="text-6xl font-black text-white mb-2" style={{ letterSpacing: '-0.05em' }}>ALTITUDE</h1>
        <p className="text-white/45 text-sm mb-1">Speed. Streaks. Study.</p>
        <p className="text-white/25 text-xs mb-7">20 questions · 12 seconds each · Answer faster to score higher</p>

        {pb > 0 && (
          <div className="mb-5 inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm"
            style={{ background: 'rgba(255,182,39,0.08)', border: '1px solid rgba(255,182,39,0.2)' }}>
            <Trophy className="w-4 h-4 text-[#FFB627]" />
            <span className="font-bold text-[#FFB627]">Personal best: {pb.toLocaleString()}</span>
          </div>
        )}

        <button onClick={startGame}
          className="w-full py-4 rounded-2xl text-base font-black mb-5 transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #3E92CC 0%, #1e6fa8 100%)', color: '#fff', boxShadow: '0 8px 32px rgba(62,146,204,0.35)' }}>
          Start Flight ✈
        </button>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { icon: '⚡', top: '×3 pts', sub: 'Answer in 2s' },
            { icon: '🔥', top: '×2 mult', sub: '5 streak' },
            { icon: '🏆', top: '10,000 ft', sub: 'Perfect flight' },
          ].map(item => (
            <div key={item.top} className="py-3 rounded-xl text-xs text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-white/70 font-bold">{item.top}</div>
              <div className="text-white/30">{item.sub}</div>
            </div>
          ))}
        </div>

        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-white/25 text-xs hover:text-white/50 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Dashboard
        </Link>
      </div>
    </div>
  )

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div className="min-h-[82vh] flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: '#3E92CC' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Plane className="w-8 h-8 text-[#3E92CC]" />
          </div>
        </div>
        <p className="text-white/40 text-sm">Preparing your flight plan…</p>
      </div>
    </div>
  )

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const accuracy = Math.round((correctCount / TOTAL) * 100)
    const isNewRecord = score > 0 && score >= pb
    const emoji = altitude >= MAX_ALT ? '🏆' : altitude >= 7500 ? '✈️' : altitude >= 5000 ? '🛫' : '🛬'

    return (
      <div className="min-h-[82vh] flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{emoji}</div>
            <p className="text-[#3E92CC] text-xs font-bold uppercase tracking-widest mb-1">Altitude Reached</p>
            <p className="text-5xl font-black text-white tabular-nums" style={{ letterSpacing: '-0.04em' }}>
              {altitude.toLocaleString()} <span className="text-2xl text-white/35 font-semibold">ft</span>
            </p>
            {altitude >= MAX_ALT && (
              <p className="text-[#FFB627] font-bold text-sm mt-1.5">PERFECT FLIGHT! 🎉</p>
            )}
          </div>

          <div className="glass-card p-5 text-center mb-4"
            style={isNewRecord ? { border: '1px solid rgba(255,182,39,0.4)' } : {}}>
            {isNewRecord && (
              <p className="text-[#FFB627] text-xs font-bold uppercase tracking-widest mb-2">🏆 New Personal Best</p>
            )}
            <p className="text-4xl font-black text-white tabular-nums">{score.toLocaleString()}</p>
            <p className="text-white/35 text-xs mt-1">points</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { v: `${accuracy}%`, label: 'Accuracy', color: accuracy >= 70 ? '#22c55e' : '#ef4444' },
              { v: String(bestStreak), label: 'Best Streak', color: '#FFB627' },
              { v: `${correctCount}/${TOTAL}`, label: 'Correct', color: '#fff' },
            ].map(({ v, label, color }) => (
              <div key={label} className="glass-card p-4 text-center">
                <p className="text-2xl font-black tabular-nums" style={{ color }}>{v}</p>
                <p className="text-white/30 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-1.5 mb-5 flex-wrap">
            {history.map((c, i) => (
              <div key={i} className="w-2 h-2 rounded-full" style={{ background: c ? '#22c55e' : '#ef4444' }} />
            ))}
          </div>

          <button onClick={startGame}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-extrabold transition-all hover:opacity-90 mb-3"
            style={{ background: 'linear-gradient(135deg, #3E92CC, #1e6fa8)', color: '#fff' }}>
            <RotateCcw className="w-4 h-4" /> Fly Again
          </button>
          <Link href="/dashboard" className="block text-center text-white/25 text-sm hover:text-white/50 transition-colors">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  // ── PLAYING + FEEDBACK ────────────────────────────────────────────────────
  if (!q) return null
  const isFeedback = phase === 'feedback'

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      {/* HUD row */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-white/40 text-xs font-mono shrink-0">Q{idx + 1}/{TOTAL}</span>
        {/* Timer */}
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full" style={{
            width: `${timerPct}%`, background: timerColor,
            transition: 'width 0.85s linear, background 0.3s',
          }} />
        </div>
        <span className="text-white/45 text-xs font-mono w-4 text-right shrink-0">{timeLeft}</span>
        <div className="flex items-center gap-2 ml-1 shrink-0">
          <span className="text-white font-black tabular-nums text-sm">{score.toLocaleString()}</span>
          {streak >= 3 && (
            <span className="flex items-center gap-0.5 text-xs font-black"
              style={{ color: streak >= 8 ? '#FFB627' : '#ef4444' }}>
              <Flame className="w-3.5 h-3.5" />{streak}
            </span>
          )}
        </div>
      </div>

      {/* Altitude bar */}
      <div className="flex items-center gap-3 mb-5">
        <Plane className="w-3.5 h-3.5 text-[#3E92CC] shrink-0" />
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full" style={{
            width: `${altPct}%`,
            background: 'linear-gradient(90deg, #3E92CC, #5ab8f5)',
            transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
          }} />
        </div>
        <span className="text-[#3E92CC] text-xs font-bold tabular-nums shrink-0 w-20 text-right">
          {altitude.toLocaleString()} ft
        </span>
      </div>

      {/* Question card */}
      <div className="rounded-2xl p-6 mb-4 relative transition-all duration-150" style={{
        background: isFeedback
          ? lastCorrect ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)'
          : 'rgba(255,255,255,0.04)',
        border: isFeedback
          ? lastCorrect ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.25)'
          : '1px solid rgba(255,255,255,0.09)',
      }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(62,146,204,0.7)' }}>
            {q.category}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: q.difficulty === 'hard' ? '#ef4444' : q.difficulty === 'medium' ? '#FFB627' : '#22c55e' }}>
            {q.difficulty}
          </span>
        </div>

        <p className="text-white text-[15px] font-semibold leading-relaxed">{q.question_text}</p>

        {isFeedback && lastPoints > 0 && (
          <div className="absolute top-5 right-5 text-green-400 font-extrabold text-sm animate-bounce">
            +{lastPoints}
          </div>
        )}

        {isFeedback && (
          <div className="mt-3 text-xs font-bold flex items-center gap-2">
            <span style={{ color: lastCorrect ? '#22c55e' : '#ef4444' }}>
              {lastCorrect ? '✓ Correct!' : chosen === null ? '⏱ Time\'s up!' : '✗ Wrong'}
            </span>
            {lastCorrect && speedMult(timeLeft) > 1 && (
              <span className="text-[#FFB627]">{speedLabel(timeLeft)}</span>
            )}
            {lastCorrect && streak > 1 && (
              <span className="text-[#ef4444]">🔥 {streak} streak</span>
            )}
          </div>
        )}
      </div>

      {/* Answer grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {LETTERS.map(letter => {
          const isChosen = chosen === letter
          const isRight = letter === q.correct_answer

          let style: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }
          if (isFeedback) {
            if (isRight) style = { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.4)' }
            else if (isChosen) style = { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)' }
            else style = { background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.35 }
          }

          const letterBadgeStyle: React.CSSProperties = isFeedback && isRight
            ? { background: 'rgba(34,197,94,0.25)', color: '#22c55e' }
            : isFeedback && isChosen && !isRight
            ? { background: 'rgba(239,68,68,0.25)', color: '#ef4444' }
            : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }

          const textColor = isFeedback
            ? isRight ? '#fff' : isChosen ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)'
            : 'rgba(255,255,255,0.8)'

          return (
            <button key={letter}
              onClick={() => phase === 'playing' && submitAnswer(letter)}
              disabled={phase !== 'playing'}
              className="p-4 rounded-xl text-left transition-all hover:brightness-125 active:scale-[0.98] disabled:cursor-default"
              style={style}>
              <div className="flex items-start gap-3">
                <span className="text-[11px] font-black shrink-0 w-5 h-5 rounded flex items-center justify-center"
                  style={letterBadgeStyle}>
                  {letter}
                </span>
                <span className="text-xs leading-relaxed" style={{ color: textColor }}>{opts[letter]}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {history.map((c, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full transition-all"
            style={{ background: c ? '#22c55e' : '#ef4444' }} />
        ))}
        {Array.from({ length: TOTAL - history.length }).map((_, i) => (
          <div key={`e${i}`} className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>
    </div>
  )
}
