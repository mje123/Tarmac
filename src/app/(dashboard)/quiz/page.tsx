'use client'

import React, { useState } from 'react'
import { Question, AnswerOption, QuestionCategory } from '@/types'
import AIChat from '@/components/ui/AIChat'
import GeneralChat from '@/components/ui/GeneralChat'
import {
  CheckCircle, XCircle, ChevronRight, Loader2, ListChecks,
  Trophy, RotateCcw, BookOpen, Compass, Cloud, Wind,
  Gauge, Scale, Plane, Radio, Map, Play, Zap,
} from 'lucide-react'

const CATEGORIES: { value: QuestionCategory; icon: React.ElementType; color: string; short: string }[] = [
  { value: 'Regulations', icon: BookOpen, color: '#3E92CC', short: 'Regs' },
  { value: 'Airspace', icon: Compass, color: '#8B5CF6', short: 'Airspace' },
  { value: 'Weather Theory', icon: Cloud, color: '#06B6D4', short: 'Wx Theory' },
  { value: 'Weather Services', icon: Wind, color: '#10B981', short: 'Wx Services' },
  { value: 'Aircraft Performance', icon: Gauge, color: '#F59E0B', short: 'Performance' },
  { value: 'Weight & Balance', icon: Scale, color: '#EF4444', short: 'W&B' },
  { value: 'Aerodynamics', icon: Plane, color: '#EC4899', short: 'Aero' },
  { value: 'Flight Instruments', icon: Radio, color: '#6366F1', short: 'Instruments' },
  { value: 'Navigation', icon: Map, color: '#14B8A6', short: 'Nav' },
]

type Phase = 'setup' | 'loading' | 'question' | 'answered' | 'submitting' | 'results'

interface QuizResult {
  question: Question
  userAnswer: AnswerOption | null
  isCorrect: boolean
}

const TOTAL = 10

export default function QuizPage() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [topic, setTopic] = useState<QuestionCategory | 'all'>('all')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null)
  const [results, setResults] = useState<QuizResult[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showAI, setShowAI] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const currentQuestion = questions[currentIndex] ?? null

  async function startQuiz() {
    setPhase('loading')
    try {
      const sessionRes = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionType: 'quiz' }),
      })
      const sessionData = await sessionRes.json()
      setSessionId(sessionData.sessionId)

      const qs: Question[] = []
      const excludeIds: string[] = []
      for (let i = 0; i < TOTAL; i++) {
        const params = new URLSearchParams()
        if (topic !== 'all') params.set('category', topic)
        excludeIds.forEach(id => params.append('exclude', id))
        const res = await fetch(`/api/questions/random?${params}`)
        const data = await res.json()
        if (!data.question) break
        qs.push(data.question)
        excludeIds.push(data.question.id)
      }

      if (qs.length === 0) {
        setPhase('setup')
        return
      }

      setQuestions(qs)
      setCurrentIndex(0)
      setResults([])
      setSelectedAnswer(null)
      setPhase('question')
    } catch {
      setPhase('setup')
    }
  }

  async function submitAnswer(answer: AnswerOption) {
    if (!currentQuestion || !sessionId || phase !== 'question') return
    setSelectedAnswer(answer)
    const isCorrect = answer === currentQuestion.correct_answer

    fetch('/api/sessions/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, questionId: currentQuestion.id, answer, isCorrect }),
    })

    setResults(prev => [...prev, { question: currentQuestion, userAnswer: answer, isCorrect }])
    setPhase('answered')
  }

  async function next() {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(i => i + 1)
      setSelectedAnswer(null)
      setShowAI(false)
      setPhase('question')
    } else {
      await finishQuiz()
    }
  }

  async function finishQuiz() {
    setPhase('submitting')
    const finalResults = results
    const score = finalResults.filter(r => r.isCorrect).length

    const missedQuestions = finalResults
      .filter(r => !r.isCorrect)
      .map(r => {
        const q = r.question
        const optLabel = (ans: string) => {
          const key = `option_${ans.toLowerCase()}` as keyof Question
          return `${ans}) ${(q[key] as string) ?? ans}`
        }
        return {
          questionText: q.question_text,
          userAnswer: r.userAnswer ? optLabel(r.userAnswer) : 'Unanswered',
          correctAnswer: optLabel(q.correct_answer),
          explanation: q.explanation,
          category: q.category,
        }
      })

    try {
      await fetch('/api/sessions/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          topic,
          score,
          totalQuestions: finalResults.length,
          missedQuestions,
        }),
      })
      setEmailSent(true)
    } catch {
      // non-fatal
    }
    setPhase('results')
  }

  function reset(sameTopic = false) {
    setPhase('setup')
    setQuestions([])
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setResults([])
    setSessionId(null)
    setShowAI(false)
    setEmailSent(false)
    if (!sameTopic) setTopic('all')
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (phase === 'loading' || phase === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-10 h-10 text-[#FFB627] animate-spin" />
        <p className="text-white/50 text-sm">{phase === 'loading' ? 'Loading your quiz…' : 'Calculating results…'}</p>
      </div>
    )
  }

  // ── Results ──────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const score = results.filter(r => r.isCorrect).length
    const pct = Math.round((score / results.length) * 100)
    const passed = pct >= 70
    const scoreColor = passed ? '#10B981' : '#EF4444'
    const topicLabel = topic === 'all' ? 'Mixed Topics' : topic
    const missedResults = results.filter(r => !r.isCorrect)

    return (
      <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto animate-fade-in">
        {/* Score card */}
        <div
          className="rounded-2xl p-8 text-center mb-6"
          style={{
            background: passed
              ? 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)'
              : 'linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 100%)',
            border: `1px solid ${passed ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
          }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: `${scoreColor}20`, border: `2px solid ${scoreColor}40` }}>
            <Trophy className="w-8 h-8" style={{ color: scoreColor }} />
          </div>
          <div className="text-white/40 text-xs uppercase tracking-widest mb-1">{topicLabel} · 10 Questions</div>
          <div className="text-7xl font-extrabold text-white leading-none tracking-tight mb-1">
            {score}<span className="text-4xl text-white/30 font-semibold">/{results.length}</span>
          </div>
          <div className="text-3xl font-bold mb-4" style={{ color: scoreColor }}>{pct}%</div>
          <div
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold"
            style={{
              background: passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${passed ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
              color: passed ? '#34d399' : '#f87171',
            }}
          >
            {passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {passed ? 'PASSED' : 'FAILED'}
          </div>
          {passed ? (
            <p className="text-white/50 text-sm mt-4 leading-relaxed">
              You cleared 70% — great work on {topicLabel}. Keep this momentum going.
            </p>
          ) : (
            <p className="text-white/50 text-sm mt-4 leading-relaxed">
              Review the missed questions below, then try again. Unlimited quizzes — use them.
            </p>
          )}
          {emailSent && (
            <p className="text-white/30 text-xs mt-3">Results emailed to you.</p>
          )}
        </div>

        {/* Dot recap row */}
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {results.map((r, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: r.isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  border: `2px solid ${r.isCorrect ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}`,
                  color: r.isCorrect ? '#10B981' : '#EF4444',
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Missed questions */}
        {missedResults.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">
              Missed Questions ({missedResults.length})
            </h3>
            <div className="space-y-3">
              {missedResults.map((r, i) => {
                const q = r.question
                const optLabel = (ans: string) => {
                  const key = `option_${ans.toLowerCase()}` as keyof Question
                  return `${ans}) ${(q[key] as string) ?? ans}`
                }
                return (
                  <div
                    key={i}
                    className="glass-card p-5"
                    style={{ borderLeft: '3px solid rgba(239,68,68,0.6)' }}
                  >
                    <div className="text-white/40 text-xs mb-2">{q.category}</div>
                    <p className="text-white text-sm font-medium leading-relaxed mb-3">{q.question_text}</p>
                    <div className="text-red-400 text-xs mb-1">
                      Your answer: {r.userAnswer ? optLabel(r.userAnswer) : 'Unanswered'}
                    </div>
                    <div className="text-emerald-400 text-xs font-semibold mb-3">
                      Correct: {optLabel(q.correct_answer)}
                    </div>
                    <p className="text-white/50 text-xs leading-relaxed border-t border-white/8 pt-3">{q.explanation}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => reset(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463' }}
          >
            <RotateCcw className="w-4 h-4" />
            Same Topic
          </button>
          <button
            onClick={() => reset(false)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
          >
            <ListChecks className="w-4 h-4" />
            New Quiz
          </button>
        </div>
      </div>
    )
  }

  // ── Setup ────────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="min-h-screen p-6 md:p-10 max-w-4xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFB62722, #FFB62744)' }}>
              <ListChecks className="w-5 h-5 text-[#FFB627]" />
            </div>
            <h1 className="text-3xl font-bold text-white">Quiz Mode</h1>
          </div>
          <p className="text-white/50 text-sm ml-13 pl-1">10 focused questions · instant feedback · emailed results</p>
        </div>

        {/* Topic selection */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Choose a Topic</h2>

          {/* Mixed option */}
          <button
            onClick={() => setTopic('all')}
            className="w-full p-4 rounded-xl text-left mb-3 transition-all"
            style={{
              background: topic === 'all' ? 'linear-gradient(135deg, rgba(255,182,39,0.2), rgba(255,182,39,0.1))' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${topic === 'all' ? 'rgba(255,182,39,0.45)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,182,39,0.15)' }}>
                <Zap className="w-4 h-4 text-[#FFB627]" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Mixed Topics</div>
                <div className="text-white/40 text-xs">Random questions across all 9 categories</div>
              </div>
              {topic === 'all' && (
                <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#FFB627' }}>
                  <svg className="w-3 h-3 text-[#0A2463]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Category grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {CATEGORIES.map(({ value, icon: Icon, color, short }) => {
              const selected = topic === value
              return (
                <button
                  key={value}
                  onClick={() => setTopic(value)}
                  className="p-3 rounded-xl text-left transition-all relative"
                  style={{
                    background: selected ? `linear-gradient(135deg, ${color}22, ${color}11)` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${selected ? `${color}55` : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <span className="text-white text-xs font-medium">{short}</span>
                    {selected && (
                      <div className="ml-auto w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: color }}>
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
        </div>

        {/* Info bar */}
        <div className="flex items-center gap-4 mb-6 px-1">
          {[
            { icon: ListChecks, text: '10 questions' },
            { icon: CheckCircle, text: 'Instant feedback' },
            { icon: Trophy, text: 'Email report' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-white/40 text-xs">
              <Icon className="w-3.5 h-3.5" />
              {text}
            </div>
          ))}
        </div>

        {/* Start button */}
        <button
          onClick={startQuiz}
          className="btn-gold w-full justify-center py-4 text-base font-bold gap-3"
          style={{ borderRadius: '16px' }}
        >
          <Play className="w-5 h-5" />
          Start {topic === 'all' ? 'Mixed' : topic} Quiz
        </button>
      </div>
    )
  }

  // ── Question / Answered ──────────────────────────────────────────────────────
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-[#3E92CC] animate-spin" />
      </div>
    )
  }

  const questionNumber = currentIndex + 1
  const progressPct = (questionNumber / questions.length) * 100
  const catInfo = CATEGORIES.find(c => c.value === currentQuestion.category)
  const isAnswered = phase === 'answered'
  const isCorrect = selectedAnswer === currentQuestion.correct_answer

  const optionKeys = (['A', 'B', 'C', 'D'] as AnswerOption[]).filter(k =>
    k !== 'D' || !!currentQuestion.option_d
  )
  const optionValues: Record<string, string> = {
    A: currentQuestion.option_a,
    B: currentQuestion.option_b,
    C: currentQuestion.option_c,
    D: currentQuestion.option_d || '',
  }

  const isLastQuestion = currentIndex + 1 === questions.length

  return (
    <div className="min-h-screen p-4 md:p-6 flex flex-col max-w-3xl mx-auto animate-fade-in">
      {/* Top bar */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-[#FFB627]" />
          <span className="text-white font-bold text-sm">Q{questionNumber}</span>
          <span className="text-white/30 text-sm">of {questions.length}</span>
        </div>

        {/* Dot progress */}
        <div className="flex items-center gap-1 flex-1">
          {questions.map((_, i) => {
            const res = results[i]
            const isDone = i < results.length
            const isCurrent = i === currentIndex
            return (
              <div
                key={i}
                className="h-2 flex-1 rounded-full transition-all duration-300"
                style={{
                  background: isDone
                    ? (res.isCorrect ? '#10B981' : '#EF4444')
                    : isCurrent
                    ? '#FFB627'
                    : 'rgba(255,255,255,0.08)',
                }}
              />
            )
          })}
        </div>

        <span className="text-white/40 text-xs">{Math.round(progressPct)}%</span>
      </div>

      {/* Question card */}
      <div className="glass-card p-6 flex-1 flex flex-col" style={{ borderRadius: '20px' }}>
        {/* Meta */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {catInfo && (
            <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: `${catInfo.color}18`, color: catInfo.color, border: `1px solid ${catInfo.color}30` }}>
              <catInfo.icon className="w-3 h-3" />
              {currentQuestion.category}
            </span>
          )}
          <span className="text-xs px-3 py-1.5 rounded-full font-medium capitalize"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {currentQuestion.difficulty}
          </span>
        </div>

        <p className="text-white text-lg leading-relaxed mb-7 font-medium">{currentQuestion.question_text}</p>

        <div className="space-y-2.5">
          {optionKeys.map(key => {
            const isCorrectOption = key === currentQuestion.correct_answer
            const isSelected = key === selectedAnswer

            let bg = 'rgba(255,255,255,0.04)'
            let border = 'rgba(255,255,255,0.09)'
            let letterBg = 'rgba(255,255,255,0.08)'
            let letterColor = 'rgba(255,255,255,0.5)'
            let textColor = 'rgba(255,255,255,0.85)'

            if (isAnswered) {
              if (isCorrectOption) {
                bg = 'rgba(16,185,129,0.1)'
                border = 'rgba(16,185,129,0.35)'
                letterBg = 'rgba(16,185,129,0.2)'
                letterColor = '#10B981'
                textColor = 'white'
              } else if (isSelected && !isCorrectOption) {
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
                onClick={() => !isAnswered && submitAnswer(key)}
                className={`w-full text-left p-4 flex items-center gap-3 transition-all duration-150 rounded-2xl ${!isAnswered ? 'hover:scale-[1.005]' : ''}`}
                style={{ background: bg, border: `1px solid ${border}`, cursor: !isAnswered ? 'pointer' : 'default' }}
              >
                <span className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: letterBg, color: letterColor }}>
                  {key}
                </span>
                <span className="leading-relaxed text-sm" style={{ color: textColor }}>{optionValues[key]}</span>
                {isAnswered && isCorrectOption && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 ml-auto" />}
                {isAnswered && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-red-400 shrink-0 ml-auto" />}
              </button>
            )
          })}
        </div>

        {/* Feedback */}
        {isAnswered && (
          <div className="mt-5 animate-fade-in">
            <div
              className="p-4 rounded-2xl mb-4"
              style={{
                background: isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}
            >
              <div className="flex items-center gap-2 font-bold mb-1.5 text-sm"
                style={{ color: isCorrect ? '#34d399' : '#f87171' }}>
                {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {isCorrect ? 'Correct!' : 'Not quite — review the explanation'}
              </div>
              <p className="text-white/65 text-sm leading-relaxed">{currentQuestion.explanation}</p>
              {currentQuestion.reference && (
                <p className="text-white/30 text-xs mt-2">Ref: {currentQuestion.reference}</p>
              )}
            </div>

            <div className={isCorrect ? '' : 'grid grid-cols-2 gap-3'}>
              {!isCorrect && (
                <button
                  onClick={() => setShowAI(true)}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #3E92CC, #2a7ab5)', color: 'white' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Ask AI Tutor
                </button>
              )}
              <button
                onClick={next}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463', boxShadow: '0 4px 20px rgba(255,182,39,0.35)' }}
              >
                {isLastQuestion ? 'See Results' : 'Next Question'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <GeneralChat
        currentQuestionContext={`Category: ${currentQuestion.category}\nQuestion: ${currentQuestion.question_text}`}
      />

      {showAI && selectedAnswer && (
        <AIChat
          question={currentQuestion}
          userAnswer={selectedAnswer}
          correctAnswer={currentQuestion.correct_answer}
          onClose={() => setShowAI(false)}
          onContinue={() => { setShowAI(false); next() }}
        />
      )}
    </div>
  )
}
