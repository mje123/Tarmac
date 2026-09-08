import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getReadiness } from '@/lib/readinessServer'
import { getEffectiveExamType } from '@/lib/examType'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const examType = await getEffectiveExamType(supabase, user.id, request.cookies.get('tarmac-exam-type')?.value)

    const result = await getReadiness(supabase, user.id, examType)
    return NextResponse.json(result)
  } catch (error) {
    console.error('readiness GET error:', error)
    return NextResponse.json({ error: 'Failed to compute readiness' }, { status: 500 })
  }
}
