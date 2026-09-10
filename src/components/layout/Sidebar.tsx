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
  Settings, LogOut, Shield, Bot, Menu, X, ListChecks, Layers,
  Brain, Route, Sun, Moon,
} from 'lucide-react'
import BugReportButton from '@/components/ui/BugReportButton'
import SuggestionButton from '@/components/ui/SuggestionButton'
import { useExamType } from '@/components/ExamTypeProvider'
import { useTheme } from '@/components/ThemeProvider'

const GROUND_SCHOOL_SECTION = {
  label: 'Training',
  items: [
    { href: '/practice',    icon: BookOpen,     label: 'Practice Mode' },
    { href: '/quiz',        icon: ListChecks,   label: 'Quiz Mode' },
    { href: '/exam',        icon: ClipboardList, label: 'Practice Exam' },
    { href: '/review',      icon: Brain,        label: 'Daily Review' },
    { href: '/chat',        icon: Bot,          label: 'AI Tutor' },
    { href: '/flashcards',  icon: Layers,       label: 'Flashcards' },
    { href: '/study-plan',  icon: Route,        label: 'Test Runway' },
  ],
}

const ACCOUNT_SECTION = {
  label: 'Account',
  items: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/saved',     icon: Bookmark,        label: 'Saved Questions' },
    { href: '/settings',  icon: Settings,        label: 'Settings' },
  ],
}

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
  accent?: string
  badge?: string
}

interface NavSection {
  label: string
  items: NavItem[]
}

const ALL_SECTIONS: NavSection[] = [GROUND_SCHOOL_SECTION, ACCOUNT_SECTION]

const subscriptionLabels: Record<string, string> = {
  free: '',
  trialing: 'Free Trial',
  tarmac_member: 'TARMAC Member',
  study_pass: 'TARMAC Member',
  checkride_prep: 'TARMAC Member',
  annual: 'TARMAC Member',
}

const subscriptionColors: Record<string, string> = {
  free: 'text-white/30',
  trialing: 'text-green-400',
  tarmac_member: 'text-[#3E92CC]',
  study_pass: 'text-[#3E92CC]',
  checkride_prep: 'text-[#3E92CC]',
  annual: 'text-[#3E92CC]',
}

interface SidebarProps { user: User }

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { examType, setExamType } = useExamType()
  const { theme, toggle } = useTheme()

  useEffect(() => { setOpen(false) }, [pathname])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isPaid = user.subscription_status !== 'free'
  const displayName = user.callsign ? user.callsign : (user.full_name?.split(' ')[0] || 'Pilot')

  function NavLink({ href, icon: Icon, label, accent, badge }: NavItem) {
    const active = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          'flex items-center gap-3 py-2 rounded-lg text-sm font-medium transition-all relative',
          active ? 'font-semibold' : 'text-white/50 hover:text-white/85 hover:bg-white/5'
        )}
        style={active ? {
          background: accent
            ? `linear-gradient(90deg, ${accent}18 0%, transparent 100%)`
            : 'linear-gradient(90deg, rgba(62,146,204,0.14) 0%, transparent 100%)',
          borderLeft: `3px solid ${accent || '#3E92CC'}`,
          paddingLeft: '13px',
          paddingRight: '12px',
          color: accent || '#3E92CC',
        } : { paddingLeft: '16px', paddingRight: '12px' }}
      >
        <Icon
          style={{ width: '16px', height: '16px', flexShrink: 0, color: active ? (accent || '#3E92CC') : undefined }}
        />
        {label}
        {badge && (
          <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(62,146,204,0.15)', color: '#3E92CC', border: '1px solid rgba(62,146,204,0.25)' }}>
            {badge}
          </span>
        )}
      </Link>
    )
  }

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Image src="/logo-white.png" alt="TARMAC" width={36} height={36} className="shrink-0" />
        <span className="text-lg font-bold text-white tracking-tight">TARMAC</span>
        <button onClick={() => setOpen(false)} className="ml-auto md:hidden text-white/40 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {ALL_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.22)' }}>
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) =>
                isPaid ? (
                  <NavLink key={item.href} {...item} />
                ) : item.href === '/dashboard' ? (
                  <NavLink key={item.href} {...item} />
                ) : (
                  <Link
                    key={item.href}
                    href="/upgrade"
                    className="flex items-center gap-3 py-2 rounded-lg text-sm font-medium text-white/25 transition-all cursor-pointer hover:text-white/40"
                    style={{ paddingLeft: '16px', paddingRight: '12px' }}
                  >
                    <item.icon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    {item.label}
                  </Link>
                )
              )}
            </div>
          </div>
        ))}

        {user.is_admin && (
          <div>
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'rgba(255,182,39,0.4)' }}>Admin</p>
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 py-2 rounded-lg text-sm font-medium transition-all',
                pathname.startsWith('/admin') ? 'text-[#FFB627] font-semibold' : 'text-white/50 hover:text-white/85 hover:bg-white/5'
              )}
              style={pathname.startsWith('/admin') ? {
                background: 'linear-gradient(90deg, rgba(255,182,39,0.14) 0%, transparent 100%)',
                borderLeft: '3px solid #FFB627',
                paddingLeft: '13px',
                paddingRight: '12px',
              } : { paddingLeft: '16px', paddingRight: '12px' }}
            >
              <Shield className="w-4 h-4 shrink-0 text-[#FFB627]" />
              Admin Panel
            </Link>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
        <div className="px-3 py-3 rounded-xl mb-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            {user.callsign ? (
              <span className="font-mono font-bold text-white text-sm">{user.callsign}</span>
            ) : (
              <span className="font-semibold text-white text-sm truncate">{user.full_name || 'Pilot'}</span>
            )}
          </div>
          {subscriptionLabels[user.subscription_status] && (
            <div className={cn('text-xs mt-0.5 font-medium', subscriptionColors[user.subscription_status])}>
              {subscriptionLabels[user.subscription_status]}
            </div>
          )}
          {!user.callsign && isPaid && (
            <Link href="/settings" className="text-xs text-[#3E92CC]/70 hover:text-[#3E92CC] mt-1 block transition-colors">
              Set your callsign →
            </Link>
          )}
        </div>

        {user.subscription_status === 'free' && (
          <Link
            href="/upgrade"
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 mb-1"
            style={{
              background: 'linear-gradient(135deg, rgba(255,182,39,0.18) 0%, rgba(255,182,39,0.08) 100%)',
              border: '1px solid rgba(255,182,39,0.35)',
              color: '#FFB627',
            }}
          >
            <span className="text-base leading-none">⚡</span>
            Start Free Trial
          </Link>
        )}

        <div className="flex rounded-lg overflow-hidden mb-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => examType !== 'ppl' && setExamType('ppl')}
            className="flex-1 py-1.5 text-xs font-bold transition-all"
            style={examType === 'ppl'
              ? { background: '#3E92CC', color: 'white' }
              : { background: 'transparent', color: 'rgba(255,255,255,0.35)' }}
          >Private</button>
          <button
            onClick={() => examType !== 'ifr' && setExamType('ifr')}
            className="flex-1 py-1.5 text-xs font-bold transition-all"
            style={examType === 'ifr'
              ? { background: '#FFB627', color: '#060e1c' }
              : { background: 'transparent', color: 'rgba(255,255,255,0.35)' }}
          >Instrument</button>
        </div>

        <SuggestionButton />
        <BugReportButton />

        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4" />
            : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-red-400/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
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
          <Image src="/logo-white.png" alt="TARMAC" width={26} height={26} />
          <span className="text-base font-bold text-white tracking-tight">TARMAC</span>
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
        className="hidden md:flex w-60 flex-col h-full shrink-0"
        style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-sidebar)' }}
      >
        {navContent}
      </aside>
    </>
  )
}
