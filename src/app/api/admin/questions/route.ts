import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  return !!profile?.is_admin
}

// GET — browse/search the question bank for the admin review UI. Supports filtering
// by validation_status, exam_type, category, and a free-text search over
// question_text, so an admin can actually find something to approve/reject/edit
// instead of only ever seeing the newest generation-log rows.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!(await assertAdmin(supabase))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const examType = searchParams.get('examType')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 100)
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0)

    let query = supabase
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, explanation, reference, exam_type, concept_id, cognitive_level, scenario_type, distractor_rationale, common_trap, validation_status, novelty_key, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('validation_status', status)
    if (examType) query = query.eq('exam_type', examType)
    if (category) query = query.eq('category', category)
    if (search) query = query.ilike('question_text', `%${search}%`)

    const { data, error, count } = await query
    if (error) throw error
    return NextResponse.json({ questions: data, total: count })
  } catch (error) {
    console.error('Admin questions list error:', error)
    return NextResponse.json({ error: 'Failed to list questions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { data, error } = await supabase.from('questions').insert(body).select().single()

    if (error) throw error
    return NextResponse.json({ question: data })
  } catch (error) {
    console.error('Admin question create error:', error)
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
  }
}

const EDITABLE_FIELDS = [
  'question_text', 'option_a', 'option_b', 'option_c', 'option_d',
  'correct_answer', 'category', 'difficulty', 'explanation', 'reference',
  'distractor_rationale', 'common_trap',
] as const

// PATCH — change a question's validation_status (approve / reject / disable) and/or
// edit its content, from the admin question browser. A 'rejected' question is
// filtered out of student-facing queries by validation_status, without deleting the
// row (keeps the generation_log traceability intact).
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { id, validation_status } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (validation_status !== undefined) {
      if (!['approved', 'rejected', 'legacy'].includes(validation_status)) {
        return NextResponse.json({ error: 'Invalid validation_status' }, { status: 400 })
      }
      updates.validation_status = validation_status
    }
    for (const field of EDITABLE_FIELDS) {
      if (body[field] !== undefined) updates[field] = body[field]
    }
    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

    const { error } = await supabase.from('questions').update(updates).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update question' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await request.json()
    await supabase.from('questions').delete().eq('id', id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }
}
