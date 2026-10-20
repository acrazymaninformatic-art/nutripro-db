import type { MetadataRoute } from 'next'

const BASE_URL = 'https://evavidalnutricion.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const publicPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/servicios`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${BASE_URL}/precios`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/contacto`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/legal`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]

  return publicPages
}
