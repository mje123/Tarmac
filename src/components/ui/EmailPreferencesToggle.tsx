'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, MailX, Loader2 } from 'lucide-react'

export default function EmailPreferencesToggle({ userId, marketingEmails }: { userId: string; marketingEmails: boolean }) {
  const [enabled, setEnabled] = useState(marketingEmails)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    const next = !enabled
    const { error } = await supabase.from('users').update({
      marketing_emails: next,
      unsubscribed_at: next ? null : new Date().toISOString(),
    }).eq('id', userId)
    if (!error) setEnabled(next)
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {enabled
          ? <Mail className="w-4 h-4 text-green-400" />
          : <MailX className="w-4 h-4 text-white/30" />}
        <div>
          <div className="text-sm text-white font-medium">Weekly progress emails</div>
          <div className="text-xs text-white/40 mt-0.5">
            {enabled ? 'You\'ll receive weekly stats every Friday + tips.' : 'You\'re unsubscribed from marketing emails.'}
          </div>
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-white/10'}`}
      >
        {loading
          ? <Loader2 className="w-3 h-3 text-white animate-spin absolute top-1.5 left-1.5" />
          : <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200" style={{ left: enabled ? 'calc(100% - 22px)' : '2px' }} />}
      </button>
    </div>
  )
}
