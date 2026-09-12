import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH: update profile fields
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await request.json() as {
      full_name?: string
      debrief_anonymous?: boolean
      is_cfi?: boolean
      avatar_url?: string | null
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.full_name !== undefined) updates.full_name = body.full_name?.trim() || null
    if (body.debrief_anonymous !== undefined) updates.debrief_anonymous = body.debrief_anonymous
    if (body.is_cfi !== undefined) updates.is_cfi = body.is_cfi
    if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url

    const { error } = await supabase.from('users').update(updates).eq('id', user.id)
    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

    return NextResponse.json({ updated: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
