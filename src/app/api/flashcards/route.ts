import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  let query = supabase
    .from('questions')
    .select('id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, category, difficulty')
    .not('explanation', 'is', null)

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  // Fetch a pool, shuffle in JS, return 40
  const { data, error } = await query.limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const shuffled = (data || [])
    .sort(() => Math.random() - 0.5)
    .slice(0, 40)

  return NextResponse.json({ cards: shuffled })
}
