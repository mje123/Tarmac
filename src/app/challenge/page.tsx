'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Plane, ChevronRight, RotateCcw } from 'lucide-react'

interface Question {
  id: string
  question_text: string
  options: Record<string, string>
  correct: string
  category: string
  explanation: string
}

const OPTION_COLORS = {
  correct: { bg: 'rgba(34,197,94,0.18)', border: 'rgba(34,197,94,0.6)', text: '#22c55e', glow: 'rgba(34,197,94,0.3)' },
  wrong:   { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.5)',  text: '#ef4444', glow: 'rgba(239,68,68,0.2)' },
  neutral: { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)', text: 'rgba(255,255,255,0.85)', glow: 'transparent' },
}

export default function ChallengePage() {
  const [question, setQuestion] = useState<Question | null>(null)
  const [wrongPct, setWrongPct] = useState(72)
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showExplanation, setShowExplanation] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setSelected(null)
    setRevealed(false)
    setShowExplanation(false)
    const res = await fetch('/api/challenge')
    const data = await res.json()
    setQuestion(data.question)
    setWrongPct(data.wrongPct)
    setLoading(false)
  }

  function pick(letter: string) {
    if (revealed) return
    setSelected(letter)
  }

  function reveal() {
    if (!selected) return
    setRevealed(true)
  }

  function getColors(letter: string) {
    if (!revealed) return selected === letter ? { bg: 'rgba(62,146,204,0.2)', border: 'rgba(62,146,204,0.6)', text: 'white', glow: 'rgba(62,146,204,0.25)' } : OPTION_COLORS.neutral
    if (letter === question?.correct) return OPTION_COLORS.correct
    if (letter === selected) return OPTION_COLORS.wrong
    return { ...OPTION_COLORS.neutral, text: 'rgba(255,255,255,0.3)' }
  }

  const isCorrect = revealed && selected === question?.correct

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between px-4 py-6 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #04090f 0%, #070e1c 50%, #0a1428 100%)' }}
    >
      {/* Top bar */}
      <div className="w-full max-w-sm flex items-center justify-between mb-2">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-white.png" alt="TARMAC" width={28} height={28} />
          <span className="text-white font-black text-base tracking-tight">TARMAC</span>
        </Link>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,182,39,0.12)', border: '1px solid rgba(255,182,39,0.25)' }}>
          <span className="text-[10px] font-black text-[#FFB627] uppercase tracking-widest">Daily Challenge</span>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
            <Plane className="w-8 h-8 text-[#3E92CC]" />
          </motion.div>
        </div>
      ) : question ? (
        <div className="w-full max-w-sm flex flex-col gap-4 flex-1 justify-center">

          {/* Hook stat */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {question.category}
            </p>
            <p className="text-sm font-bold" style={{ color: '#FFB627' }}>
              {wrongPct}% of student pilots get this wrong
            </p>
          </motion.div>

          {/* Question card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-5"
            style={{
              background: 'linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            }}
          >
            <p className="text-white font-bold text-base leading-snug">{question.question_text}</p>
          </motion.div>

          {/* Answer options */}
          <div className="flex flex-col gap-2.5">
            {(['A', 'B', 'C', 'D'] as const).map((letter, i) => {
              const colors = getColors(letter)
              return (
                <motion.button
                  key={letter}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  onClick={() => pick(letter)}
                  disabled={revealed}
                  className="w-full text-left rounded-xl px-4 py-3.5 flex items-start gap-3 transition-all"
                  style={{
                    background: colors.bg,
                    border: `1.5px solid ${colors.border}`,
                    boxShadow: revealed && (letter === question.correct || letter === selected) ? `0 0 20px ${colors.glow}` : 'none',
                    cursor: revealed ? 'default' : 'pointer',
                  }}
                  whileTap={!revealed ? { scale: 0.98 } : {}}
                >
                  <span
                    className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black mt-0.5"
                    style={{ background: `${colors.border}33`, color: colors.text }}
                  >
                    {letter}
                  </span>
                  <span className="text-sm leading-snug font-medium" style={{ color: colors.text }}>
                    {question.options[letter]}
                  </span>
                </motion.button>
              )
            })}
          </div>

          {/* Reveal / result */}
          <AnimatePresence mode="wait">
            {!revealed ? (
              <motion.button
                key="reveal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={reveal}
                disabled={!selected}
                className="w-full py-4 rounded-2xl font-black text-base tracking-tight transition-all disabled:opacity-30"
                style={{ background: selected ? '#3E92CC' : 'rgba(255,255,255,0.07)', color: 'white', boxShadow: selected ? '0 4px 24px rgba(62,146,204,0.35)' : 'none' }}
                whileTap={selected ? { scale: 0.97 } : {}}
              >
                {selected ? 'Reveal Answer' : 'Pick an answer first'}
              </motion.button>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="rounded-2xl p-5 flex flex-col gap-3"
                style={{
                  background: isCorrect ? 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.06) 100%)' : 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.06) 100%)',
                  border: `1.5px solid ${isCorrect ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.4)'}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1, stiffness: 400, damping: 18 }}
                    className="text-2xl"
                  >
                    {isCorrect ? '✈️' : '❌'}
                  </motion.span>
                  <span className="text-base font-black" style={{ color: isCorrect ? '#22c55e' : '#ef4444' }}>
                    {isCorrect ? 'Correct! Nice work.' : `Wrong — it's ${question.correct}`}
                  </span>
                </div>

                <button
                  onClick={() => setShowExplanation(v => !v)}
                  className="text-left text-xs font-semibold underline"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  {showExplanation ? 'Hide explanation' : 'Show explanation'}
                </button>

                <AnimatePresence>
                  {showExplanation && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs leading-relaxed overflow-hidden"
                      style={{ color: 'rgba(255,255,255,0.65)' }}
                    >
                      {question.explanation}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next question after reveal */}
          {revealed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={load}
              className="flex items-center justify-center gap-2 text-sm font-semibold text-white/40 hover:text-white/70 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try another
            </motion.button>
          )}
        </div>
      ) : null}

      {/* Bottom CTA — the hook for the promo code */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm mt-4"
      >
        <div
          className="rounded-2xl px-5 py-4 flex items-center justify-between gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(255,182,39,0.1) 0%, rgba(62,146,204,0.1) 100%)',
            border: '1px solid rgba(255,182,39,0.2)',
          }}
        >
          <div>
            <p className="text-white font-bold text-sm">Study all 1,400+ FAA questions</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Code <span className="font-black text-[#FFB627]">HALF</span> → 50% off your first month
            </p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black transition-all hover:opacity-90"
            style={{ background: '#FFB627', color: '#0a1530' }}
          >
            Start
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <p className="text-center text-[10px] mt-2.5 font-medium tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.18)' }}>
          tarmac.study
        </p>
      </motion.div>
    </div>
  )
}
