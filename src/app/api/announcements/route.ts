import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ announcements: [] })

  const admin = createAdminClient()
  const { data } = await admin
    .from('announcements')
    .select('id, title, message, type, created_at')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json({ announcements: data || [] })
}
