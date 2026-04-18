import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ isPaid: false })

    const { data: profile } = await supabase
      .from('users')
      .select('subscription_status, subscription_expires_at')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ isPaid: false })

    const isFree = profile.subscription_status === 'free' || !profile.subscription_status
    const isExpired = profile.subscription_expires_at && new Date(profile.subscription_expires_at) < new Date()

    return NextResponse.json({ isPaid: !isFree && !isExpired })
  } catch {
    return NextResponse.json({ isPaid: false })
  }
}
