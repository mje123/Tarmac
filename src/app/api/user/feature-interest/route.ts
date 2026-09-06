import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { feature } = await request.json() as { feature: string }
    if (!feature) return NextResponse.json({ error: 'Missing feature' }, { status: 400 })

    const admin = createAdminClient()
    await admin.from('feature_interest').insert({ user_id: user.id, feature }).onConflict('user_id, feature').ignore()

    return NextResponse.json({ registered: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
