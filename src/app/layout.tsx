import type { Metadata } from 'next'
import './globals.css'
import { ExamTypeProvider } from '@/components/ExamTypeProvider'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: {
    default: 'TARMAC Written — AI-Powered FAA Written Test Prep',
    template: '%s | TARMAC',
  },
  description: 'Private Pilot and Instrument Rating FAA written test prep, built for a testing environment that\'s moving beyond static question banks. AI-generated practice questions, novel-question mode, and full exam simulations. Free to start.',
  keywords: [
    'FAA written test prep', 'FAA written test', 'private pilot written exam',
    'private pilot exam prep', 'PAR written test', 'instrument written test',
    'IRA written test', 'instrument rating exam prep', 'FAA written test study guide',
    'AI FAA written test prep', 'FAA written test practice', 'aviation AI tutor',
  ],
  authors: [{ name: 'TARMAC' }],
  creator: 'TARMAC',
  metadataBase: new URL('https://tarmac.study'),
  icons: { icon: '/favicon.png', apple: '/logo-white.png' },
  openGraph: {
    title: 'TARMAC Written — AI-Powered FAA Written Test Prep',
    description: 'Private Pilot and Instrument Rating written test prep. AI-generated practice questions, novel-question mode, and full exam simulations. Free to start.',
    type: 'website',
    url: 'https://tarmac.study',
    siteName: 'TARMAC',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'TARMAC — FAA Written Test Prep' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TARMAC Written — AI-Powered FAA Written Test Prep',
    description: 'Private Pilot and Instrument Rating written test prep with AI-generated practice and an AI tutor. Free to start.',
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
  description: 'AI-powered FAA written knowledge test preparation for the Private Pilot and Instrument Rating exams. Practice questions, novel-question mode, full exam simulations, and an AI tutor.',
  url: 'https://tarmac.study',
  applicationCategory: 'EducationApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free to start — practice questions included',
  },
  audience: {
    '@type': 'Audience',
    audienceType: 'Student pilots preparing for the FAA Private Pilot or Instrument Rating written exam',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full dark" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: apply saved theme class before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('tarmac-theme');document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(t==='light'?'light':'dark');}catch(e){}})();` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <ExamTypeProvider>{children}</ExamTypeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
