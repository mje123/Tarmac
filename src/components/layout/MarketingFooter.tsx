import Link from 'next/link'
import Image from 'next/image'

export default function MarketingFooter() {
  return (
    <footer className="py-8 px-6" style={{ background: '#060e1f', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-2.5">
          <Image src="/logo-white.png" alt="TARMAC" width={26} height={26} />
          <span className="font-bold text-white text-sm">TARMAC</span>
          <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()}</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <Link href="/private" className="hover:text-white/60 transition-colors">Private</Link>
          <Link href="/instrument" className="hover:text-white/60 transition-colors">Instrument</Link>
          <Link href="/pricing" className="hover:text-white/60 transition-colors">Pricing</Link>
          <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
          <Link href="/partners" className="hover:text-white/60 transition-colors">Partners</Link>
        </div>
        <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.18)' }}>
          Legion Systems LLC · TARMAC is not affiliated with or endorsed by the FAA.
        </p>
      </div>
    </footer>
  )
}
