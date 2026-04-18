import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('saved_questions')
    .select('question_id')
    .eq('user_id', user.id)

  if (error) {
    console.error('[saved questions GET]', error)
    return NextResponse.json({ savedIds: [], error: error.message })
  }

  return NextResponse.json({ savedIds: (data || []).map((r: { question_id: string }) => r.question_id) })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { questionId } = await req.json()
  const { error } = await supabase
    .from('saved_questions')
    .upsert({ user_id: user.id, question_id: questionId }, { onConflict: 'user_id,question_id' })

  if (error) {
    console.error('[saved questions POST]', error)
    return NextResponse.json({ saved: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ saved: true })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const questionId = body?.questionId
  if (!questionId) return NextResponse.json({ error: 'Missing questionId' }, { status: 400 })

  const { error } = await supabase
    .from('saved_questions')
    .delete()
    .eq('user_id', user.id)
    .eq('question_id', questionId)

  if (error) {
    console.error('[saved questions DELETE]', error)
    return NextResponse.json({ saved: true, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ saved: false })
}
