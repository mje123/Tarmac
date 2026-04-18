'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  currentQuestionContext?: string
}

const SUGGESTED = [
  'What is density altitude?',
  'Explain VFR weather minimums',
  'How do I read a METAR?',
  'What causes a stall?',
]

export default function GeneralChat({ currentQuestionContext }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm your TARMAC AI Tutor. Ask me anything about aviation, the FAA written exam, regulations, weather, airspace — whatever you need. 🛩️",
      }])
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const userMsg = (text ?? input).trim()
    if (!userMsg || loading) return
    setInput('')

    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/ai/general-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          currentQuestionContext,
        }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error — please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 rounded-2xl overflow-hidden transition-all" style={{ border: '1px solid rgba(62,146,204,0.25)', background: 'rgba(10,36,99,0.4)' }}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all hover:bg-white/5"
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(62,146,204,0.3), rgba(62,146,204,0.15))' }}>
          <Bot className="w-4 h-4 text-[#3E92CC]" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            AI Tutor
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(62,146,204,0.2)', color: '#3E92CC' }}>
              Ask anything
            </span>
          </div>
          <div className="text-xs text-white/40">Aviation questions, concepts, regulations</div>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-white/40 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
        }
      </button>

      {open && (
        <div className="flex flex-col" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Messages */}
          <div className="overflow-y-auto px-4 py-4 space-y-3 scrollbar-hidden" style={{ maxHeight: '320px' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(62,146,204,0.2)' }}>
                    <Bot className="w-3.5 h-3.5 text-[#3E92CC]" />
                  </div>
                )}
                <div
                  className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={msg.role === 'assistant'
                    ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.88)' }
                    : { background: 'linear-gradient(135deg, #3E92CC, #2a7ab5)', color: 'white' }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(62,146,204,0.2)' }}>
                  <Bot className="w-3.5 h-3.5 text-[#3E92CC]" />
                </div>
                <div className="px-3.5 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts — only show if just the welcome message */}
          {messages.length === 1 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {SUGGESTED.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full transition-all hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
            <form onSubmit={e => { e.preventDefault(); sendMessage() }} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about regulations, weather, airspace..."
                disabled={loading}
                className="flex-1 text-sm"
                style={{ borderRadius: '12px', padding: '10px 14px' }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #3E92CC, #2a7ab5)' }}
              >
                {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
