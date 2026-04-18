'use client'

import { useState } from 'react'
import { Bug, X, Send, Loader2, CheckCircle } from 'lucide-react'

export default function BugReportButton() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    try {
      await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, page: window.location.pathname }),
      })
      setDone(true)
      setMessage('')
      setTimeout(() => { setDone(false); setOpen(false) }, 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
      >
        <Bug className="w-4 h-4" />
        Report a Bug
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-fade-in" style={{ background: '#0d1f4a', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-[#3E92CC]" />
                <h2 className="font-semibold text-white">Report a Bug</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center py-6 gap-3 text-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
                <p className="text-white font-medium">Thanks! We got your report.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">What went wrong?</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Describe what happened, what you expected, and what page you were on..."
                    rows={4}
                    required
                    className="w-full resize-none text-sm"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '12px', color: 'white' }}
                  />
                </div>
                <p className="text-xs text-white/30">Your current page is automatically included.</p>
                <button type="submit" disabled={loading || !message.trim()} className="btn-primary w-full justify-center py-2.5 text-sm">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Send Report</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
