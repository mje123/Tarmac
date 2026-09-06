import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// GET — every concept with its archetype count and approved-question count, for the
// admin "Question Engine" tab. Concepts themselves are defined in code
// (src/lib/generation/concepts.ts) and seeded via scripts/seed-concepts.js, not
// created here — this endpoint is read/trigger only, so the DB and the source of
// truth in git never drift apart.
export async function GET() {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: concepts, error } = await admin
    .from('concepts')
    .select('id, slug, name, exam_type, category, acs_area, is_active')
    .order('exam_type', { ascending: true })
    .order('category', { ascending: true })

  if (error) {
    // Table not created yet — surface a clear, actionable message instead of a raw 500.
    if (error.message?.includes('concepts')) {
      return NextResponse.json({ concepts: [], notReady: true, error: error.message })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const conceptIds = (concepts || []).map(c => c.id)
  const [{ data: archetypeRows }, { data: questionRows }] = await Promise.all([
    admin.from('question_archetypes').select('concept_id').in('concept_id', conceptIds),
    admin.from('questions').select('concept_id, validation_status').in('concept_id', conceptIds),
  ])

  const archetypeCounts = new Map<string, number>()
  for (const row of archetypeRows || []) {
    archetypeCounts.set(row.concept_id, (archetypeCounts.get(row.concept_id) ?? 0) + 1)
  }
  const approvedCounts = new Map<string, number>()
  for (const row of questionRows || []) {
    if (row.validation_status === 'approved') {
      approvedCounts.set(row.concept_id, (approvedCounts.get(row.concept_id) ?? 0) + 1)
    }
  }

  const enriched = (concepts || []).map(c => ({
    ...c,
    archetypeCount: archetypeCounts.get(c.id) ?? 0,
    approvedQuestionCount: approvedCounts.get(c.id) ?? 0,
  }))

  return NextResponse.json({ concepts: enriched })
}
