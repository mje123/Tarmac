import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/practice', '/quiz', '/exam', '/review', '/chat', '/flashcards', '/study-plan', '/settings', '/admin', '/api/'],
    },
    sitemap: 'https://tarmac.study/sitemap.xml',
  }
}
