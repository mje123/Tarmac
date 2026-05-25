import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const GAME_ROTATION = ['altitude', 'situations', 'quiz'] as const
export type GameSlug = typeof GAME_ROTATION[number]

// Returns the Monday (UTC) of the current week as a YYYY-MM-DD string
export function getCurrentWeekStart(): string {
  const now = new Date()
  const day = now.getUTCDay() || 7 // treat Sunday as 7
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - (day - 1))
  return monday.toISOString().slice(0, 10)
}

// Weeks elapsed since 2024-01-01 (a known Monday)
function getWeekSlot(weekStart: string): number {
  const EPOCH = new Date('2024-01-01T00:00:00Z')
  const d = new Date(weekStart + 'T00:00:00Z')
  return Math.floor((d.getTime() - EPOCH.getTime()) / (7 * 24 * 60 * 60 * 1000))
}

export function getAutoGame(weekStart: string): GameSlug {
  return GAME_ROTATION[((getWeekSlot(weekStart) % GAME_ROTATION.length) + GAME_ROTATION.length) % GAME_ROTATION.length]
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const weekStart = getCurrentWeekStart()
  const autoGame = getAutoGame(weekStart)

  const admin = createAdminClient()
  const { data: override } = await admin
    .from('game_of_week_overrides')
    .select('game_slug')
    .eq('week_start', weekStart)
    .single()

  const game = (override?.game_slug as GameSlug) ?? autoGame
  const isOverride = !!override

  return NextResponse.json({ game, isOverride, weekStart, autoGame })
}
