import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'TARMAC — FAA Private Pilot Written Test Prep',
    template: '%s | TARMAC',
  },
  description: 'Ace your FAA Private Pilot written knowledge test with TARMAC. AI-powered practice questions, full 60-question exam simulations, instant explanations, and an AI tutor available 24/7. Free to start.',
  keywords: [
    'FAA written test', 'FAA knowledge test', 'private pilot written exam',
    'private pilot test prep', 'PAR test prep', 'FAA exam study',
    'aviation written test', 'student pilot study', 'private pilot ground school',
    'FAA practice questions', 'pilot written exam practice', 'aviation AI tutor',
  ],
  authors: [{ name: 'TARMAC' }],
  creator: 'TARMAC',
  metadataBase: new URL('https://tarmac.study'),
  icons: { icon: '/favicon.png', apple: '/logo-white.png' },
  openGraph: {
    title: 'TARMAC — FAA Private Pilot Written Test Prep',
    description: 'Ace your FAA Private Pilot written exam. AI-powered practice questions, full exam simulations, and an AI tutor that explains every answer. Free to start.',
    type: 'website',
    url: 'https://tarmac.study',
    siteName: 'TARMAC',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'TARMAC — FAA Private Pilot Exam Prep' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TARMAC — FAA Private Pilot Written Test Prep',
    description: 'Ace your FAA Private Pilot written exam with AI-powered practice and an AI tutor. Free to start.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'TARMAC',
  description: 'AI-powered FAA Private Pilot written knowledge test preparation. Practice questions, full exam simulations, and an AI tutor.',
  url: 'https://tarmac.study',
  applicationCategory: 'EducationApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free to start — 20 practice questions included',
  },
  audience: {
    '@type': 'Audience',
    audienceType: 'Student pilots, aviation enthusiasts preparing for FAA Private Pilot written exam',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
