import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate, getSubscriptionLabel } from '@/lib/utils'
import { User } from '@/types'
import SettingsClient from '@/components/ui/SettingsClient'
import { Settings, CreditCard, User as UserIcon, Shield } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  const user: User = userProfile ?? {
    id: authUser.id,
    email: authUser.email ?? '',
    full_name: authUser.user_metadata?.full_name || 'Pilot',
    subscription_status: 'free',
    subscription_expires_at: null,
    stripe_customer_id: null,
    is_admin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const isExpired = user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date()
  const hasBilling = !!user.stripe_customer_id

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-7 h-7 text-white/60" />
        <h1 className="text-3xl font-bold text-white">Settings</h1>
      </div>

      {/* Account Info */}
      <div className="glass-card p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="w-4 h-4 text-[#3E92CC]" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Account</h2>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-white/50 text-sm">Name</span>
            <span className="text-white text-sm font-medium">{user.full_name || '—'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-white/50 text-sm">Email</span>
            <span className="text-white text-sm font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-white/50 text-sm">Member Since</span>
            <span className="text-white text-sm font-medium">{formatDate(user.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="glass-card p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-[#FFB627]" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Subscription</h2>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-white/50 text-sm">Plan</span>
            <span className="text-white text-sm font-medium">{getSubscriptionLabel(user.subscription_status)}</span>
          </div>
          {user.subscription_expires_at && (
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-white/50 text-sm">Expires</span>
              <span className={`text-sm font-medium ${isExpired ? 'text-red-400' : 'text-white'}`}>
                {formatDate(user.subscription_expires_at)} {isExpired && '(expired)'}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          {user.subscription_status === 'free' ? (
            <SettingsClient hasBilling={false} isUpgrade />
          ) : (
            <SettingsClient hasBilling={hasBilling} />
          )}
        </div>
      </div>

      {/* Admin badge */}
      {user.is_admin && (
        <div className="glass-card p-4 flex items-center gap-3">
          <Shield className="w-5 h-5 text-[#FFB627]" />
          <div>
            <div className="text-white text-sm font-semibold">Admin Account</div>
            <div className="text-white/40 text-xs">You have admin access to this platform.</div>
          </div>
          <a href="/admin" className="ml-auto text-xs text-[#FFB627] hover:underline">Go to Admin →</a>
        </div>
      )}
    </div>
  )
}
