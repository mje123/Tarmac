'use client'

import { useState, useRef, useEffect } from 'react'
import { Question, AIMessage } from '@/types'
import { X, Send, Loader2, Bot } from 'lucide-react'

interface AIChatProps {
  question: Question
  userAnswer: string
  correctAnswer: string
  onClose: () => void
  onContinue?: () => void
  conversationId?: string
}

export default function AIChat({ question, userAnswer, correctAnswer, onClose, onContinue, conversationId }: AIChatProps) {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [convId, setConvId] = useState(conversationId)

  useEffect(() => {
    initConversation()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function initConversation() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          questionText: question.question_text,
          optionA: question.option_a,
          optionB: question.option_b,
          optionC: question.option_c,
          optionD: question.option_d,
          userAnswer,
          correctAnswer,
          explanation: question.explanation,
          reference: question.reference,
          isInitial: true,
          conversationId: convId,
          messages: [],
        }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages([{ role: 'assistant', content: data.message }])
        if (data.conversationId) setConvId(data.conversationId)
      }
    } catch (e) {
      setMessages([{ role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    const newMessages: AIMessage[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          questionText: question.question_text,
          optionA: question.option_a,
          optionB: question.option_b,
          optionC: question.option_c,
          optionD: question.option_d,
          userAnswer,
          correctAnswer,
          explanation: question.explanation,
          reference: question.reference,
          isInitial: false,
          conversationId: convId,
          messages: newMessages,
        }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
        if (data.conversationId) setConvId(data.conversationId)
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const answerLabels: Record<string, string> = {
    A: question.option_a,
    B: question.option_b,
    C: question.option_c,
    ...(question.option_d ? { D: question.option_d } : {}),
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden animate-fade-in" style={{ background: '#0d1f4a', border: '1px solid rgba(255,255,255,0.12)', maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(62,146,204,0.2)' }}>
            <Bot className="w-5 h-5 text-[#3E92CC]" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white text-sm">TARMAC AI Tutor</div>
            <div className="text-xs text-white/40">Expert flight instructor</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question context */}
        <div className="px-5 py-3 text-xs space-y-1" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-white/50 font-medium mb-1.5">Question context</div>
          <div className="text-white/70 line-clamp-2">{question.question_text}</div>
          <div className="flex gap-4 mt-1">
            <span className="text-red-400">Your answer: {userAnswer}. {answerLabels[userAnswer]}</span>
            <span className="text-green-400">Correct: {correctAnswer}. {answerLabels[correctAnswer]}</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-hidden">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(62,146,204,0.2)' }}>
                  <Bot className="w-4 h-4 text-[#3E92CC]" />
                </div>
              )}
              <div
                className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                style={msg.role === 'assistant'
                  ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.9)' }
                  : { background: '#3E92CC', color: 'white' }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && messages.length > 0 && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(62,146,204,0.2)' }}>
                <Bot className="w-4 h-4 text-[#3E92CC]" />
              </div>
              <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
              </div>
            </div>
          )}
          {loading && messages.length === 0 && (
            <div className="flex items-center justify-center py-8 gap-2 text-white/40">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Preparing explanation...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a follow-up question..."
              disabled={loading && messages.length === 0}
              className="flex-1"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary px-4 py-3 shrink-0"
              style={{ padding: '12px 16px' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          {onContinue && (
            <button
              onClick={onContinue}
              className="w-full mt-3 py-2.5 text-sm font-medium text-[#3E92CC] hover:text-white transition-colors"
            >
              Got it — next question →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
