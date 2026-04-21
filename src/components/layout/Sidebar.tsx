'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, BookOpen, ClipboardList, Bookmark,
  Settings, LogOut, Shield, Bot, Menu, X,
} from 'lucide-react'
import BugReportButton from '@/components/ui/BugReportButton'
import SuggestionButton from '@/components/ui/SuggestionButton'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/practice', icon: BookOpen, label: 'Practice Mode' },
  { href: '/exam', icon: ClipboardList, label: 'Practice Exam' },
  { href: '/saved', icon: Bookmark, label: 'Saved Questions' },
  { href: '/chat', icon: Bot, label: 'AI Tutor' },
]

interface SidebarProps { user: User }

const subscriptionLabels: Record<string, string> = {
  free: 'Free Trial',
  study_pass: 'Study Pass',
  checkride_prep: 'Checkride Prep',
  annual: 'Annual Pass',
}

const subscriptionColors: Record<string, string> = {
  free: 'text-white/50',
  study_pass: 'text-[#3E92CC]',
  checkride_prep: 'text-[#FFB627]',
  annual: 'text-green-400',
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [pathname])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Image src="/logo-white.png" alt="TARMAC" width={40} height={40} className="shrink-0" />
        <span className="text-xl font-bold text-white tracking-tight">TARMAC</span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wider" style={{ background: 'rgba(255,182,39,0.15)', color: '#FFB627', border: '1px solid rgba(255,182,39,0.3)' }}>BETA</span>
        {/* Close button — mobile only */}
        <button onClick={() => setOpen(false)} className="ml-auto md:hidden text-white/40 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active ? 'bg-[#3E92CC]/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
              )}>
              <Icon className={cn('w-5 h-5 shrink-0', active ? 'text-[#3E92CC]' : '')} />
              {label}
            </Link>
          )
        })}

        {user.is_admin && (
          <Link href="/admin"
            className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mt-4',
              pathname.startsWith('/admin') ? 'bg-[#FFB627]/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
            )}>
            <Shield className="w-5 h-5 shrink-0 text-[#FFB627]" />
            Admin
          </Link>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
        <div className="px-3 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="font-medium text-white text-sm truncate">{user.full_name || 'Pilot'}</div>
          <div className={cn('text-xs mt-0.5', subscriptionColors[user.subscription_status])}>
            {subscriptionLabels[user.subscription_status]}
          </div>
        </div>

        {user.subscription_status === 'free' && (
          <Link href="/upgrade"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: 'rgba(255,182,39,0.1)', border: '1px solid rgba(255,182,39,0.3)', color: '#FFB627' }}>
            <span className="text-base leading-none">⚡</span>
            Upgrade
          </Link>
        )}

        <Link href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
          <Settings className="w-5 h-5" />
          Settings
        </Link>

        <SuggestionButton />
        <BugReportButton />

        <button onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-red-400 hover:bg-red-400/5 transition-all">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: '#0A2463', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => setOpen(true)} className="text-white/70 hover:text-white p-1">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <Image src="/logo-white.png" alt="TARMAC" width={28} height={28} />
          <span className="text-base font-bold text-white tracking-tight">TARMAC</span>
          <span className="text-[9px] font-bold px-1 py-0.5 rounded-full" style={{ background: 'rgba(255,182,39,0.15)', color: '#FFB627', border: '1px solid rgba(255,182,39,0.3)' }}>BETA</span>
        </div>
        <div className="w-8" />
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 flex flex-col h-full" style={{ background: '#0d1f4a', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            {navContent}
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col h-full shrink-0" style={{ background: 'rgba(255,255,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
        {navContent}
      </aside>
    </>
  )
}
