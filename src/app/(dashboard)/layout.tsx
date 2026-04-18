import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Sidebar from '@/components/layout/Sidebar'
import { User } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  let { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!userProfile) {
    const admin = createAdminClient()
    const { data: created } = await admin
      .from('users')
      .upsert({
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Pilot',
        subscription_status: 'free',
      })
      .select('*')
      .single()
    userProfile = created
  }

  if (!userProfile) {
    // Fallback: render with minimal profile so we don't redirect loop
    userProfile = {
      id: authUser.id,
      email: authUser.email ?? '',
      full_name: authUser.user_metadata?.full_name || 'Pilot',
      subscription_status: 'free',
      subscription_expires_at: null,
      is_admin: false,
      created_at: new Date().toISOString(),
    }
  }

  return (
    <div className="min-h-screen bg-[#0A2463] flex">
      <Sidebar user={userProfile as User} />
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
