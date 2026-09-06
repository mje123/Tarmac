import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// GET — recent generation attempts (approved and rejected) joined with concept name,
// so an admin can see exactly what the pipeline produced and why anything was
// rejected. This is the visibility the research/plan flagged as entirely missing.
export async function GET(request: NextRequest) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)
  const conceptSlug = searchParams.get('concept')

  let conceptId: string | null = null
  if (conceptSlug) {
    const { data } = await admin.from('concepts').select('id').eq('slug', conceptSlug).single()
    conceptId = data?.id ?? null
  }

  let query = admin
    .from('question_generation_log')
    .select('id, concept_id, archetype_id, model, prompt_version, validation_result, rejection_reason, created_at, concepts(name, slug)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (conceptId) query = query.eq('concept_id', conceptId)

  const { data, error } = await query
  if (error) {
    if (error.message?.includes('question_generation_log')) {
      return NextResponse.json({ entries: [], notReady: true, error: error.message })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entries: data })
}
