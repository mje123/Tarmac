'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Question } from '@/types'
import {
  Layers, BookOpen, Compass, Cloud, Wind, Gauge, Scale,
  Plane, Radio, Map, Zap, Trophy, RotateCcw, CheckCircle,
  ArrowLeft, ArrowRight, Loader2, Navigation2, AlertTriangle,
  MonitorCheck, Wifi, PlaneTakeoff, PlaneLanding, Siren,
} from 'lucide-react'
import { useExamType } from '@/components/ExamTypeProvider'

// ── Categories ────────────────────────────────────────────────────────────────
const PPL_CATEGORIES: { value: string; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'all',                  label: 'Mixed Topics',       icon: Zap,      color: '#FFB627' },
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

const IFR_CATEGORIES: { value: string; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'all',                       label: 'Mixed Topics',         icon: Zap,           color: '#FFB627' },
  { value: 'IFR Regulations',           label: 'IFR Regulations',      icon: BookOpen,      color: '#3E92CC' },
  { value: 'Instrument Navigation',     label: 'Inst. Navigation',     icon: Navigation2,   color: '#8B5CF6' },
  { value: 'Instrument Approaches',     label: 'Approaches',           icon: PlaneLanding,  color: '#06B6D4' },
  { value: 'IFR Weather',               label: 'IFR Weather',          icon: Cloud,         color: '#10B981' },
  { value: 'IFR En Route',              label: 'En Route',             icon: Map,           color: '#F59E0B' },
  { value: 'ATC & Communications',      label: 'ATC & Comms',          icon: Wifi,          color: '#EF4444' },
  { value: 'Instrument Systems',        label: 'Inst. Systems',        icon: MonitorCheck,  color: '#EC4899' },
  { value: 'Departure & Arrivals',      label: 'Dep. & Arrivals',      icon: PlaneTakeoff,  color: '#6366F1' },
  { value: 'IFR Emergency Operations',  label: 'IFR Emergencies',      icon: AlertTriangle, color: '#EF4444' },
]

type Phase = 'setup' | 'study' | 'complete'

function getAnswerText(q: Question): string {
  const map: Record<string, string | undefined> = {
    A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d ?? undefined,
  }
  return map[q.correct_answer] ?? ''
}

function getCatInfo(category: string, categories: typeof PPL_CATEGORIES) {
  return categories.find(c => c.value === category) ?? categories[1]
}

// ── Setup Screen ──────────────────────────────────────────────────────────────
function SetupScreen({ onStart, loading, categories }: { onStart: (cat: string) => void; loading: boolean; categories: typeof PPL_CATEGORIES }) {
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
        {categories.map(({ value, label, icon: Icon, color }) => {
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
          { icon: CheckCircle, text: 'Study More cards recycle' },
          { icon: RotateCcw, text: 'Until you know them all' },
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
  totalCards, studyMoreSwipes, category, onNewDeck, categories,
}: {
  totalCards: number; studyMoreSwipes: number
  category: string; onNewDeck: () => void
  categories: typeof PPL_CATEGORIES
}) {
  const catInfo = getCatInfo(category, categories)
  const perfect = studyMoreSwipes === 0

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-lg mx-auto flex flex-col items-center justify-center animate-fade-in">
      <div className="w-full rounded-2xl p-8 text-center mb-6"
        style={{
          background: perfect
            ? 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)'
            : 'linear-gradient(135deg, rgba(255,182,39,0.1) 0%, rgba(255,182,39,0.03) 100%)',
          border: `1px solid ${perfect ? 'rgba(16,185,129,0.3)' : 'rgba(255,182,39,0.3)'}`,
        }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            background: perfect ? 'rgba(16,185,129,0.15)' : 'rgba(255,182,39,0.15)',
            border: `2px solid ${perfect ? 'rgba(16,185,129,0.4)' : 'rgba(255,182,39,0.4)'}`,
          }}>
          <Trophy className="w-8 h-8" style={{ color: perfect ? '#10B981' : '#FFB627' }} />
        </div>
        <div className="text-white/40 text-xs uppercase tracking-widest mb-2">
          {catInfo.label} · {totalCards} Cards
        </div>
        <div className="text-4xl font-extrabold text-white leading-none tracking-tight mb-3">
          All cleared!
        </div>
        <div className="flex items-center justify-center gap-2 text-sm font-semibold"
          style={{ color: perfect ? '#10B981' : '#FFB627' }}>
          {perfect ? <CheckCircle className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
          {perfect ? 'First-pass perfect — nice work' : `${studyMoreSwipes} card${studyMoreSwipes !== 1 ? 's' : ''} needed extra reps`}
        </div>
      </div>

      <div className="w-full glass-card p-5 mb-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400 tabular-nums">{totalCards}</div>
            <div className="text-white/40 text-xs mt-0.5 uppercase tracking-wide">Cleared</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#FFB627] tabular-nums">{studyMoreSwipes}</div>
            <div className="text-white/40 text-xs mt-0.5 uppercase tracking-wide">Extra Reps</div>
          </div>
        </div>
      </div>

      <button
        onClick={onNewDeck}
        className="btn-gold w-full justify-center py-3.5 gap-2"
        style={{ borderRadius: '12px' }}
      >
        <Layers className="w-4 h-4" />
        Choose New Deck
      </button>
    </div>
  )
}

// ── Flashcard ─────────────────────────────────────────────────────────────────
function Flashcard({
  card, isFlipped, dragX, isDragging, exiting, onFlip,
  onMouseDown, onMouseMove, onMouseUp, onMouseLeave,
  onTouchStart, onTouchMove, onTouchEnd, categories,
}: {
  card: Question
  isFlipped: boolean
  dragX: number
  isDragging: boolean
  exiting: boolean
  onFlip: () => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: () => void
  onMouseLeave: () => void
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: () => void
  categories: typeof PPL_CATEGORIES
}) {
  const catInfo = getCatInfo(card.category, categories)
  const answerText = getAnswerText(card)
  const swipeHint = Math.abs(dragX) > 40
    ? dragX > 0 ? 'rgba(16,185,129,0.5)' : 'rgba(255,182,39,0.5)'
    : 'rgba(255,255,255,0.07)'

  return (
    <div
      style={{
        transform: `translateX(${dragX}px) rotate(${dragX * 0.03}deg)`,
        transition: isDragging ? 'none' : exiting ? 'transform 0.28s ease-in' : 'transform 0.35s ease-out',
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
      <div
        onClick={onFlip}
        style={{
          width: 'min(600px, 90vw)',
          height: 'min(390px, calc(90vw * 0.65))',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'linear-gradient(160deg, #0f1e3a 0%, #0a1628 100%)',
            border: `1.5px solid ${swipeHint}`,
            borderRadius: '20px',
            boxShadow: '0 28px 72px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08)',
            display: 'flex', flexDirection: 'column',
            padding: '28px 36px',
            transition: 'border-color 0.15s ease',
          }}
        >
          <div className="flex items-center gap-2 mb-auto">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ background: `${catInfo.color}18`, border: `1px solid ${catInfo.color}35`, color: catInfo.color }}>
              <catInfo.icon className="w-3 h-3" />
              {catInfo.label}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center py-4">
            <p className="text-white font-semibold leading-relaxed text-center"
              style={{ fontSize: 'clamp(16px, 3.5vw, 24px)', maxWidth: '480px' }}>
              {card.question_text}
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-auto">
            <span className="text-white/25 text-xs">Tap to flip</span>
            <span className="text-white/18" style={{ fontSize: '14px' }}>↻</span>
          </div>
        </div>

        {/* Back */}
        <div
          style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(160deg, #0d1e38 0%, #091525 100%)',
            border: '1.5px solid rgba(16,185,129,0.25)',
            borderRadius: '20px',
            boxShadow: '0 28px 72px rgba(0,0,0,0.65), inset 0 1px 0 rgba(16,185,129,0.08)',
            display: 'flex', flexDirection: 'column',
            padding: '24px 32px',
            overflow: 'hidden',
          }}
        >
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

          <div className="flex items-center justify-center gap-1.5 mt-3 shrink-0">
            <span className="text-white/20 text-xs">Tap to flip back</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FlashcardsPage() {
  const { examType } = useExamType()
  const CATEGORIES = examType === 'ifr' ? IFR_CATEGORIES : PPL_CATEGORIES

  const [phase, setPhase] = useState<Phase>('setup')
  const [category, setCategory] = useState('all')
  const [queue, setQueue] = useState<Question[]>([])
  const [totalCards, setTotalCards] = useState(0)
  const [knowItCount, setKnowItCount] = useState(0)
  const [studyMoreSwipes, setStudyMoreSwipes] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exiting, setExiting] = useState(false)

  // Undo: store the previous queue snapshot and what action was taken
  const [lastAction, setLastAction] = useState<{ queue: Question[]; wasKnow: boolean } | null>(null)

  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const didDrag = useRef(false)

  const currentCard = queue[0] ?? null

  async function loadDeck(cat: string) {
    setLoading(true)
    setCategory(cat)
    const params = new URLSearchParams()
    if (cat !== 'all') params.set('category', cat)
    params.set('examType', examType)
    const res = await fetch(`/api/flashcards?${params}`)
    const data = await res.json()
    const cards: Question[] = data.cards || []
    setQueue(cards)
    setTotalCards(cards.length)
    setKnowItCount(0)
    setStudyMoreSwipes(0)
    setIsFlipped(false)
    setLastAction(null)
    setDragX(0)
    setExiting(false)
    setPhase('study')
    setLoading(false)
  }

  const advance = useCallback((dir: 'left' | 'right') => {
    if (exiting || queue.length === 0) return
    setExiting(true)
    const isKnow = dir === 'right'
    const isLastCard = isKnow && queue.length === 1
    setDragX(isKnow ? 700 : -700)
    setIsDragging(false)

    const prevQueue = queue
    setTimeout(() => {
      setLastAction({ queue: prevQueue, wasKnow: isKnow })
      if (isKnow) {
        setKnowItCount(k => k + 1)
        setQueue(q => q.slice(1))
        if (isLastCard) setPhase('complete')
      } else {
        setStudyMoreSwipes(s => s + 1)
        // Move front card to end of queue
        setQueue(q => {
          const [first, ...rest] = q
          return [...rest, first]
        })
      }
      setDragX(0)
      setIsFlipped(false)
      setExiting(false)
    }, 300)
  }, [exiting, queue])

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
    if (Math.abs(dragX) > 100) advance(dragX > 0 ? 'right' : 'left')
    else setDragX(0)
  }
  function onMouseLeave() {
    if (isDragging) { setIsDragging(false); setDragX(0) }
  }

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
    if (Math.abs(dragX) > 80) advance(dragX > 0 ? 'right' : 'left')
    else {
      setDragX(0)
      if (!didDrag.current) setIsFlipped(f => !f)
    }
  }

  function handleFlip() {
    if (didDrag.current || exiting) return
    setIsFlipped(f => !f)
  }

  function handleUndo() {
    if (!lastAction || exiting) return
    setQueue(lastAction.queue)
    if (lastAction.wasKnow) setKnowItCount(k => Math.max(0, k - 1))
    else setStudyMoreSwipes(s => Math.max(0, s - 1))
    setLastAction(null)
    setIsFlipped(false)
    if (phase === 'complete') setPhase('study')
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (phase === 'setup') return <SetupScreen onStart={loadDeck} loading={loading} categories={CATEGORIES} />

  if (phase === 'complete') {
    return (
      <CompleteScreen
        totalCards={totalCards}
        studyMoreSwipes={studyMoreSwipes}
        category={category}
        onNewDeck={() => setPhase('setup')}
        categories={CATEGORIES}
      />
    )
  }

  if (!currentCard) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 text-[#FFB627] animate-spin" />
    </div>
  )

  const catInfo = getCatInfo(category, CATEGORIES)
  const remaining = queue.length
  const progress = totalCards > 0 ? knowItCount / totalCards : 0

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
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-sm tabular-nums">{remaining} left</span>
          {knowItCount > 0 && (
            <span className="text-green-400 text-xs font-semibold tabular-nums">{knowItCount} known</span>
          )}
        </div>
      </div>

      {/* Progress bar — fills as cards are cleared */}
      <div className="progress-bar mb-6 shrink-0">
        <div className="progress-fill" style={{
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg, #10B981, #34D399)',
          boxShadow: '0 0 8px rgba(16,185,129,0.4)',
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Stack layers */}
          <div style={{
            position: 'absolute',
            width: 'min(580px, 86vw)', height: 'min(370px, calc(86vw * 0.64))',
            background: 'linear-gradient(160deg, #0b1830 0%, #080f1e 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '20px',
            transform: 'translateY(16px) scale(0.94)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            width: 'min(590px, 88vw)', height: 'min(380px, calc(88vw * 0.645))',
            background: 'linear-gradient(160deg, #0d1c36 0%, #090f22 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
            transform: 'translateY(8px) scale(0.97)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
            pointerEvents: 'none',
          }} />

          <Flashcard
            card={currentCard}
            isFlipped={isFlipped}
            dragX={dragX}
            isDragging={isDragging}
            exiting={exiting}
            onFlip={handleFlip}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            categories={CATEGORIES}
          />
        </div>

        {/* Swipe labels */}
        <div className="flex items-center justify-between mt-4 w-full max-w-sm px-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: dragX < -40 ? '#FFB627' : 'rgba(255,255,255,0.18)', transition: 'color 0.1s' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Study More
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: dragX > 40 ? '#10B981' : 'rgba(255,255,255,0.18)', transition: 'color 0.1s' }}>
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
          style={{ background: 'rgba(255,182,39,0.1)', border: '1.5px solid rgba(255,182,39,0.3)', color: '#FFB627' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Study More
        </button>

        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <button
            onClick={handleFlip}
            disabled={exiting}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            style={{ background: 'rgba(62,146,204,0.1)', border: '1.5px solid rgba(62,146,204,0.3)', color: '#3E92CC', minWidth: '72px' }}
          >
            <span style={{ fontSize: '15px', lineHeight: 1 }}>↻</span>
            Flip
          </button>
          <button
            onClick={handleUndo}
            disabled={!lastAction || exiting}
            className="flex items-center justify-center gap-1 text-xs transition-all disabled:opacity-25"
            style={{ color: 'rgba(255,255,255,0.35)', padding: '2px 8px' }}
            title="Undo last card"
          >
            <RotateCcw className="w-3 h-3" />
            undo
          </button>
        </div>

        <button
          onClick={() => advance('right')}
          disabled={exiting}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1.5px solid rgba(16,185,129,0.3)', color: '#10B981' }}
        >
          Know It
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Session stats */}
      <div className="flex items-center justify-center gap-8 mt-5 py-3.5 rounded-xl shrink-0"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="text-center">
          <div className="text-lg font-bold text-green-400 tabular-nums">{knowItCount}</div>
          <div className="text-white/35 text-xs uppercase tracking-wide">Cleared</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <div className="text-lg font-bold text-[#FFB627] tabular-nums">{remaining}</div>
          <div className="text-white/35 text-xs uppercase tracking-wide">Remaining</div>
        </div>
        {studyMoreSwipes > 0 && (
          <>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-lg font-bold text-white/60 tabular-nums">{studyMoreSwipes}</div>
              <div className="text-white/35 text-xs uppercase tracking-wide">Extra Reps</div>
            </div>
          </>
        )}
      </div>

      <p className="text-center text-white/20 text-xs mt-3 shrink-0">
        Space to flip · ← Study More · → Know It
      </p>
    </div>
  )
}
