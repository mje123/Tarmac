'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, Sparkles, RotateCcw } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED = [
  { label: 'VFR minimums', prompt: 'What are the VFR weather minimums for Class G airspace below 1,200 ft AGL?' },
  { label: 'Density altitude', prompt: 'Explain density altitude and why it matters for performance.' },
  { label: 'Reading a METAR', prompt: 'How do I read a METAR? Walk me through a real example.' },
  { label: 'Stall causes', prompt: 'What causes a stall and how do you recover from one?' },
  { label: 'Weight & Balance', prompt: 'How does weight and balance affect aircraft performance and safety?' },
  { label: 'Airspace classes', prompt: 'Give me a quick breakdown of airspace classes A through G.' },
  { label: 'Wake turbulence', prompt: 'What is wake turbulence and when should I worry about it?' },
  { label: 'Hypoxia', prompt: 'What is hypoxia and at what altitude does it become a concern for unpressurized aircraft?' },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

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
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error — please try again.' }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function clearChat() {
    setMessages([])
    inputRef.current?.focus()
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(62,146,204,0.3), rgba(62,146,204,0.15))', border: '1px solid rgba(62,146,204,0.3)' }}>
            <Bot className="w-5 h-5 text-[#3E92CC]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">AI Tutor</h1>
            <p className="text-xs text-white/40">Ask anything about aviation &amp; the FAA written exam</p>
          </div>
        </div>
        {!isEmpty && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New chat
          </button>
        )}
      </div>

      {/* Messages / Empty state */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, rgba(62,146,204,0.2), rgba(62,146,204,0.08))', border: '1px solid rgba(62,146,204,0.2)' }}>
              <Sparkles className="w-7 h-7 text-[#3E92CC]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Your personal flight instructor</h2>
            <p className="text-white/50 text-sm max-w-sm mb-10 leading-relaxed">
              Ask me anything — regulations, weather, airspace, aerodynamics, navigation, or how to tackle tricky exam questions.
            </p>

            <div className="grid grid-cols-2 gap-2 w-full max-w-xl">
              {SUGGESTED.map(({ label, prompt }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(prompt)}
                  className="text-left p-4 rounded-2xl transition-all hover:bg-white/8 group"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="text-white text-sm font-medium group-hover:text-[#3E92CC] transition-colors">{label}</div>
                  <div className="text-white/40 text-xs mt-0.5 line-clamp-2">{prompt}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-6 space-y-5 max-w-3xl mx-auto w-full">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1" style={{ background: 'rgba(62,146,204,0.2)', border: '1px solid rgba(62,146,204,0.2)' }}>
                    <Bot className="w-4 h-4 text-[#3E92CC]" />
                  </div>
                )}
                <div
                  className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={msg.role === 'assistant'
                    ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.07)' }
                    : { background: 'linear-gradient(135deg, #3E92CC, #2a7ab5)', color: 'white' }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(62,146,204,0.2)', border: '1px solid rgba(62,146,204,0.2)' }}>
                  <Bot className="w-4 h-4 text-[#3E92CC]" />
                </div>
                <div className="px-4 py-3.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3E92CC]/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3E92CC]/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3E92CC]/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <form
          onSubmit={e => { e.preventDefault(); sendMessage() }}
          className="flex gap-3 max-w-3xl mx-auto"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about regulations, weather, airspace, navigation..."
            disabled={loading}
            className="flex-1"
            style={{ borderRadius: '14px', padding: '12px 16px' }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #3E92CC, #2a7ab5)', boxShadow: '0 4px 15px rgba(62,146,204,0.3)' }}
          >
            {loading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Send className="w-5 h-5 text-white" />}
          </button>
        </form>
        <p className="text-center text-white/20 text-xs mt-2">Powered by Claude · Always verify critical info with your CFI or FAR/AIM</p>
      </div>
    </div>
  )
}
