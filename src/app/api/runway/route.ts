import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateRunway } from '@/lib/runwayServer'

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

async function getExamType(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, request: NextRequest): Promise<'ppl' | 'ifr'> {
  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', userId).single()
  const cookieVal = request.cookies.get('tarmac-exam-type')?.value
  return profile?.is_admin && cookieVal === 'ifr' ? 'ifr' : 'ppl'
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const examType = await getExamType(supabase, user.id, request)
    const result = await getOrCreateRunway(supabase, user.id, examType)
    return NextResponse.json(result)
  } catch (error) {
    console.error('runway GET error:', error)
    return NextResponse.json({ error: 'Failed to load runway' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { examDate, markTodayComplete } = await request.json()

    if (markTodayComplete) {
      await supabase.from('daily_plan_items')
        .update({ completed: true })
        .eq('user_id', user.id)
        .eq('plan_date', todayDateString())
      return NextResponse.json({ ok: true })
    }

    const { data: existing } = await supabase
      .from('study_plan_state')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      await supabase.from('study_plan_state').update({
        exam_date: examDate || null,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id)
    } else {
      await supabase.from('study_plan_state').insert({ user_id: user.id, exam_date: examDate || null })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('runway POST error:', error)
    return NextResponse.json({ error: 'Failed to update runway' }, { status: 500 })
  }
}
