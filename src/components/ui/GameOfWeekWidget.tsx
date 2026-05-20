'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plane, AlertTriangle, ListChecks, MessageCircle, Trophy, ChevronRight } from 'lucide-react'

export interface GameOfWeekData {
  game: string
  isOverride: boolean
  weekStart: string
}

const GAME_META: Record<string, {
  name: string
  href: string
  tagline: string
  description: string
  color: string
  bg: string
  border: string
  glow: string
  icon: React.ElementType
}> = {
  altitude: {
    name: 'ALTITUDE',
    href: '/altitude',
    tagline: 'Speed quiz · streaks · 20 questions',
    description: 'Race the clock answering real FAA written questions. Build accuracy under pressure and climb the streak ladder.',
    color: '#3E92CC',
    bg: 'linear-gradient(135deg, rgba(62,146,204,0.15) 0%, rgba(62,146,204,0.05) 100%)',
    border: 'rgba(62,146,204,0.35)',
    glow: 'rgba(62,146,204,0.2)',
    icon: Plane,
  },
  situations: {
    name: 'SITUATIONS',
    href: '/situations',
    tagline: 'Emergency scenarios · AI graded',
    description: 'Handle real-world flight emergencies and checkride scenarios. Write your response — AI analyzes your aeronautical decision-making.',
    color: '#ef4444',
    bg: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)',
    border: 'rgba(239,68,68,0.3)',
    glow: 'rgba(239,68,68,0.2)',
    icon: AlertTriangle,
  },
  qotd: {
    name: 'QUESTION OF THE DAY',
    href: '/qotd',
    tagline: 'Community discussion · detailed scenarios',
    description: 'One deep question every day. Share your approach anonymously and read how other student pilots think through it.',
    color: '#a855f7',
    bg: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(168,85,247,0.05) 100%)',
    border: 'rgba(168,85,247,0.3)',
    glow: 'rgba(168,85,247,0.2)',
    icon: MessageCircle,
  },
  quiz: {
    name: 'QUIZ BLITZ',
    href: '/quiz',
    tagline: 'Quick-fire questions · all categories',
    description: 'Fast-paced quiz across all 9 FAA knowledge areas. How many can you nail back-to-back without breaking your streak?',
    color: '#22c55e',
    bg: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%)',
    border: 'rgba(34,197,94,0.3)',
    glow: 'rgba(34,197,94,0.2)',
    icon: ListChecks,
  },
}

export default function GameOfWeekWidget({ data }: { data: GameOfWeekData }) {
  const meta = GAME_META[data.game] ?? GAME_META.altitude
  const Icon = meta.icon

  return (
    <div className="mb-7">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-3.5 h-3.5" style={{ color: '#FFB627' }} />
        <span className="text-[10px] font-black text-[#FFB627] uppercase tracking-widest">Game of the Week</span>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(255,182,39,0.15)', color: '#FFB627', border: '1px solid rgba(255,182,39,0.25)' }}>
          Rotates Monday
        </span>
      </div>

      <motion.div whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
        <Link
          href={meta.href}
          className="relative flex items-center gap-5 p-6 rounded-2xl overflow-hidden transition-all"
          style={{ background: meta.bg, border: `1.5px solid ${meta.border}`, boxShadow: `0 0 40px ${meta.glow}` }}
        >
          {/* Glow pulse */}
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ background: `radial-gradient(ellipse at 0% 50%, ${meta.glow} 0%, transparent 60%)` }}
          />

          <div
            className="relative shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: `${meta.color}22`, border: `1.5px solid ${meta.color}44` }}
          >
            <Icon className="w-7 h-7" style={{ color: meta.color }} />
          </div>

          <div className="relative flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-white font-black tracking-tight text-lg leading-none" style={{ letterSpacing: '-0.02em' }}>
                {meta.name}
              </p>
              <span
                className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest shrink-0"
                style={{ background: `${meta.color}22`, color: meta.color, border: `1px solid ${meta.color}44` }}
              >
                Featured
              </span>
            </div>
            <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{meta.tagline}</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{meta.description}</p>
          </div>

          <div className="relative shrink-0 flex flex-col items-center gap-1">
            <div
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap"
              style={{ background: meta.color, color: '#0a1530' }}
            >
              Play Now
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  )
}
