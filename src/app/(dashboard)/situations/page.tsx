'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, ChevronRight, RotateCcw, Loader2, AlertTriangle, CheckCircle, XCircle, BookOpen } from 'lucide-react'

interface Situation {
  id: number
  text: string
  tagColor: string  // hex
  tag: string
}

const SITUATIONS: Situation[] = [
  { id: 1,  tag: 'Engine',      tagColor: '#f97316', text: "Your airspeed indicator suddenly drops to zero during cruise at 4,500 ft MSL in clear skies. The aircraft feels normal otherwise. What are your immediate actions?" },
  { id: 2,  tag: 'Engine',      tagColor: '#f97316', text: "At 400 ft AGL immediately after takeoff, your engine loses power and you cannot restore it. What do you do?" },
  { id: 3,  tag: 'Weather',     tagColor: '#3E92CC', text: "You are flying VFR and encounter a cloud layer you cannot climb over or go around. Visibility is dropping rapidly. What are your immediate actions?" },
  { id: 4,  tag: 'Emergency',   tagColor: '#ef4444', text: "Smoke begins entering the cockpit from underneath the instrument panel in flight. What are your immediate steps?" },
  { id: 5,  tag: 'Electrical',  tagColor: '#FFB627', text: "Your alternator warning light illuminates and your ammeter shows a discharge during a cross-country flight 45 minutes from your destination. What do you do?" },
  { id: 6,  tag: 'Engine',      tagColor: '#f97316', text: "The engine begins running rough and RPM is slowly dropping. You're flying in visible moisture at 34°F. What do you suspect, and what are your corrective actions?" },
  { id: 7,  tag: 'Medical',     tagColor: '#a855f7', text: "Your passenger becomes unresponsive and stops breathing during cruise flight 25 minutes from the nearest airport. What do you do?" },
  { id: 8,  tag: 'Fuel',        tagColor: '#ef4444', text: "Halfway through a cross-country you calculate you have 25 minutes of usable fuel remaining but your destination is 40 minutes away. What are your actions?" },
  { id: 9,  tag: 'ATC',         tagColor: '#22c55e', text: "Your radio completely fails while you are inside Class D airspace. Describe exactly how you handle this situation." },
  { id: 10, tag: 'Engine',      tagColor: '#f97316', text: "Oil pressure is dropping rapidly and oil temperature is rising in cruise flight. What do you do and why?" },
  { id: 11, tag: 'Emergency',   tagColor: '#ef4444', text: "The cabin door pops open in flight at 3,000 ft AGL. The aircraft begins to yaw. What is your immediate response?" },
  { id: 12, tag: 'ATC',         tagColor: '#22c55e', text: "ATC gives you a heading that would take you into Class B airspace but you have not received an explicit clearance into Class Bravo. What do you say and do?" },
  { id: 13, tag: 'Maneuvers',   tagColor: '#3E92CC', text: "During a steep turn practice at altitude, the aircraft enters an incipient spin. What is the correct recovery procedure in the exact order of control inputs?" },
  { id: 14, tag: 'Traffic',     tagColor: '#22c55e', text: "You're cleared to land on Runway 27 and on short final you see an aircraft still on the runway that has not exited. What do you do?" },
  { id: 15, tag: 'Instruments', tagColor: '#FFB627', text: "On short final, the VASI shows four red lights. What does this indicate and what action do you take immediately?" },
  { id: 16, tag: 'Fuel',        tagColor: '#ef4444', text: "Your fuel gauge shows the left tank nearly empty but your flight log says you should have fuel remaining. What do you do?" },
  { id: 17, tag: 'Weather',     tagColor: '#3E92CC', text: "You encounter severe turbulence that you cannot escape. What airspeed do you target, and what are your control technique priorities?" },
  { id: 18, tag: 'Navigation',  tagColor: '#a855f7', text: "On a night cross-country, your GPS fails and your VORs are showing inconsistent readings. You are uncertain of your position. What do you do?" },
  { id: 19, tag: 'ATC',         tagColor: '#22c55e', text: "ATC instructs you to descend to an altitude that would put you in IMC, but you are VFR only. What do you say and do?" },
  { id: 20, tag: 'Pre-Takeoff', tagColor: '#FFB627', text: "You have been cleared for takeoff and are rolling onto the runway when you notice the windsock has completely reversed since your last check. What do you do?" },
]

type Phase = 'intro' | 'answering' | 'evaluating' | 'verdict' | 'briefing' | 'summary'
type Tone = 'harsh' | 'friendly' | 'quick'

interface Result { correct: boolean; score: number; feedback: string }

const TONES: { id: Tone; label: string; sub: string }[] = [
  { id: 'harsh',    label: 'Give it to me straight',  sub: 'Tough DPE — no sugarcoating' },
  { id: 'friendly', label: 'Walk me through it',       sub: 'Patient CFI — step by step' },
  { id: 'quick',    label: 'Just the key points',      sub: 'Bullet points — fast read' },
]

export default function SituationsPage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [idx, setIdx] = useState(0)
  const [shuffled] = useState(() => [...SITUATIONS].sort(() => Math.random() - 0.5))
  const [response, setResponse] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [briefing, setBriefing] = useState('')
  const [loadingBriefing, setLoadingBriefing] = useState(false)
  const [scores, setScores] = useState<number[]>([])

  const situation = shuffled[idx]
  const totalSituations = SITUATIONS.length

  async function evaluate() {
    if (response.trim().length < 20) return
    setPhase('evaluating')
    try {
      const res = await fetch('/api/situations/evaluate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ situation: situation.text, response: response.trim(), mode: 'evaluate' }),
      })
      const data = await res.json()
      setResult(data)
      setScores(s => [...s, data.score])
      setPhase('verdict')
    } catch {
      setPhase('answering')
    }
  }

  async function getBriefing(tone: Tone) {
    setLoadingBriefing(true)
    setBriefing('')
    setPhase('briefing')
    try {
      const res = await fetch('/api/situations/evaluate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ situation: situation.text, response: response.trim(), mode: 'explain', tone }),
      })
      const data = await res.json()
      setBriefing(data.explanation || '')
    } catch {
      setBriefing('Unable to load briefing. Please try again.')
    }
    setLoadingBriefing(false)
  }

  function next() {
    if (idx + 1 >= totalSituations) {
      setPhase('summary')
    } else {
      setIdx(i => i + 1)
      setResponse('')
      setResult(null)
      setBriefing('')
      setPhase('answering')
    }
  }

  function restart() {
    setIdx(0)
    setResponse('')
    setResult(null)
    setBriefing('')
    setScores([])
    setPhase('intro')
  }

  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const excellent = scores.filter(s => s === 3).length
  const partial = scores.filter(s => s === 2).length
  const missed = scores.filter(s => s === 1).length

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <div className="min-h-[82vh] flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="max-w-sm w-full text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-3xl"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.04))', border: '1px solid rgba(239,68,68,0.3)' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertTriangle className="w-11 h-11 text-red-400" />
          </div>
        </div>

        <h1 className="text-5xl font-black text-white mb-2" style={{ letterSpacing: '-0.05em' }}>SITUATIONS</h1>
        <p className="text-white/45 text-sm mb-1">Read. Think. Respond.</p>
        <p className="text-white/25 text-xs mb-7">
          {totalSituations} real emergency scenarios.<br />
          Type what you'd do. AI evaluates your answer.
        </p>

        <div className="mb-6 space-y-2 text-left">
          {[
            { icon: '🚨', label: 'Real emergencies', sub: 'Engine failures, weather, ATC, medical' },
            { icon: '✍️', label: 'Write your response', sub: '2-3 sentences — how you\'d handle it' },
            { icon: '🧑‍✈️', label: 'AI gives honest feedback', sub: 'Then choose: harsh, friendly, or quick' },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-xl shrink-0">{icon}</span>
              <div>
                <p className="text-white/80 text-sm font-semibold">{label}</p>
                <p className="text-white/35 text-xs">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setPhase('answering')}
          className="w-full py-4 rounded-2xl text-base font-black mb-4 transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', color: '#fff', boxShadow: '0 8px 32px rgba(239,68,68,0.3)' }}>
          Begin Situations ✈
        </button>

        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-white/25 text-xs hover:text-white/50 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Dashboard
        </Link>
      </div>
    </div>
  )

  // ── SUMMARY ────────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const grade = avgScore >= 2.7 ? 'Outstanding' : avgScore >= 2.2 ? 'Solid Pilot' : avgScore >= 1.6 ? 'Keep Training' : 'Back to Ground School'
    const gradeColor = avgScore >= 2.7 ? '#22c55e' : avgScore >= 2.2 ? '#3E92CC' : avgScore >= 1.6 ? '#FFB627' : '#ef4444'

    return (
      <div className="min-h-[82vh] flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🧑‍✈️</div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: gradeColor }}>Debrief Complete</p>
            <p className="text-4xl font-black text-white" style={{ letterSpacing: '-0.03em', color: gradeColor }}>{grade}</p>
          </div>

          <div className="glass-card p-5 text-center mb-4">
            <p className="text-5xl font-black text-white tabular-nums">{avgScore.toFixed(1)}<span className="text-xl text-white/30">/3</span></p>
            <p className="text-white/35 text-xs mt-1">average score</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { v: excellent, label: 'Excellent', color: '#22c55e' },
              { v: partial, label: 'Partial', color: '#FFB627' },
              { v: missed, label: 'Missed', color: '#ef4444' },
            ].map(({ v, label, color }) => (
              <div key={label} className="glass-card p-4 text-center">
                <p className="text-2xl font-black" style={{ color }}>{v}</p>
                <p className="text-white/30 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>

          <button onClick={restart}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-extrabold transition-all hover:opacity-90 mb-3"
            style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff' }}>
            <RotateCcw className="w-4 h-4" /> Run Again
          </button>
          <Link href="/dashboard" className="block text-center text-white/25 text-sm hover:text-white/50 transition-colors">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  // ── ACTIVE GAME ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-white/35 text-xs font-mono shrink-0">{idx + 1}/{totalSituations}</span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${((idx + 1) / totalSituations) * 100}%`, background: '#ef4444' }} />
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full font-bold shrink-0"
          style={{ background: `${situation.tagColor}18`, color: situation.tagColor, border: `1px solid ${situation.tagColor}35` }}>
          {situation.tag}
        </span>
      </div>

      {/* Situation card */}
      <div className="rounded-2xl p-6 mb-5"
        style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
          Situation {idx + 1}
        </p>
        <p className="text-white text-[15px] font-semibold leading-relaxed">{situation.text}</p>
      </div>

      {/* Answering phase */}
      {(phase === 'answering' || phase === 'evaluating') && (
        <>
          <div className="mb-4">
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
              Your Response
            </label>
            <textarea
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder="Describe what you would do in 2-3 sentences…"
              rows={5}
              disabled={phase === 'evaluating'}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none resize-none transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-white/20 text-xs">{response.length < 20 ? `${20 - response.length} more characters minimum` : 'Ready to submit'}</span>
              <span className="text-white/20 text-xs">{response.length} chars</span>
            </div>
          </div>

          <button
            onClick={evaluate}
            disabled={response.trim().length < 20 || phase === 'evaluating'}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-extrabold transition-all hover:opacity-90 disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff' }}>
            {phase === 'evaluating'
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating…</>
              : <><Send className="w-4 h-4" /> Submit Response</>}
          </button>
        </>
      )}

      {/* Verdict phase */}
      {phase === 'verdict' && result && (
        <div className="animate-fade-in">
          {/* Result card */}
          <div className="rounded-2xl p-5 mb-4 transition-all" style={{
            background: result.score === 3 ? 'rgba(34,197,94,0.07)' : result.score === 2 ? 'rgba(255,182,39,0.07)' : 'rgba(239,68,68,0.07)',
            border: result.score === 3 ? '1px solid rgba(34,197,94,0.3)' : result.score === 2 ? '1px solid rgba(255,182,39,0.3)' : '1px solid rgba(239,68,68,0.3)',
          }}>
            <div className="flex items-center gap-3 mb-3">
              {result.score === 3
                ? <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
                : result.score === 2
                ? <AlertTriangle className="w-6 h-6 text-[#FFB627] shrink-0" />
                : <XCircle className="w-6 h-6 text-red-400 shrink-0" />}
              <div>
                <p className="font-black text-sm" style={{
                  color: result.score === 3 ? '#22c55e' : result.score === 2 ? '#FFB627' : '#ef4444'
                }}>
                  {result.score === 3 ? 'Cleared ✓' : result.score === 2 ? 'Partial credit △' : 'Missed critical items ✗'}
                </p>
                <p className="text-[10px] text-white/30 font-mono">Score: {result.score}/3</p>
              </div>
            </div>
            <p className="text-white/75 text-sm leading-relaxed">{result.feedback}</p>
          </div>

          {/* Get briefing */}
          <div className="mb-4">
            <p className="text-xs font-bold text-white/35 uppercase tracking-widest mb-3 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" /> Want the full correct procedure?
            </p>
            <div className="space-y-2">
              {TONES.map(tone => (
                <button key={tone.id} onClick={() => getBriefing(tone.id)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all hover:brightness-110"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  <div>
                    <p className="text-white/80 text-sm font-semibold">{tone.label}</p>
                    <p className="text-white/30 text-xs">{tone.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/25 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <button onClick={next}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-extrabold transition-all hover:opacity-90"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>
            {idx + 1 >= totalSituations ? 'See Debrief →' : 'Next Situation →'}
          </button>
        </div>
      )}

      {/* Briefing phase */}
      {phase === 'briefing' && (
        <div className="animate-fade-in">
          <div className="rounded-2xl p-5 mb-4"
            style={{ background: 'rgba(62,146,204,0.06)', border: '1px solid rgba(62,146,204,0.25)' }}>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#3E92CC] mb-3">Briefing</p>
            {loadingBriefing
              ? <div className="flex items-center gap-3 py-4">
                  <Loader2 className="w-4 h-4 text-[#3E92CC] animate-spin shrink-0" />
                  <p className="text-white/40 text-sm">Generating briefing…</p>
                </div>
              : <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{briefing}</p>
            }
          </div>

          {!loadingBriefing && (
            <button onClick={next}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-extrabold transition-all hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>
              {idx + 1 >= totalSituations ? 'See Debrief →' : 'Next Situation →'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
