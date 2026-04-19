import Link from 'next/link'

export default function UnsubscribedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'linear-gradient(135deg,#051237 0%,#0A2463 100%)' }}>
      <div className="text-center max-w-md">
        <div className="text-4xl mb-4">✉️</div>
        <h1 className="text-2xl font-bold text-white mb-3">You&apos;re unsubscribed</h1>
        <p className="text-white/60 mb-6 text-sm leading-relaxed">
          You&apos;ve been removed from TARMAC email updates. You won&apos;t receive weekly progress emails or reminders.<br /><br />
          You can re-enable emails anytime in your account Settings.
        </p>
        <Link href="/dashboard" className="text-[#FFB627] hover:text-[#ffc84a] font-medium text-sm">
          Back to TARMAC →
        </Link>
      </div>
    </div>
  )
}
