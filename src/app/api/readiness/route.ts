import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getReadiness } from '@/lib/readinessServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
    const cookieVal = request.cookies.get('tarmac-exam-type')?.value
    const examType = profile?.is_admin && cookieVal === 'ifr' ? 'ifr' : 'ppl'

    const result = await getReadiness(supabase, user.id, examType)
    return NextResponse.json(result)
  } catch (error) {
    console.error('readiness GET error:', error)
    return NextResponse.json({ error: 'Failed to compute readiness' }, { status: 500 })
  }
}
