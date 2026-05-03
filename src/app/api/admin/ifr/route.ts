import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndSaveIFRQuestions, IFR_CATEGORIES, type IFRCategory } from '@/lib/ifrQuestionGenerator'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// GET — stats about IFR questions
export async function GET() {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const stats: Record<string, number> = {}
  let hasColumn = true

  for (const cat of IFR_CATEGORIES) {
    const { count, error } = await admin
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('category', cat)
      .eq('exam_type', 'ifr')

    if (error?.message?.includes('exam_type')) {
      hasColumn = false
      break
    }
    stats[cat] = count ?? 0
  }

  return NextResponse.json({ stats, hasColumn, migrationSql: hasColumn ? null : `ALTER TABLE questions ADD COLUMN IF NOT EXISTS exam_type TEXT NOT NULL DEFAULT 'ppl';\nCREATE INDEX IF NOT EXISTS idx_questions_exam_type ON questions(exam_type);` })
}

// POST — seed IFR questions for a category (or all)
export async function POST(request: NextRequest) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { category, count = 20 } = await request.json().catch(() => ({}))

  const targets: IFRCategory[] = category ? [category as IFRCategory] : [...IFR_CATEGORIES]
  const results: Record<string, number | string> = {}

  for (const cat of targets) {
    try {
      const n = await generateAndSaveIFRQuestions(cat, count)
      results[cat] = n
    } catch (e) {
      results[cat] = `error: ${e instanceof Error ? e.message : String(e)}`
    }
  }

  return NextResponse.json({ results })
}
