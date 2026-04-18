import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndSaveQuestions, type Category } from '@/lib/questionGenerator'

const LOW_POOL_THRESHOLD = 20

async function maybeRefillCategory(category: string) {
  try {
    const admin = createAdminClient()
    const { count } = await admin
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('category', category)

    if ((count ?? 0) < LOW_POOL_THRESHOLD) {
      // Fire-and-forget: generate 20 more questions for this category
      generateAndSaveQuestions(category as Category, 20).catch(() => {})
    }
  } catch {}
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
    const excludeIds = searchParams.getAll('exclude')

    let query = supabase.from('questions').select('*')

    if (categories.length > 0) {
      query = query.in('category', categories)
      categories.forEach(c => maybeRefillCategory(c))
    } else if (category) {
      query = query.eq('category', category)
      // Check if this category needs a refill (background)
      maybeRefillCategory(category)
    } else if (weak) {
      const { data: progress } = await supabase
        .from('user_progress')
        .select('category')
        .eq('user_id', user.id)
        .lt('accuracy_percentage', 70)
        .order('accuracy_percentage', { ascending: true })
        .limit(3)

      if (progress && progress.length > 0) {
        query = query.in('category', progress.map(p => p.category))
      }
    }

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`)
    }

    const { data: questions, error } = await query

    if (error) throw error

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
