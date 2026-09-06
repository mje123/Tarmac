import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { scenarioId, vote, reasoning } = await request.json() as {
      scenarioId: string; vote: 'go' | 'nogo'; reasoning?: string
    }
    if (!scenarioId || !vote) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const admin = createAdminClient()

    // Get existing vote
    const { data: existing } = await admin.from('weather_votes')
      .select('id,vote').eq('scenario_id', scenarioId).eq('user_id', user.id).maybeSingle()

    const { data: scenario } = await admin.from('weather_scenarios')
      .select('go_count,nogo_count').eq('id', scenarioId).single()

    let go = scenario?.go_count || 0
    let nogo = scenario?.nogo_count || 0

    if (existing) {
      // Update existing vote
      if (existing.vote === 'go') go = Math.max(0, go - 1)
      else nogo = Math.max(0, nogo - 1)

      if (vote === 'go') go++
      else nogo++

      await admin.from('weather_votes').update({ vote, reasoning: reasoning || null }).eq('id', existing.id)
    } else {
      // New vote
      if (vote === 'go') go++
      else nogo++

      await admin.from('weather_votes').insert({
        scenario_id: scenarioId, user_id: user.id, vote, reasoning: reasoning || null,
      })
    }

    await admin.from('weather_scenarios').update({
      go_count: go, nogo_count: nogo,
      comment_count: go + nogo,
    }).eq('id', scenarioId)

    return NextResponse.json({ vote, go_count: go, nogo_count: nogo })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
