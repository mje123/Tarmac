import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndSaveQuestions, type Category } from '@/lib/questionGenerator'
import { SupabaseClient } from '@supabase/supabase-js'

const LOW_POOL_THRESHOLD = 20

async function maybeRefillCategory(category: string) {
  try {
    const admin = createAdminClient()
    const { count } = await admin
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('category', category)

    if ((count ?? 0) < LOW_POOL_THRESHOLD) {
      generateAndSaveQuestions(category as Category, 20).catch(() => {})
    }
  } catch {}
}

async function getHistoryIds(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data: sessions } = await supabase
    .from('test_sessions')
    .select('id')
    .eq('user_id', userId)
  if (!sessions || sessions.length === 0) return []

  const { data: answers } = await supabase
    .from('test_answers')
    .select('question_id')
    .in('session_id', sessions.map(s => s.id))
  return [...new Set(answers?.map(a => a.question_id as string) || [])]
}

async function runQuery(
  supabase: SupabaseClient,
  userId: string,
  category: string | null,
  categories: string[],
  weak: string | null,
  savedOnly: boolean,
  excludes: string[]
): Promise<{ data: Record<string, unknown>[] | null; empty?: boolean; error?: unknown }> {
  let query = supabase.from('questions').select('*')

  if (savedOnly) {
    const { data: saved } = await supabase
      .from('saved_questions')
      .select('question_id')
      .eq('user_id', userId)
    const savedIds = (saved || []).map(r => r.question_id as string)
    if (savedIds.length === 0) return { data: null, empty: true }
    query = query.in('id', savedIds)
  } else if (categories.length > 0) {
    query = query.in('category', categories)
  } else if (category) {
    query = query.eq('category', category)
  } else if (weak) {
    const { data: progress } = await supabase
      .from('user_progress')
      .select('category')
      .eq('user_id', userId)
      .lt('accuracy_percentage', 70)
      .order('accuracy_percentage', { ascending: true })
      .limit(3)
    if (progress && progress.length > 0) {
      query = query.in('category', progress.map(p => p.category as string))
    }
  }

  if (excludes.length > 0) {
    query = query.not('id', 'in', `(${excludes.join(',')})`)
  }

  const { data, error } = await query
  return { data: data as Record<string, unknown>[] | null, error }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const categories = searchParams.getAll('categories')
    const weak = searchParams.get('weak')
    const savedOnly = searchParams.get('saved') === '1'
    const excludeIds = searchParams.getAll('exclude')

    // Trigger refill checks in background
    if (categories.length > 0) categories.forEach(c => maybeRefillCategory(c))
    else if (category) maybeRefillCategory(category)

    // Get all question IDs this user has ever answered (cross-session dedup)
    const historyIds = await getHistoryIds(supabase, user.id)
    const fullExcludes = [...new Set([...excludeIds, ...historyIds])]

    // Try showing only unseen questions first
    let result = await runQuery(supabase, user.id, category, categories, weak, savedOnly, fullExcludes)

    if (result.empty) return NextResponse.json({ question: null, empty: true })
    if (result.error) throw result.error

    // If user has seen every question in this pool, cycle through from scratch
    if (!result.data || result.data.length === 0) {
      result = await runQuery(supabase, user.id, category, categories, weak, savedOnly, excludeIds)
      if (result.empty) return NextResponse.json({ question: null, empty: true })
      if (result.error) throw result.error
    }

    const questions = result.data
    if (!questions || questions.length === 0) {
      return NextResponse.json({ question: null })
    }

    const randomIdx = Math.floor(Math.random() * questions.length)
    return NextResponse.json({ question: questions[randomIdx] })
  } catch (error) {
    console.error('Question fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
  }
}
