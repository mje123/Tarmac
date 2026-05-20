import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentWeekStart, getAutoGame, GAME_ROTATION } from '@/app/api/game-of-week/route'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('is_admin, id').eq('id', user.id).single()
  return data?.is_admin ? { ...user, id: user.id } : null
}

export async function GET() {
  const adminUser = await assertAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const weekStart = getCurrentWeekStart()
  const admin = createAdminClient()

  const { data: overrides } = await admin
    .from('game_of_week_overrides')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(10)

  // Build next 4 weeks preview
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(weekStart + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + i * 7)
    const ws = d.toISOString().slice(0, 10)
    const override = (overrides || []).find((o) => o.week_start === ws)
    return {
      weekStart: ws,
      autoGame: getAutoGame(ws),
      override: override?.game_slug ?? null,
      game: override?.game_slug ?? getAutoGame(ws),
    }
  })

  return NextResponse.json({ weeks, overrides: overrides || [], currentWeekStart: weekStart })
}

export async function POST(req: NextRequest) {
  const adminUser = await assertAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { week_start, game_slug } = await req.json()
  if (!GAME_ROTATION.includes(game_slug)) {
    return NextResponse.json({ error: 'Invalid game_slug' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('game_of_week_overrides')
    .upsert({ week_start: week_start || getCurrentWeekStart(), game_slug, set_by: adminUser.id }, { onConflict: 'week_start' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ override: data })
}

export async function DELETE(req: NextRequest) {
  const adminUser = await assertAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { week_start } = await req.json()
  const admin = createAdminClient()
  await admin
    .from('game_of_week_overrides')
    .delete()
    .eq('week_start', week_start || getCurrentWeekStart())

  return NextResponse.json({ ok: true })
}
