import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateValidatedQuestion } from '@/lib/generation'
import { CONCEPTS, type ConceptSlug } from '@/lib/generation/concepts'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// POST — manually trigger one generate→validate→(store) attempt for a concept, so an
// admin can see the pipeline work without waiting for the background low-pool refill
// in api/questions/random. Every attempt is logged to question_generation_log
// regardless of outcome — a rejection here is expected and useful information, not
// an error.
export async function POST(request: NextRequest) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await request.json().catch(() => ({}))
  if (!slug || !(slug in CONCEPTS)) {
    return NextResponse.json({ error: 'Unknown concept slug' }, { status: 400 })
  }

  try {
    const outcome = await generateValidatedQuestion(slug as ConceptSlug)
    return NextResponse.json(outcome)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
