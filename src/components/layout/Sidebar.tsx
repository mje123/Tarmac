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
  Settings, LogOut, Shield, Bot, Menu, X, ListChecks, Layers, Sun, Moon,
} from 'lucide-react'
import BugReportButton from '@/components/ui/BugReportButton'
import SuggestionButton from '@/components/ui/SuggestionButton'
import { useTheme } from '@/components/ThemeProvider'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/practice', icon: BookOpen, label: 'Practice Mode' },
  { href: '/quiz', icon: ListChecks, label: 'Quiz Mode' },
  { href: '/exam', icon: ClipboardList, label: 'Practice Exam' },
  { href: '/saved', icon: Bookmark, label: 'Saved Questions' },
  { href: '/flashcards', icon: Layers, label: 'Flashcards' },
  { href: '/chat', icon: Bot, label: 'AI Tutor' },
]

interface SidebarProps { user: User }

const subscriptionLabels: Record<string, string> = {
  free: '',
  trialing: 'Free Trial',
  study_pass: 'Tarmac Membership',
  checkride_prep: 'Checkride Prep',
  annual: 'Annual Pass',
}

const subscriptionColors: Record<string, string> = {
  free: 'text-white/30',
  trialing: 'text-green-400',
  study_pass: 'text-[#3E92CC]',
  checkride_prep: 'text-[#FFB627]',
  annual: 'text-green-400',
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { theme, toggle } = useTheme()

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
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Image src="/logo-white.png" alt="TARMAC" width={40} height={40} className="shrink-0" />
        <span className="text-xl font-bold text-white tracking-tight">TARMAC</span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wider" style={{ background: 'rgba(255,182,39,0.15)', color: '#FFB627', border: '1px solid rgba(255,182,39,0.3)' }}>BETA</span>
        <button onClick={() => setOpen(false)} className="ml-auto md:hidden text-white/40 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all relative',
                active ? 'text-[#3E92CC] font-semibold' : 'text-white/55 hover:text-white/90 hover:bg-white/5'
              )}
              style={active ? {
                background: 'linear-gradient(90deg, rgba(62,146,204,0.14) 0%, rgba(62,146,204,0.04) 100%)',
                borderLeft: '3px solid #3E92CC',
                paddingLeft: '13px',
                paddingRight: '12px',
              } : { paddingLeft: '16px', paddingRight: '12px' }}
            >
              <Icon className={cn('w-4.5 h-4.5 shrink-0', active ? 'text-[#3E92CC]' : '')} style={{ width: '18px', height: '18px' }} />
              {label}
            </Link>
          )
        })}

        {user.is_admin && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all mt-4',
              pathname.startsWith('/admin') ? 'text-[#FFB627] font-semibold' : 'text-white/55 hover:text-white/90 hover:bg-white/5'
            )}
            style={pathname.startsWith('/admin') ? {
              background: 'linear-gradient(90deg, rgba(255,182,39,0.14) 0%, rgba(255,182,39,0.04) 100%)',
              borderLeft: '3px solid #FFB627',
              paddingLeft: '13px',
              paddingRight: '12px',
            } : { paddingLeft: '16px', paddingRight: '12px' }}
          >
            <Shield className="w-[18px] h-[18px] shrink-0 text-[#FFB627]" />
            Admin
          </Link>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
        <div className="px-3 py-3 rounded-xl mb-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="font-semibold text-white text-sm truncate">{user.full_name || 'Pilot'}</div>
          {subscriptionLabels[user.subscription_status] && (
            <div className={cn('text-xs mt-0.5 font-medium', subscriptionColors[user.subscription_status])}>
              {subscriptionLabels[user.subscription_status]}
            </div>
          )}
        </div>

        {user.subscription_status === 'free' && !user.stripe_customer_id && (
          <Link
            href="/upgrade"
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, rgba(255,182,39,0.18) 0%, rgba(255,182,39,0.08) 100%)',
              border: '1px solid rgba(255,182,39,0.35)',
              color: '#FFB627',
              boxShadow: '0 2px 12px rgba(255,182,39,0.12)',
            }}
          >
            <span className="text-base leading-none">⚡</span>
            Start Free Trial
          </Link>
        )}

        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white/90 hover:bg-white/5 transition-all"
        >
          <Settings className="w-[18px] h-[18px]" />
          Settings
        </Link>

        <SuggestionButton />
        <BugReportButton />

        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white/90 hover:bg-white/5 transition-all"
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-red-400 hover:bg-red-400/5 transition-all"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-sidebar)', backdropFilter: 'blur(12px)' }}
      >
        <button onClick={() => setOpen(true)} className="text-white/60 hover:text-white p-1 transition-colors">
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
          <div className="w-64 flex flex-col h-full" style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-sidebar)' }}>
            {navContent}
          </div>
          <div className="flex-1 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-64 flex-col h-full shrink-0"
        style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-sidebar)' }}
      >
        {navContent}
      </aside>
    </>
  )
}
