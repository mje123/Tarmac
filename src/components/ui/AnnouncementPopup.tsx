'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Megaphone, AlertTriangle, PartyPopper } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'celebration'
  created_at: string
}

const DISMISSED_KEY = 'tarmac_dismissed_announcements'

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function dismiss(id: string) {
  const set = getDismissed()
  set.add(id)
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]))
}

function playSound(type: Announcement['type']) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

    if (type === 'celebration') {
      // Ascending arpeggio: C5 → E5 → G5 → C6
      const notes = [523, 659, 784, 1047]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = freq
        const t = ctx.currentTime + i * 0.12
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.22, t + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
        osc.start(t); osc.stop(t + 0.45)
      })
    } else if (type === 'warning') {
      // Two-tone pulse
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'square'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.setValueAtTime(370, ctx.currentTime + 0.18)
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.36)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.setValueAtTime(0.12, ctx.currentTime + 0.5)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.55)
    } else {
      // Soft bell chime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.9)
    }
  } catch { /* AudioContext blocked */ }
}

const TYPE_CONFIG = {
  info: {
    icon: Megaphone,
    bg: 'linear-gradient(135deg, rgba(62,146,204,0.18) 0%, rgba(62,146,204,0.08) 100%)',
    border: 'rgba(62,146,204,0.45)',
    accent: '#3E92CC',
    glow: 'rgba(62,146,204,0.25)',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'linear-gradient(135deg, rgba(255,182,39,0.18) 0%, rgba(255,182,39,0.08) 100%)',
    border: 'rgba(255,182,39,0.5)',
    accent: '#FFB627',
    glow: 'rgba(255,182,39,0.25)',
  },
  celebration: {
    icon: PartyPopper,
    bg: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.08) 100%)',
    border: 'rgba(34,197,94,0.45)',
    accent: '#22c55e',
    glow: 'rgba(34,197,94,0.25)',
  },
}

export default function AnnouncementPopup() {
  const [queue, setQueue] = useState<Announcement[]>([])
  const [current, setCurrent] = useState<Announcement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetch('/api/announcements')
      .then(r => r.json())
      .then(({ announcements }) => {
        if (!announcements?.length) return
        const dismissed = getDismissed()
        const unseen = (announcements as Announcement[]).filter(a => !dismissed.has(a.id))
        if (unseen.length > 0) setQueue(unseen)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (queue.length > 0 && !current) {
      const next = queue[0]
      setCurrent(next)
      setTimeout(() => {
        setVisible(true)
        playSound(next.type)
      }, 600)
    }
  }, [queue, current])

  function close() {
    if (!current) return
    dismiss(current.id)
    setVisible(false)
    setTimeout(() => {
      setCurrent(null)
      setQueue(q => q.slice(1))
    }, 400)
  }

  if (!current) return null

  const cfg = TYPE_CONFIG[current.type] || TYPE_CONFIG.info
  const Icon = cfg.icon

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4"
          >
            <div
              className="rounded-2xl p-6 relative"
              style={{
                background: cfg.bg,
                border: `1.5px solid ${cfg.border}`,
                boxShadow: `0 0 0 1px ${cfg.border}, 0 24px 60px rgba(0,0,0,0.6), 0 0 80px ${cfg.glow}`,
              }}
            >
              {/* Glow pulse behind card */}
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{ background: `radial-gradient(ellipse at 50% 0%, ${cfg.glow} 0%, transparent 70%)` }}
              />

              {/* Close button */}
              <button
                onClick={close}
                className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon + title */}
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={current.type === 'celebration'
                    ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1] }
                    : current.type === 'warning'
                    ? { scale: [1, 1.15, 1] }
                    : { y: [0, -3, 0] }
                  }
                  transition={{ delay: 0.3, duration: 0.6, repeat: current.type !== 'info' ? 2 : 0 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${cfg.accent}22`, border: `1px solid ${cfg.accent}44` }}
                >
                  <Icon className="w-5 h-5" style={{ color: cfg.accent }} />
                </motion.div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: cfg.accent }}>
                    {current.type === 'celebration' ? 'Announcement 🎉' : current.type === 'warning' ? 'Important Update' : 'From Tarmac'}
                  </p>
                  <h3 className="text-white font-bold text-base leading-tight">{current.title}</h3>
                </div>
              </div>

              {/* Message */}
              <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.72)' }}>
                {current.message}
              </p>

              {/* CTA */}
              <motion.button
                onClick={close}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: cfg.accent, color: '#0a1530' }}
              >
                Got it
              </motion.button>

              {queue.length > 1 && (
                <p className="text-center text-xs mt-2.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {queue.length - 1} more announcement{queue.length > 2 ? 's' : ''}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
