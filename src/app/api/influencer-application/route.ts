import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, email, instagram_handle, tiktok_handle, youtube_handle, other_platforms, requested_code, audience_size, why_tarmac } = body

  if (!name || !email || !requested_code) {
    return NextResponse.json({ error: 'name, email, and requested_code are required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('influencer_applications').insert({
    name,
    email,
    instagram_handle: instagram_handle || null,
    tiktok_handle: tiktok_handle || null,
    youtube_handle: youtube_handle || null,
    other_platforms: other_platforms || null,
    requested_code: requested_code.toUpperCase(),
    audience_size: audience_size || null,
    why_tarmac: why_tarmac || null,
  })

  if (error) {
    console.error('influencer_applications insert failed:', error.message)
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
