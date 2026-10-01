import Link from 'next/link'
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
      <Link
        href="/review"
        className="block transition-opacity hover:opacity-80"
        style={{ borderTop: '1px solid var(--ac-rule)', paddingTop: 16, fontFamily: 'var(--ac-sans)' }}
      >
        <div className="flex items-center gap-2 mb-3" style={{ fontFamily: 'var(--ac-mono)', fontSize: 11, letterSpacing: '.03em', color: 'var(--ac-ivory-faint)' }}>
          <span style={{ width: 14, height: 1, background: 'var(--ac-brass)', display: 'inline-block' }} />
          DUE FOR REVIEW
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div style={{ fontFamily: 'var(--ac-mono)', fontSize: 32, color: 'var(--ac-brass)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{due}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--ac-ivory-faint)' }}>spaced repetition — missed questions</div>
          </div>
          <span style={{ fontFamily: 'var(--ac-mono)', fontSize: 13, color: 'var(--ac-brass)' }}>REVIEW</span>
        </div>
      </Link>
    )
  } catch {
    return null
  }
}
