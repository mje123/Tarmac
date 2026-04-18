import Link from 'next/link'
import { Plane } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, #0A2463 0%, #0d1f4a 100%)' }}>
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(255,182,39,0.15)', border: '1px solid rgba(255,182,39,0.3)' }}>
          <Plane className="w-10 h-10 text-[#FFB627]" />
        </div>
        <div className="text-7xl font-bold text-white/10 mb-2">404</div>
        <h1 className="text-2xl font-bold text-white mb-3">Off course</h1>
        <p className="text-white/50 mb-8 leading-relaxed">
          This page doesn&apos;t exist. Let&apos;s get you back on the right heading.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="btn-gold px-6 py-3">
            Go to Dashboard
          </Link>
          <Link href="/" className="btn-ghost px-6 py-3">
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
