import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = createAdminClient()

    const [routeRes, commentsRes] = await Promise.all([
      admin
        .from('route_critiques')
        .select(`id, title, departure, destination, waypoints, altitude, description, date_of_flight, created_at, user_id, users!inner(callsign, full_name)`)
        .eq('id', id)
        .eq('is_removed', false)
        .single(),
      admin
        .from('route_critique_comments')
        .select(`id, body, created_at, user_id, users!inner(callsign, full_name, is_cfi, cfi_verified)`)
        .eq('route_id', id)
        .eq('is_removed', false)
        .order('created_at', { ascending: true }),
    ])

    if (routeRes.error || !routeRes.data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ route: routeRes.data, comments: commentsRes.data || [] })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { body } = await request.json() as { body: string }
    if (!body?.trim()) return NextResponse.json({ error: 'Comment is required' }, { status: 400 })
    if (body.length > 2000) return NextResponse.json({ error: 'Comment too long' }, { status: 400 })

    const admin = createAdminClient()
    const { data: comment, error } = await admin
      .from('route_critique_comments')
      .insert({ route_id: id, user_id: user.id, body: body.trim() })
      .select('id, body, created_at, user_id, users!inner(callsign, full_name, is_cfi, cfi_verified)')
      .single()

    if (error) return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 })
    return NextResponse.json({ comment })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { commentId } = await request.json() as { commentId: string }
    const admin = createAdminClient()

    const { data: comment } = await admin
      .from('route_critique_comments')
      .select('user_id')
      .eq('id', commentId)
      .single()

    if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: profile } = await admin.from('users').select('is_admin').eq('id', user.id).single()
    if (comment.user_id !== user.id && !profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await admin.from('route_critique_comments').update({ is_removed: true }).eq('id', commentId)
    return NextResponse.json({ deleted: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
