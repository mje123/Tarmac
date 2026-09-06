import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { accidentId, body } = await request.json() as { accidentId: string; body: string }
    if (!accidentId || !body?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (body.length > 1000) return NextResponse.json({ error: 'Comment too long (1000 char max)' }, { status: 400 })

    // Get user profile for display_name and anonymous preference
    const { data: profile } = await supabase
      .from('users')
      .select('callsign, full_name, debrief_anonymous')
      .eq('id', user.id)
      .single()

    const isAnon = profile?.debrief_anonymous ?? false
    const displayName = isAnon
      ? 'Anonymous Pilot'
      : (profile?.callsign || profile?.full_name?.split(' ')[0] || 'Pilot')

    // Moderate with Claude
    const modResp = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/accidents/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    const mod = await modResp.json() as { approved: boolean; reason: string | null }
    if (!mod.approved) {
      return NextResponse.json({ error: `Comment not approved: ${mod.reason || 'Content policy violation'}` }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: comment, error } = await admin
      .from('accident_comments')
      .insert({
        accident_id: accidentId,
        user_id: user.id,
        body: body.trim(),
        display_name: displayName,
        is_anonymous: isAnon,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Comment insert error:', error)
      return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 })
    }

    return NextResponse.json({ comment })
  } catch (err) {
    console.error('Comment route error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { commentId } = await request.json() as { commentId: string }
    if (!commentId) return NextResponse.json({ error: 'Missing commentId' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin
      .from('accident_comments')
      .update({ is_removed: true })
      .eq('id', commentId)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    return NextResponse.json({ deleted: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
