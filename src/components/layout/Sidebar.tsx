'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types'
import { cn } from '@/lib/utils'
import { Settings, LogOut, Shield, Menu, X } from 'lucide-react'
import BugReportButton from '@/components/ui/BugReportButton'
import SuggestionButton from '@/components/ui/SuggestionButton'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/practice', label: 'Practice' },
  { href: '/exam', label: 'Practice Exam' },
  { href: '/saved', label: 'Saved Questions' },
  { href: '/chat', label: 'AI Tutor' },
]

interface SidebarProps { user: User }

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isFree = user.subscription_status === 'free'
  const firstName = user.full_name?.split(' ')[0] || 'Pilot'
  const lastName = user.full_name?.split(' ').slice(1).join(' ') || ''
  const initials = (firstName[0] || '') + (lastName[0] || '')

  const navContent = (
    <div className="flex flex-col h-full" style={{ background: '#080E1C' }}>
      {/* Wordmark */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #141F35' }}>
        <span className="text-[15px] font-bold text-white tracking-[0.12em]">TARMAC</span>
        <button onClick={() => setOpen(false)} className="md:hidden text-white/30 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center h-9 pl-5 pr-4 text-sm font-medium transition-colors border-l-2',
                active
                  ? 'border-[#FDB022] text-white'
                  : 'border-transparent text-[#6B7FA3] hover:text-white hover:border-white/20'
              )}
              style={active ? { background: 'rgba(253,176,34,0.06)' } : undefined}
            >
              {label}
            </Link>
          )
        })}

        {user.is_admin && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-2.5 h-9 pl-5 pr-4 text-sm font-medium transition-colors border-l-2 mt-2',
              pathname.startsWith('/admin')
                ? 'border-[#FDB022] text-white'
                : 'border-transparent text-[#6B7FA3] hover:text-white hover:border-white/20'
            )}
            style={pathname.startsWith('/admin') ? { background: 'rgba(253,176,34,0.06)' } : undefined}
          >
            <Shield className="w-3.5 h-3.5 text-[#FDB022]" />
            Admin
          </Link>
        )}
      </nav>

      {/* Upgrade block for free users */}
      {isFree && (
        <div className="mx-3 mb-3 p-3 rounded" style={{ background: '#0D1525', border: '1px solid #1E2D45' }}>
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#4A5568] mb-1">Free Trial</div>
          <div className="text-xs font-bold text-[#EF4444] mb-2.5">Questions limited — upgrade to unlock all 1,400+</div>
          <Link
            href="/upgrade"
            className="block w-full text-center py-2 text-xs font-bold tracking-wide rounded-sm transition-opacity hover:opacity-90"
            style={{ background: '#FDB022', color: '#080E1C' }}
          >
            UNLOCK FULL ACCESS
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 pb-3 space-y-0.5" style={{ borderTop: '1px solid #141F35', paddingTop: '12px' }}>
        {/* User row */}
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-sm flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: '#1A2540', color: '#94A3B8' }}>
            {initials.toUpperCase() || 'P'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">{user.full_name || 'Pilot'}</div>
            {!isFree && (
              <div className="text-[10px] text-[#4A5568] capitalize">{user.subscription_status.replace('_', ' ')}</div>
            )}
          </div>
        </div>

        <Link href="/settings" className="flex items-center gap-2.5 h-8 px-3 text-sm text-[#6B7FA3] hover:text-white transition-colors rounded-sm hover:bg-white/[0.03]">
          <Settings className="w-3.5 h-3.5" />
          Settings
        </Link>

        <SuggestionButton />
        <BugReportButton />

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 h-8 px-3 text-sm text-[#6B7FA3] hover:text-[#EF4444] transition-colors rounded-sm hover:bg-red-500/[0.04]"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: '#080E1C', borderBottom: '1px solid #141F35' }}
      >
        <button onClick={() => setOpen(true)} className="text-white/50 hover:text-white p-1">
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-white tracking-[0.12em]">TARMAC</span>
        <div className="w-7" />
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 h-full shrink-0">
            {navContent}
          </div>
          <div className="flex-1 bg-black/70" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col h-full shrink-0" style={{ background: '#080E1C', borderRight: '1px solid #141F35' }}>
        {navContent}
      </aside>
    </>
  )
}
