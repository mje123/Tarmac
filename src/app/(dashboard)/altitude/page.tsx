'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plane, Flame, Trophy, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'

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

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(0)
  useEffect(() => {
    const start = ref.current
    const end = value
    const duration = 1200
    const startTime = performance.now()
    function tick(now: number) {
      const p = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      const cur = Math.round(start + (end - start) * ease)
      setDisplay(cur)
      ref.current = cur
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])
  return <span className={className}>{display.toLocaleString()}</span>
}

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
  const [flashCorrect, setFlashCorrect] = useState<boolean | null>(null)
  const [popupKey, setPopupKey] = useState(0)
  const [showSpeedBonus, setShowSpeedBonus] = useState('')

  // Smooth altitude spring
  const altSpring = useSpring(0, { stiffness: 60, damping: 20 })
  const altPct = useTransform(altSpring, [0, MAX_ALT], ['0%', '100%'])
  useEffect(() => { altSpring.set(altitude) }, [altitude, altSpring])

  useEffect(() => {
    const stored = localStorage.getItem('tarmac_altitude_pb')
    if (stored) setPb(parseInt(stored, 10))
  }, [])

  useEffect(() => {
    if (phase !== 'playing' || timeLeft <= 0) return
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, timeLeft])

  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0 && chosen === null) submitAnswer(null)
  }, [phase, timeLeft]) // eslint-disable-line

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
      setPhase('intro'); return
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
    const sm = speedMult(timeLeft)

    setChosen(choice)
    setLastCorrect(correct)
    setLastPoints(pts)
    setScore(s => s + pts)
    setFlashCorrect(correct)
    setTimeout(() => setFlashCorrect(null), 400)

    if (correct) {
      setStreak(s => s + 1)
      setBestStreak(b => Math.max(b, streak + 1))
      setAltitude(a => Math.min(MAX_ALT, a + ALT_GAIN))
      if (sm > 1) { setShowSpeedBonus(speedLabel(timeLeft)); setTimeout(() => setShowSpeedBonus(''), 1200) }
    } else {
      setStreak(0)
      setAltitude(a => Math.max(0, a - ALT_LOSS))
    }

    if (pts > 0) setPopupKey(k => k + 1)
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
  const correctCount = history.filter(Boolean).length
  const isFeedback = phase === 'feedback'
  const isUrgent = timeLeft <= 3 && phase === 'playing'

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-[82vh] flex flex-col items-center justify-center p-6"
    >
      <div className="max-w-sm w-full text-center">
        {/* Floating plane icon */}
        <motion.div
          className="relative w-24 h-24 mx-auto mb-6"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute inset-0 rounded-3xl"
            style={{ background: 'linear-gradient(135deg, rgba(62,146,204,0.2), rgba(62,146,204,0.04))', border: '1px solid rgba(62,146,204,0.3)' }} />
          <motion.div
            className="absolute inset-0 rounded-3xl"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ background: 'radial-gradient(circle, rgba(62,146,204,0.15) 0%, transparent 70%)' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Plane className="w-11 h-11 text-[#3E92CC]" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-6xl font-black text-white mb-2" style={{ letterSpacing: '-0.05em' }}
        >ALTITUDE</motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-white/45 text-sm mb-1"
        >Speed. Streaks. Study.</motion.p>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="text-white/25 text-xs mb-7"
        >20 questions · 12 seconds each · Answer faster to score higher</motion.p>

        {pb > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="mb-5 inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm"
            style={{ background: 'rgba(255,182,39,0.08)', border: '1px solid rgba(255,182,39,0.2)' }}
          >
            <Trophy className="w-4 h-4 text-[#FFB627]" />
            <span className="font-bold text-[#FFB627]">Personal best: {pb.toLocaleString()}</span>
          </motion.div>
        )}

        <motion.button
          onClick={startGame}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          whileHover={{ scale: 1.03, boxShadow: '0 12px 40px rgba(62,146,204,0.5)' }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-base font-black mb-5"
          style={{ background: 'linear-gradient(135deg, #3E92CC 0%, #1e6fa8 100%)', color: '#fff', boxShadow: '0 8px 32px rgba(62,146,204,0.35)' }}
        >
          Start Flight ✈
        </motion.button>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
          className="grid grid-cols-3 gap-2 mb-6"
        >
          {[
            { icon: '⚡', top: '×3 pts', sub: 'Answer in 2s' },
            { icon: '🔥', top: '×2 mult', sub: '5 streak' },
            { icon: '🏆', top: '10,000 ft', sub: 'Perfect flight' },
          ].map((item, i) => (
            <motion.div
              key={item.top}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + i * 0.07 }}
              className="py-3 rounded-xl text-xs text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-white/70 font-bold">{item.top}</div>
              <div className="text-white/30">{item.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-white/25 text-xs hover:text-white/50 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Dashboard
        </Link>
      </div>
    </motion.div>
  )

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div className="min-h-[82vh] flex items-center justify-center">
      <div className="text-center">
        <motion.div
          className="relative w-16 h-16 mx-auto mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '50%', originY: '50%' }}
        >
          <div className="absolute inset-0 rounded-full"
            style={{ border: '2px solid rgba(62,146,204,0.15)', borderTopColor: '#3E92CC' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Plane className="w-7 h-7 text-[#3E92CC]" style={{ transform: 'rotate(-30deg)' }} />
          </div>
        </motion.div>
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
          className="text-white/40 text-sm"
        >Preparing your flight plan…</motion.p>
      </div>
    </div>
  )

  // ── SUMMARY ────────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const accuracy = Math.round((correctCount / TOTAL) * 100)
    const isNewRecord = score > 0 && score >= pb
    const emoji = altitude >= MAX_ALT ? '🏆' : altitude >= 7500 ? '✈️' : altitude >= 5000 ? '🛫' : '🛬'

    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="min-h-[82vh] flex flex-col items-center justify-center p-6"
      >
        <div className="max-w-sm w-full">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-center mb-6"
          >
            <motion.div
              className="text-5xl mb-3"
              animate={altitude >= MAX_ALT ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1] } : {}}
              transition={{ delay: 0.5, duration: 0.6 }}
            >{emoji}</motion.div>
            <p className="text-[#3E92CC] text-xs font-bold uppercase tracking-widest mb-1">Altitude Reached</p>
            <p className="text-5xl font-black text-white tabular-nums" style={{ letterSpacing: '-0.04em' }}>
              <Counter value={altitude} /> <span className="text-2xl text-white/35 font-semibold">ft</span>
            </p>
            {altitude >= MAX_ALT && (
              <motion.p
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
                className="text-[#FFB627] font-bold text-sm mt-1.5"
              >PERFECT FLIGHT! 🎉</motion.p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card p-5 text-center mb-4"
            style={isNewRecord ? { border: '1px solid rgba(255,182,39,0.5)', boxShadow: '0 0 30px rgba(255,182,39,0.1)' } : {}}
          >
            {isNewRecord && (
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: 'spring' }}
                className="text-[#FFB627] text-xs font-bold uppercase tracking-widest mb-2"
              >🏆 New Personal Best</motion.p>
            )}
            <p className="text-4xl font-black text-white tabular-nums">
              <Counter value={score} />
            </p>
            <p className="text-white/35 text-xs mt-1">points</p>
          </motion.div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { v: `${accuracy}%`, label: 'Accuracy', color: accuracy >= 70 ? '#22c55e' : '#ef4444' },
              { v: String(bestStreak), label: 'Best Streak', color: '#FFB627' },
              { v: `${correctCount}/${TOTAL}`, label: 'Correct', color: '#fff' },
            ].map(({ v, label, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="glass-card p-4 text-center"
              >
                <p className="text-2xl font-black tabular-nums" style={{ color }}>{v}</p>
                <p className="text-white/30 text-xs mt-1">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* History dots */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="flex justify-center gap-1.5 mb-5 flex-wrap"
          >
            {history.map((c, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.8 + i * 0.03, type: 'spring', stiffness: 300 }}
                className="w-2 h-2 rounded-full"
                style={{ background: c ? '#22c55e' : '#ef4444' }}
              />
            ))}
          </motion.div>

          <motion.button
            onClick={startGame}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-extrabold mb-3"
            style={{ background: 'linear-gradient(135deg, #3E92CC, #1e6fa8)', color: '#fff' }}
          >
            <RotateCcw className="w-4 h-4" /> Fly Again
          </motion.button>
          <Link href="/dashboard" className="block text-center text-white/25 text-sm hover:text-white/50 transition-colors">
            Back to dashboard
          </Link>
        </div>
      </motion.div>
    )
  }

  // ── PLAYING + FEEDBACK ─────────────────────────────────────────────────────
  if (!q) return null

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 relative">

      {/* Screen flash overlay */}
      <AnimatePresence>
        {flashCorrect !== null && (
          <motion.div
            key="flash"
            initial={{ opacity: 0.35 }} animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 pointer-events-none z-50"
            style={{ background: flashCorrect ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)' }}
          />
        )}
      </AnimatePresence>

      {/* Speed bonus banner */}
      <AnimatePresence>
        {showSpeedBonus && (
          <motion.div
            key="speed"
            initial={{ opacity: 0, y: -30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-full text-sm font-black"
            style={{ background: 'linear-gradient(135deg, #FFB627, #f5a800)', color: '#0A1628', boxShadow: '0 4px 20px rgba(255,182,39,0.5)' }}
          >
            {showSpeedBonus}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD row */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-white/40 text-xs font-mono shrink-0">Q{idx + 1}/{TOTAL}</span>

        {/* Timer bar */}
        <motion.div
          className="flex-1 h-1.5 rounded-full overflow-hidden"
          animate={isUrgent ? { scale: [1, 1.01, 1] } : {}}
          transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: timerColor }}
            animate={{ width: `${timerPct}%` }}
            transition={{ duration: 0.85, ease: 'linear' }}
          />
        </motion.div>

        {/* Timer number — shakes when urgent */}
        <motion.span
          className="text-white/45 text-xs font-mono w-4 text-right shrink-0"
          animate={isUrgent ? { x: [-1, 1, -1, 1, 0] } : {}}
          transition={{ duration: 0.3, repeat: isUrgent ? Infinity : 0 }}
          style={{ color: isUrgent ? '#ef4444' : undefined }}
        >
          {timeLeft}
        </motion.span>

        <div className="flex items-center gap-2 ml-1 shrink-0">
          <span className="text-white font-black tabular-nums text-sm">{score.toLocaleString()}</span>
          <AnimatePresence>
            {streak >= 3 && (
              <motion.span
                key={streak}
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-0.5 text-xs font-black"
                style={{ color: streak >= 8 ? '#FFB627' : '#ef4444' }}
              >
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  <Flame className="w-3.5 h-3.5" />
                </motion.span>
                {streak}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Altitude bar with moving plane */}
      <div className="flex items-center gap-3 mb-5">
        <Plane className="w-3.5 h-3.5 text-[#3E92CC] shrink-0" />
        <div className="flex-1 relative h-2 rounded-full overflow-visible" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              width: altPct,
              background: 'linear-gradient(90deg, #1e6fa8, #3E92CC, #5ab8f5)',
            }}
          />
          {/* Plane marker on bar */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: altPct }}
          >
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Plane className="w-3 h-3 text-white drop-shadow" style={{ filter: 'drop-shadow(0 0 4px #3E92CC)' }} />
            </motion.div>
          </motion.div>
        </div>
        <span className="text-[#3E92CC] text-xs font-bold tabular-nums shrink-0 w-20 text-right">
          {altitude.toLocaleString()} ft
        </span>
      </div>

      {/* Question card — slides in per question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="rounded-2xl p-6 mb-4 relative"
          style={{
            background: isFeedback
              ? lastCorrect ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)'
              : 'rgba(255,255,255,0.04)',
            border: isFeedback
              ? lastCorrect ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.25)'
              : '1px solid rgba(255,255,255,0.09)',
            transition: 'background 0.2s, border 0.2s',
          }}
        >
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

          {/* Floating score popup */}
          <AnimatePresence>
            {isFeedback && lastPoints > 0 && (
              <motion.div
                key={popupKey}
                initial={{ opacity: 1, y: 0, scale: 0.8 }}
                animate={{ opacity: 0, y: -40, scale: 1.1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute top-4 right-5 font-extrabold text-sm pointer-events-none"
                style={{ color: '#22c55e', textShadow: '0 0 12px rgba(34,197,94,0.6)' }}
              >
                +{lastPoints}
              </motion.div>
            )}
          </AnimatePresence>

          {isFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-xs font-bold flex items-center gap-2 flex-wrap"
            >
              <span style={{ color: lastCorrect ? '#22c55e' : '#ef4444' }}>
                {lastCorrect ? '✓ Correct!' : chosen === null ? '⏱ Time\'s up!' : '✗ Wrong'}
              </span>
              {lastCorrect && streak > 1 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className="text-[#ef4444]"
                >🔥 {streak} streak</motion.span>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Answer grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {LETTERS.map((letter, li) => {
          const isChosen = chosen === letter
          const isRight = letter === q.correct_answer

          let bg = 'rgba(255,255,255,0.03)'
          let border = '1px solid rgba(255,255,255,0.09)'
          let opacity = 1
          if (isFeedback) {
            if (isRight) { bg = 'rgba(34,197,94,0.1)'; border = '1px solid rgba(34,197,94,0.4)' }
            else if (isChosen) { bg = 'rgba(239,68,68,0.1)'; border = '1px solid rgba(239,68,68,0.35)' }
            else { bg = 'rgba(255,255,255,0.015)'; border = '1px solid rgba(255,255,255,0.05)'; opacity = 0.35 }
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
            <motion.button
              key={letter}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isFeedback ? opacity : 1, y: 0 }}
              transition={{ delay: li * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
              whileHover={phase === 'playing' ? { scale: 1.02 } : {}}
              whileTap={phase === 'playing' ? { scale: 0.97 } : {}}
              onClick={() => phase === 'playing' && submitAnswer(letter)}
              disabled={phase !== 'playing'}
              className="p-4 rounded-xl text-left disabled:cursor-default"
              style={{ background: bg, border, transition: 'background 0.2s, border 0.2s, opacity 0.2s' }}
            >
              <div className="flex items-start gap-3">
                <span className="text-[11px] font-black shrink-0 w-5 h-5 rounded flex items-center justify-center"
                  style={letterBadgeStyle}>
                  {letter}
                </span>
                <span className="text-xs leading-relaxed" style={{ color: textColor }}>{opts[letter]}</span>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {history.map((c, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: c ? '#22c55e' : '#ef4444' }}
          />
        ))}
        {Array.from({ length: TOTAL - history.length }).map((_, i) => (
          <div key={`e${i}`} className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>
    </div>
  )
}
