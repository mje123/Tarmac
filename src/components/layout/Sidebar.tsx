'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Bookmark,
  Settings,
  LogOut,
  Shield,
  Bot,
} from 'lucide-react'
import BugReportButton from '@/components/ui/BugReportButton'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', newTab: false },
  { href: '/practice', icon: BookOpen, label: 'Practice Mode', newTab: false },
  { href: '/exam', icon: ClipboardList, label: 'Practice Exam', newTab: false },
  { href: '/saved', icon: Bookmark, label: 'Saved Questions', newTab: false },
  { href: '/chat', icon: Bot, label: 'AI Tutor', newTab: false },
]

interface SidebarProps {
  user: User
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const subscriptionColors: Record<string, string> = {
    free: 'text-white/50',
    study_pass: 'text-[#3E92CC]',
    checkride_prep: 'text-[#FFB627]',
    annual: 'text-green-400',
  }

  const subscriptionLabels: Record<string, string> = {
    free: 'Free Trial',
    study_pass: 'Study Pass',
    checkride_prep: 'Checkride Prep',
    annual: 'Annual Pass',
  }

  return (
    <aside className="w-64 flex flex-col h-full" style={{ background: 'rgba(255,255,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Image src="/logo-white.png" alt="TARMAC" width={40} height={40} className="shrink-0" />
        <span className="text-xl font-bold text-white tracking-tight">TARMAC</span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wider" style={{ background: 'rgba(255,182,39,0.15)', color: '#FFB627', border: '1px solid rgba(255,182,39,0.3)' }}>BETA</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label, newTab }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const cls = cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            active ? 'bg-[#3E92CC]/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
          )
          return newTab ? (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cls}
            >
              <Icon className="w-5 h-5" />
              {label}
              <span className="ml-auto text-[10px] text-white/25">↗</span>
            </a>
          ) : (
            <Link key={href} href={href} className={cls}>
              <Icon className={cn('w-5 h-5', active ? 'text-[#3E92CC]' : '')} />
              {label}
            </Link>
          )
        })}

        {user.is_admin && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mt-4',
              pathname.startsWith('/admin')
                ? 'bg-[#FFB627]/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
          >
            <Shield className="w-5 h-5 text-[#FFB627]" />
            Admin
          </Link>
        )}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
        <div className="px-3 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="font-medium text-white text-sm truncate">{user.full_name || 'Pilot'}</div>
          <div className={cn('text-xs mt-0.5', subscriptionColors[user.subscription_status])}>
            {subscriptionLabels[user.subscription_status]}
          </div>
        </div>

        {user.subscription_status === 'free' && (
          <Link
            href="/upgrade"
            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #FFB627, #e5a020)', color: '#0A2463' }}
          >
            ⚡ Upgrade to Study Pass
          </Link>
        )}

        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>

        <BugReportButton />

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-red-400 hover:bg-red-400/5 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
