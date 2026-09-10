import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectiveExamType } from '@/lib/examType'

// Lets the client correct its exam-type context when it has no local record of the
// user's choice — a new device, cleared storage, or an incognito window. Without
// this, ExamTypeProvider had no way back to the truth and silently stayed on the
// 'ppl' default regardless of the account's real users.preferred_exam_type.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const examType = await getEffectiveExamType(supabase, user.id, request.cookies.get('tarmac-exam-type')?.value)
  return NextResponse.json({ examType })
}
