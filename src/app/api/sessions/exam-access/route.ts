import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessExam } from '@/lib/utils'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ hasAccess: false })

    const { data: profile } = await supabase
      .from('users').select('subscription_status, subscription_expires_at').eq('id', user.id).single()

    if (!profile) return NextResponse.json({ hasAccess: false })

    const isExpired = profile.subscription_expires_at && new Date(profile.subscription_expires_at) < new Date()
    const hasAccess = canAccessExam(profile.subscription_status) && !isExpired

    return NextResponse.json({ hasAccess })
  } catch {
    return NextResponse.json({ hasAccess: false })
  }
}
