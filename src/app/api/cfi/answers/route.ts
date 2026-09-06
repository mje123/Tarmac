import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { questionId, body } = await request.json() as { questionId: string; body: string }
    if (!questionId || !body?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (body.length > 5000) return NextResponse.json({ error: 'Answer too long' }, { status: 400 })

    const admin = createAdminClient()

    // Check if answerer is a verified CFI
    const { data: profile } = await supabase.from('users').select('cfi_verified').eq('id', user.id).single()
    const isCFI = profile?.cfi_verified === true

    const { data: answer, error } = await admin
      .from('cfi_answers')
      .insert({ question_id: questionId, user_id: user.id, body: body.trim(), is_cfi_answer: isCFI })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: 'Failed to post answer' }, { status: 500 })

    // Increment answer_count
    const { data: q } = await admin.from('cfi_questions').select('answer_count').eq('id', questionId).single()
    await admin.from('cfi_questions').update({ answer_count: (q?.answer_count || 0) + 1 }).eq('id', questionId)

    return NextResponse.json({ answer })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Accept an answer (question author only)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { answerId, questionId } = await request.json() as { answerId: string; questionId: string }
    const admin = createAdminClient()

    // Verify ownership of question
    const { data: q } = await admin.from('cfi_questions').select('user_id').eq('id', questionId).single()
    if (q?.user_id !== user.id) return NextResponse.json({ error: 'Not question author' }, { status: 403 })

    // Clear other accepted answers, set this one
    await admin.from('cfi_answers').update({ is_accepted: false }).eq('question_id', questionId)
    await admin.from('cfi_answers').update({ is_accepted: true }).eq('id', answerId)
    await admin.from('cfi_questions').update({ is_resolved: true }).eq('id', questionId)

    return NextResponse.json({ accepted: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
