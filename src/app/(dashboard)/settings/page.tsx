import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User } from '@/types'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase.from('users').select('*').eq('id', authUser.id).single()

  const user: User = userProfile ?? {
    id: authUser.id,
    email: authUser.email ?? '',
    full_name: authUser.user_metadata?.full_name || 'Pilot',
    callsign: null,
    callsign_set_at: null,
    debrief_anonymous: false,
    is_cfi: false,
    cfi_verified: false,
    avatar_url: null,
    subscription_status: 'free',
    subscription_expires_at: null,
    stripe_customer_id: null,
    is_admin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return <SettingsClient user={user} />
}
