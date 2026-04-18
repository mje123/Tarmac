import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A2463] flex flex-col">
      <nav className="px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image src="/logo-white.png" alt="TARMAC" width={40} height={40} />
          <span className="text-xl font-bold text-white tracking-tight">TARMAC</span>
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
