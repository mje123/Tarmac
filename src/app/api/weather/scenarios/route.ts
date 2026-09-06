import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await request.json()
    const { title, metar, taf, pireps, notams, route, context } = body as {
      title: string; metar?: string; taf?: string; pireps?: string
      notams?: string; route?: string; context?: string
    }

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    if (!metar?.trim() && !context?.trim()) return NextResponse.json({ error: 'Provide at least a METAR or context' }, { status: 400 })

    const admin = createAdminClient()
    const { data: scenario, error } = await admin.from('weather_scenarios').insert({
      user_id: user.id,
      title: title.trim(),
      metar: metar?.trim() || null,
      taf: taf?.trim() || null,
      pireps: pireps?.trim() || null,
      notams: notams?.trim() || null,
      route: route?.trim() || null,
      context: context?.trim() || null,
    }).select('*').single()

    if (error) return NextResponse.json({ error: 'Failed to create scenario' }, { status: 500 })
    return NextResponse.json({ scenario })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
