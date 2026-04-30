'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Question, QuestionCategory } from '@/types'
import {
  Layers, BookOpen, Compass, Cloud, Wind, Gauge, Scale,
  Plane, Radio, Map, Zap, Trophy, RotateCcw, CheckCircle,
  XCircle, ArrowLeft, ArrowRight, Loader2, ChevronRight,
} from 'lucide-react'

// ── Categories ────────────────────────────────────────────────────────────────
const CATEGORIES: { value: string; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'all',                  label: 'Mixed Topics',       icon: Zap,     color: '#FFB627' },
  { value: 'Regulations',          label: 'Regulations',        icon: BookOpen, color: '#3E92CC' },
  { value: 'Airspace',             label: 'Airspace',           icon: Compass,  color: '#8B5CF6' },
  { value: 'Weather Theory',       label: 'Weather Theory',     icon: Cloud,    color: '#06B6D4' },
  { value: 'Weather Services',     label: 'Weather Services',   icon: Wind,     color: '#10B981' },
  { value: 'Aircraft Performance', label: 'Aircraft Perf.',     icon: Gauge,    color: '#F59E0B' },
  { value: 'Weight & Balance',     label: 'Weight & Balance',   icon: Scale,    color: '#EF4444' },
  { value: 'Aerodynamics',         label: 'Aerodynamics',       icon: Plane,    color: '#EC4899' },
  { value: 'Flight Instruments',   label: 'Flight Instruments', icon: Radio,    color: '#6366F1' },
  { value: 'Navigation',           label: 'Navigation',         icon: Map,      color: '#14B8A6' },
]

type Phase = 'setup' | 'study' | 'complete'

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAnswerText(q: Question): string {
  const map: Record<string, string | undefined> = {
    A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d ?? undefined,
  }
  return map[q.correct_answer] ?? ''
}

function getCatInfo(category: string) {
  return CATEGORIES.find(c => c.value === category) ?? CATEGORIES[1]
}

// ── Setup Screen ──────────────────────────────────────────────────────────────
function SetupScreen({ onStart, loading }: { onStart: (cat: string) => void; loading: boolean }) {
  const [selected, setSelected] = useState('all')

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,182,39,0.15)', border: '1px solid rgba(255,182,39,0.2)' }}>
          <Layers className="w-5 h-5 text-[#FFB627]" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Flashcards</h1>
          <p className="text-white/45 text-sm mt-0.5">Flip, swipe, and lock in key concepts for the FAA written</p>
        </div>
      </div>

      <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Choose a Deck</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-8">
        {CATEGORIES.map(({ value, label, icon: Icon, color }) => {
          const active = selected === value
          return (
            <button
              key={value}
              onClick={() => setSelected(value)}
              className="p-4 rounded-xl text-left transition-all"
              style={{
                background: active ? `linear-gradient(135deg, ${color}22, ${color}0d)` : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${active ? `${color}55` : 'rgba(255,255,255,0.07)'}`,
                transform: active ? 'scale(1.01)' : 'scale(1)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${color}20` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className="text-white text-sm font-semibold">{label}</span>
                {active && (
                  <div className="ml-auto w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: color }}>
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-4 mb-6 px-1">
        {[
          { icon: Layers, text: 'Up to 40 cards' },
          { icon: CheckCircle, text: 'Track what you know' },
          { icon: RotateCcw, text: 'Retry missed cards' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-1.5 text-white/35 text-xs">
            <Icon className="w-3.5 h-3.5" />
            {text}
          </div>
        ))}
      </div>

      <button
        onClick={() => onStart(selected)}
        disabled={loading}
        className="btn-gold w-full justify-center py-4 text-base font-bold gap-3"
        style={{ borderRadius: '16px' }}
      >
        {loading
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Loading deck…</>
          : <><Layers className="w-5 h-5" /> Start Flashcards</>
        }
      </button>

      <p className="text-center text-white/25 text-xs mt-4">
        Space / Enter to flip · ← Study More · → Know It
      </p>
    </div>
  )
}

// ── Complete Screen ───────────────────────────────────────────────────────────
function CompleteScreen({
  knowIt, studyMore, studyMoreCards, category, onRetryMissed, onNewDeck,
}: {
  knowIt: number; studyMore: number; studyMoreCards: Question[]
  category: string; onRetryMissed: () => void; onNewDeck: () => void
}) {
  const total = knowIt + studyMore
  const pct = total > 0 ? Math.round((knowIt / total) * 100) : 0
  const catInfo = getCatInfo(category)
  const passed = pct >= 70

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-lg mx-auto flex flex-col items-center justify-center animate-fade-in">
      <div className="w-full rounded-2xl p-8 text-center mb-6"
        style={{
          background: passed
            ? 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)'
            : 'linear-gradient(135deg, rgba(255,182,39,0.1) 0%, rgba(255,182,39,0.03) 100%)',
          border: `1px solid ${passed ? 'rgba(16,185,129,0.3)' : 'rgba(255,182,39,0.3)'}`,
        }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: passed ? 'rgba(16,185,129,0.15)' : 'rgba(255,182,39,0.15)', border: `2px solid ${passed ? 'rgba(16,185,129,0.4)' : 'rgba(255,182,39,0.4)'}` }}>
          <Trophy className="w-8 h-8" style={{ color: passed ? '#10B981' : '#FFB627' }} />
        </div>
        <div className="text-white/40 text-xs uppercase tracking-widest mb-2">
          {catInfo.label} · {total} Cards
        </div>
        <div className="text-7xl font-extrabold text-white leading-none tracking-tight mb-2">
          {pct}<span className="text-3xl text-white/30 font-semibold">%</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm font-semibold"
          style={{ color: passed ? '#10B981' : '#FFB627' }}>
          {passed ? <CheckCircle className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
          {passed ? 'Solid session — keep it up' : 'More reps needed — you\'ve got this'}
        </div>
      </div>

      <div className="w-full glass-card p-5 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400 tabular-nums">{knowIt}</div>
            <div className="text-white/40 text-xs mt-0.5 uppercase tracking-wide">Know It</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#FFB627] tabular-nums">{studyMore}</div>
            <div className="text-white/40 text-xs mt-0.5 uppercase tracking-wide">Study More</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tabular-nums">{total}</div>
            <div className="text-white/40 text-xs mt-0.5 uppercase tracking-wide">Total</div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3">
        {studyMoreCards.length > 0 && (
          <button
            onClick={onRetryMissed}
            className="btn-gold w-full justify-center py-3.5 gap-2"
            style={{ borderRadius: '12px' }}
          >
            <RotateCcw className="w-4 h-4" />
            Retry {studyMoreCards.length} "Study More" Cards
          </button>
        )}
        <button
          onClick={onNewDeck}
          className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
        >
          <Layers className="w-4 h-4" />
          Choose New Deck
        </button>
      </div>
    </div>
  )
}

// ── Flashcard ─────────────────────────────────────────────────────────────────
function Flashcard({
  card, isFlipped, dragX, isDragging, onFlip,
  onMouseDown, onMouseMove, onMouseUp, onMouseLeave,
  onTouchStart, onTouchMove, onTouchEnd,
}: {
  card: Question
  isFlipped: boolean
  dragX: number
  isDragging: boolean
  onFlip: () => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: () => void
  onMouseLeave: () => void
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: () => void
}) {
  const catInfo = getCatInfo(card.category)
  const answerText = getAnswerText(card)
  const swipeHint = Math.abs(dragX) > 40
    ? dragX > 0 ? 'rgba(16,185,129,0.5)' : 'rgba(255,182,39,0.5)'
    : 'rgba(255,255,255,0.07)'

  return (
    <div
      style={{
        transform: `translateX(${dragX}px) rotate(${dragX * 0.04}deg)`,
        transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        position: 'relative',
        zIndex: 2,
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* The 3D flip wrapper */}
      <div
        onClick={onFlip}
        style={{
          width: 'min(600px, 90vw)',
          height: 'min(390px, calc(90vw * 0.65))',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.025) 100%)',
            border: `1.5px solid ${swipeHint}`,
            borderRadius: '20px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)',
            display: 'flex', flexDirection: 'column',
            padding: '28px 36px',
            transition: 'border-color 0.2s ease',
          }}
        >
          {/* Corner fold */}
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 28, height: 28,
            background: `linear-gradient(135deg, transparent 50%, ${catInfo.color}25 50%)`,
            borderRadius: '0 20px 0 0',
          }} />

          {/* Category badge */}
          <div className="flex items-center gap-2 mb-auto">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ background: `${catInfo.color}18`, border: `1px solid ${catInfo.color}35`, color: catInfo.color }}>
              <catInfo.icon className="w-3 h-3" />
              {catInfo.label}
            </div>
          </div>

          {/* Question */}
          <div className="flex-1 flex items-center justify-center py-4">
            <p className="text-white font-semibold leading-relaxed text-center"
              style={{ fontSize: 'clamp(16px, 3.5vw, 24px)', maxWidth: '480px' }}>
              {card.question_text}
            </p>
          </div>

          {/* Flip hint */}
          <div className="flex items-center justify-center gap-2 mt-auto">
            <span className="text-white/30 text-xs">Click to flip</span>
            <span className="text-white/20" style={{ fontSize: '16px' }}>↻</span>
          </div>
        </div>

        {/* Back */}
        <div
          style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.03) 100%)',
            border: `1.5px solid rgba(255,255,255,0.09)`,
            borderRadius: '20px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column',
            padding: '24px 32px',
            overflow: 'hidden',
          }}
        >
          {/* Corner fold */}
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 28, height: 28,
            background: 'linear-gradient(135deg, transparent 50%, rgba(16,185,129,0.2) 50%)',
            borderRadius: '0 20px 0 0',
          }} />

          {/* Answer */}
          <div className="flex-1 flex flex-col justify-center gap-3 overflow-auto">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              <span className="text-green-400 font-bold text-xs uppercase tracking-wider">Correct Answer</span>
            </div>
            <p className="text-white font-bold leading-snug"
              style={{ fontSize: 'clamp(15px, 3vw, 20px)' }}>
              {card.correct_answer}. {answerText}
            </p>
            {card.explanation && (
              <p className="text-white/60 leading-relaxed"
                style={{ fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
                {card.explanation}
              </p>
            )}
          </div>

          {/* Flip hint */}
          <div className="flex items-center justify-center gap-2 mt-3 shrink-0">
            <span className="text-white/25 text-xs">Click to flip back</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FlashcardsPage() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [category, setCategory] = useState('all')
  const [cards, setCards] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [knowIt, setKnowIt] = useState(0)
  const [studyMore, setStudyMore] = useState(0)
  const [studyMoreCards, setStudyMoreCards] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [exiting, setExiting] = useState(false)

  // Drag state
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const didDrag = useRef(false)

  const currentCard = cards[currentIndex] ?? null

  async function loadDeck(cat: string) {
    setLoading(true)
    setCategory(cat)
    const params = new URLSearchParams()
    if (cat !== 'all') params.set('category', cat)
    const res = await fetch(`/api/flashcards?${params}`)
    const data = await res.json()
    setCards(data.cards || [])
    setCurrentIndex(0)
    setIsFlipped(false)
    setKnowIt(0)
    setStudyMore(0)
    setStudyMoreCards([])
    setPhase('study')
    setLoading(false)
  }

  const advance = useCallback((dir: 'left' | 'right') => {
    if (exiting || !cards[currentIndex]) return
    setExiting(true)

    const isKnow = dir === 'right'
    const exitX = isKnow ? 700 : -700

    setDragX(exitX)
    setIsDragging(false)

    setTimeout(() => {
      if (isKnow) {
        setKnowIt(k => k + 1)
      } else {
        setStudyMore(s => s + 1)
        setStudyMoreCards(prev => [...prev, cards[currentIndex]])
      }
      setDragX(0)
      setIsFlipped(false)
      setExiting(false)
      if (currentIndex + 1 >= cards.length) {
        setPhase('complete')
      } else {
        setCurrentIndex(i => i + 1)
      }
    }, 380)
  }, [exiting, cards, currentIndex])

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== 'study') return
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!exiting) setIsFlipped(f => !f) }
      if (e.key === 'ArrowRight') { e.preventDefault(); advance('right') }
      if (e.key === 'ArrowLeft') { e.preventDefault(); advance('left') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, advance, exiting])

  // Mouse drag handlers
  function onMouseDown(e: React.MouseEvent) {
    if (exiting) return
    dragStartX.current = e.clientX
    didDrag.current = false
    setIsDragging(true)
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging) return
    const delta = e.clientX - dragStartX.current
    if (Math.abs(delta) > 5) didDrag.current = true
    setDragX(delta)
  }
  function onMouseUp() {
    if (!isDragging) return
    setIsDragging(false)
    if (Math.abs(dragX) > 100) {
      advance(dragX > 0 ? 'right' : 'left')
    } else {
      setDragX(0)
    }
  }
  function onMouseLeave() {
    if (isDragging) {
      setIsDragging(false)
      setDragX(0)
    }
  }

  // Touch handlers
  function onTouchStart(e: React.TouchEvent) {
    if (exiting) return
    dragStartX.current = e.touches[0].clientX
    didDrag.current = false
    setIsDragging(true)
  }
  function onTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientX - dragStartX.current
    if (Math.abs(delta) > 8) didDrag.current = true
    setDragX(delta)
  }
  function onTouchEnd() {
    setIsDragging(false)
    if (Math.abs(dragX) > 80) {
      advance(dragX > 0 ? 'right' : 'left')
    } else {
      setDragX(0)
      if (!didDrag.current) setIsFlipped(f => !f)
    }
  }

  function handleFlip() {
    if (didDrag.current || exiting) return
    setIsFlipped(f => !f)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (phase === 'setup') return <SetupScreen onStart={loadDeck} loading={loading} />

  if (phase === 'complete') {
    return (
      <CompleteScreen
        knowIt={knowIt}
        studyMore={studyMore}
        studyMoreCards={studyMoreCards}
        category={category}
        onRetryMissed={() => {
          const missed = [...studyMoreCards]
          setCards(missed)
          setCurrentIndex(0)
          setIsFlipped(false)
          setKnowIt(0)
          setStudyMore(0)
          setStudyMoreCards([])
          setExiting(false)
          setDragX(0)
          setPhase('study')
        }}
        onNewDeck={() => setPhase('setup')}
      />
    )
  }

  if (!currentCard) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 text-[#FFB627] animate-spin" />
    </div>
  )

  const catInfo = getCatInfo(category)
  const progress = currentIndex / cards.length
  const knowPct = (knowIt + studyMore) > 0 ? Math.round((knowIt / (knowIt + studyMore)) * 100) : 0

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 max-w-3xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPhase('setup')}
            className="text-white/40 hover:text-white/70 transition-colors text-sm flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Decks
          </button>
          <div className="w-px h-4 bg-white/15" />
          <div className="flex items-center gap-1.5">
            <catInfo.icon className="w-4 h-4" style={{ color: catInfo.color }} />
            <span className="text-white text-sm font-semibold">{catInfo.label}</span>
          </div>
        </div>
        <span className="text-white/40 text-sm tabular-nums">{currentIndex + 1} / {cards.length}</span>
      </div>

      {/* Progress bar */}
      <div className="progress-bar mb-6 shrink-0">
        <div className="progress-fill" style={{
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg, #10B981, #34D399)',
          boxShadow: '0 0 8px rgba(16,185,129,0.4)',
        }} />
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Stack layers behind card */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Layer 2 (deepest) */}
          <div style={{
            position: 'absolute',
            width: 'min(580px, 86vw)', height: 'min(370px, calc(86vw * 0.64))',
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: '20px',
            transform: 'translateY(16px) scale(0.94)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }} />
          {/* Layer 1 */}
          <div style={{
            position: 'absolute',
            width: 'min(590px, 88vw)', height: 'min(380px, calc(88vw * 0.645))',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px',
            transform: 'translateY(8px) scale(0.97)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
            pointerEvents: 'none',
          }} />

          {/* Active card */}
          <Flashcard
            card={currentCard}
            isFlipped={isFlipped}
            dragX={dragX}
            isDragging={isDragging}
            onFlip={handleFlip}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />
        </div>

        {/* Swipe indicator labels */}
        <div className="flex items-center justify-between mt-5 w-full max-w-sm px-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: dragX < -40 ? '#FFB627' : 'rgba(255,255,255,0.2)', transition: 'color 0.15s' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Study More
          </div>
          <div className="text-white/20 text-xs">swipe or use buttons</div>
          <div className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: dragX > 40 ? '#10B981' : 'rgba(255,255,255,0.2)', transition: 'color 0.15s' }}>
            Know It <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-6 shrink-0">
        <button
          onClick={() => advance('left')}
          disabled={exiting}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
          style={{
            background: 'rgba(255,182,39,0.1)',
            border: '1.5px solid rgba(255,182,39,0.3)',
            color: '#FFB627',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(-3px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(0)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Study More
        </button>

        <button
          onClick={handleFlip}
          disabled={exiting}
          className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
          style={{
            background: 'rgba(62,146,204,0.1)',
            border: '1.5px solid rgba(62,146,204,0.3)',
            color: '#3E92CC',
            minWidth: '90px',
          }}
        >
          <span style={{ fontSize: '16px', lineHeight: 1 }}>↻</span>
          Flip
        </button>

        <button
          onClick={() => advance('right')}
          disabled={exiting}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
          style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1.5px solid rgba(16,185,129,0.3)',
            color: '#10B981',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(3px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(0)' }}
        >
          Know It
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Session stats footer */}
      <div className="flex items-center justify-center gap-8 mt-5 py-3.5 rounded-xl shrink-0"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="text-center">
          <div className="text-lg font-bold text-green-400 tabular-nums">{knowIt}</div>
          <div className="text-white/35 text-xs uppercase tracking-wide">Know It</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <div className="text-lg font-bold text-[#FFB627] tabular-nums">{studyMore}</div>
          <div className="text-white/35 text-xs uppercase tracking-wide">Study More</div>
        </div>
        {(knowIt + studyMore) > 0 && (
          <>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-lg font-bold text-white tabular-nums">{knowPct}%</div>
              <div className="text-white/35 text-xs uppercase tracking-wide">Accuracy</div>
            </div>
          </>
        )}
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-white/20 text-xs mt-3 shrink-0">
        Space to flip · ← Study More · → Know It
      </p>
    </div>
  )
}
