import type { MetadataRoute } from 'next'

const BASE_URL = 'https://tarmac.study'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: '/', priority: 1, changeFrequency: 'weekly' as const },
    { path: '/private', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/instrument', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/how-it-works', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/30-day-runway', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/pricing', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/start', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/login', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/terms', priority: 0.2, changeFrequency: 'yearly' as const },
    { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' as const },
    { path: '/partners', priority: 0.2, changeFrequency: 'yearly' as const },
  ]

  return routes.map(r => ({
    url: `${BASE_URL}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}
