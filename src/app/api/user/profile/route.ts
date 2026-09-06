import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const CALLSIGN_RE = /^[A-Z0-9]{3,12}$/
const PROFANITY_LIST = ['FUCK', 'SHIT', 'ASS', 'BITCH', 'CUNT', 'DICK', 'COCK', 'PUSSY', 'NIGGER', 'FAGGOT']

function hasProfanity(s: string): boolean {
  return PROFANITY_LIST.some(w => s.toUpperCase().includes(w))
}

// GET: check callsign availability
export async function GET(request: NextRequest) {
  const callsign = request.nextUrl.searchParams.get('checkCallsign')
  if (!callsign) return NextResponse.json({ error: 'Missing callsign' }, { status: 400 })

  const upper = callsign.toUpperCase()
  if (!CALLSIGN_RE.test(upper) || hasProfanity(upper)) {
    return NextResponse.json({ available: false, reason: 'invalid' })
  }

  const admin = createAdminClient()
  const { data } = await admin.from('users').select('id').eq('callsign', upper).maybeSingle()
  return NextResponse.json({ available: !data })
}

// PATCH: update profile fields
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await request.json() as {
      full_name?: string
      callsign?: string | null
      debrief_anonymous?: boolean
      is_cfi?: boolean
      avatar_url?: string | null
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.full_name !== undefined) updates.full_name = body.full_name?.trim() || null
    if (body.debrief_anonymous !== undefined) updates.debrief_anonymous = body.debrief_anonymous
    if (body.is_cfi !== undefined) updates.is_cfi = body.is_cfi
    if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url

    if (body.callsign !== undefined) {
      if (body.callsign === null || body.callsign === '') {
        updates.callsign = null
        updates.callsign_set_at = null
      } else {
        const upper = body.callsign.toUpperCase()
        if (!CALLSIGN_RE.test(upper)) {
          return NextResponse.json({ error: 'Invalid callsign format (3–12 alphanumeric characters)' }, { status: 400 })
        }
        if (hasProfanity(upper)) {
          return NextResponse.json({ error: 'Callsign contains prohibited content' }, { status: 400 })
        }
        // Uniqueness check (allow same user to re-save their own)
        const admin = createAdminClient()
        const { data: existing } = await admin.from('users').select('id').eq('callsign', upper).neq('id', user.id).maybeSingle()
        if (existing) return NextResponse.json({ error: 'Callsign already taken' }, { status: 409 })
        updates.callsign = upper
        updates.callsign_set_at = new Date().toISOString()
      }
    }

    const { error } = await supabase.from('users').update(updates).eq('id', user.id)
    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

    return NextResponse.json({ updated: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
