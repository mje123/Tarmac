import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MessageSquare, Plus } from 'lucide-react'

export const metadata = { title: 'Community — Tarmac' }

export default async function ForumLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/forum')
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page, #080f1e)' }}>
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b" style={{ background: 'rgba(8,15,30,0.95)', borderColor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo-white.png" alt="Tarmac" width={28} height={28} />
            <span className="font-bold text-white text-base tracking-tight">TARMAC</span>
          </Link>
          <span className="text-white/20 text-lg">/</span>
          <Link href="/forum" className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm font-medium">
            <MessageSquare className="w-4 h-4" />
            Community
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/dashboard" className="text-xs text-white/40 hover:text-white/70 transition-colors">Dashboard</Link>
            <Link href="/forum/new" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #FFB627, #e09e1a)', color: '#0A2463' }}>
              <Plus className="w-3.5 h-3.5" /> New Post
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
