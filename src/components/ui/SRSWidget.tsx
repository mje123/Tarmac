import Link from 'next/link'
import { Brain } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FEATURES } from '@/lib/features'

export default async function SRSWidget({ userId }: { userId: string }) {
  if (!FEATURES.SRS) return null

  try {
    const supabase = await createClient()
    const now = new Date().toISOString()

    // concept_mastery is the primary spaced-repetition source now (richer signal,
    // concept-grained); srs_cards stays live as a fallback for legacy (non-concept)
    // questions it still covers that concept_mastery has no equivalent for yet.
    const [{ count: conceptDue }, { count: legacyDue }] = await Promise.all([
      supabase.from('concept_mastery').select('*', { count: 'exact', head: true })
        .eq('user_id', userId).lte('next_review', now),
      supabase.from('srs_cards').select('*', { count: 'exact', head: true })
        .eq('user_id', userId).lte('due_at', now),
    ])

    const due = (conceptDue ?? 0) + (legacyDue ?? 0)
    if (due === 0) return null

    return (
      <Link href="/review" className="block glass-card p-4 mb-4 transition-all hover:scale-[1.01]" style={{ borderColor: 'rgba(62,146,204,0.25)', background: 'linear-gradient(135deg, rgba(62,146,204,0.08) 0%, rgba(62,146,204,0.03) 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(62,146,204,0.15)' }}>
            <Brain className="w-4 h-4 text-[#3E92CC]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold text-sm">
              {due} review{due !== 1 ? 's' : ''} due today
            </div>
            <div className="text-white/45 text-xs">Spaced repetition — questions you missed</div>
          </div>
          <div className="text-[#3E92CC] text-sm font-semibold whitespace-nowrap">Review →</div>
        </div>
      </Link>
    )
  } catch {
    return null
  }
}
