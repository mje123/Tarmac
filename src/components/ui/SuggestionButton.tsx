'use client'

import { useState } from 'react'
import { Lightbulb, X, Send, Loader2, CheckCircle, ChevronDown } from 'lucide-react'

const CATEGORIES = [
  { value: 'feature', label: '💡 Feature idea' },
  { value: 'bug', label: '🐛 Bug report' },
  { value: 'content', label: '📚 Content / question issue' },
  { value: 'community', label: '🤝 Community feature' },
  { value: 'other', label: '✉ Other' },
]

export default function SuggestionButton() {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('feature')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function reset() { setMessage(''); setCategory('feature'); setDone(false); setOpen(false) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    try {
      await fetch('/api/suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, category, page: window.location.pathname }),
      })
      setDone(true)
      setMessage('')
      setTimeout(() => { setDone(false); setOpen(false) }, 2500)
    } finally { setLoading(false) }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-all hover:bg-white/5"
        style={{ color: 'rgba(255,255,255,0.38)' }}
      >
        <Lightbulb className="w-4 h-4" />
        Suggest / Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-in shadow-2xl"
            style={{ background: '#0d1f4a', border: '1px solid rgba(255,255,255,0.1)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" style={{ color: '#FFB627' }} />
                <span className="font-semibold text-white text-sm">Share Feedback</span>
              </div>
              <button onClick={reset} className="text-white/30 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center py-10 gap-3 px-5">
                <CheckCircle className="w-10 h-10 text-green-400" />
                <p className="font-semibold text-white">Got it — thanks!</p>
                <p className="text-sm text-center" style={{ color: 'var(--text-sec)' }}>
                  Your feedback goes straight to the builder.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="p-5 space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--text-ter)' }}>What kind of feedback?</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full appearance-none text-sm pr-8"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '10px 14px', color: 'white' }}
                    >
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-ter)' }} />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--text-ter)' }}>
                    {category === 'bug' ? 'What happened? What did you expect?' :
                     category === 'content' ? 'What was wrong or missing?' :
                     'What would make TARMAC better?'}
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={
                      category === 'bug' ? 'Describe the bug, what page you were on, and what you expected...' :
                      category === 'content' ? 'Which question or explanation was wrong?...' :
                      'Your idea, no matter how big or small...'
                    }
                    rows={4}
                    required
                    className="w-full resize-none text-sm"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '12px', color: 'white' }}
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-xs" style={{ color: message.length > 800 ? '#ef4444' : 'var(--text-ter)' }}>
                      {message.length}/1000
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(255,182,39,0.15)', border: '1px solid rgba(255,182,39,0.4)', color: '#FFB627' }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Feedback
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
