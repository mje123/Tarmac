import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TARMAC - FAA Private Pilot Exam Prep',
  description: 'Pass your FAA Private Pilot written exam with AI-powered test prep. Real exam simulations, AI tutor, smart progress tracking.',
  keywords: 'FAA written exam, private pilot, test prep, aviation study',
  icons: { icon: '/favicon.png', apple: '/logo.png' },
  openGraph: {
    title: 'TARMAC - FAA Private Pilot Exam Prep',
    description: 'Pass your FAA Private Pilot written exam with AI-powered test prep. Real exam simulations, AI tutor, smart progress tracking.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'TARMAC Exam Prep' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TARMAC - FAA Private Pilot Exam Prep',
    description: 'Pass your FAA Private Pilot written exam with AI-powered test prep.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
