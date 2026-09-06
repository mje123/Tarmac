import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { title, body, category } = await request.json() as { title: string; body: string; category?: string }
    if (!title?.trim() || !body?.trim()) return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
    if (title.length > 200) return NextResponse.json({ error: 'Title too long' }, { status: 400 })
    if (body.length > 3000) return NextResponse.json({ error: 'Body too long' }, { status: 400 })

    const admin = createAdminClient()
    const { data: question, error } = await admin
      .from('cfi_questions')
      .insert({ user_id: user.id, title: title.trim(), body: body.trim(), category: category || null })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: 'Failed to post question' }, { status: 500 })
    return NextResponse.json({ question })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
