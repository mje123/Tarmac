'use client'

import Link from 'next/link'
import Image from 'next/image'

const LINKS = [
  { href: '/private', label: 'Private' },
  { href: '/instrument', label: 'Instrument' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/30-day-runway', label: '30-Day Runway' },
  { href: '/pricing', label: 'Pricing' },
]

export default function MarketingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-10 py-4"
      style={{ background: 'rgba(6,14,31,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <Image src="/logo-white.png" alt="TARMAC" width={30} height={30} />
        <span className="text-base font-bold text-white tracking-tight">TARMAC</span>
      </Link>
      <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {LINKS.map(l => (
          <Link key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Link href="/login" className="text-sm px-4 py-2 transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>Log in</Link>
        <Link href="/start" className="btn-gold text-sm px-4 py-2">Start Free</Link>
      </div>
    </nav>
  )
}
