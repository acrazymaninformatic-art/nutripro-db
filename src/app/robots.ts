import type { MetadataRoute } from 'next'

const BASE_URL = 'https://evavidalnutricion.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/servicios', '/precios', '/contacto', '/legal', '/privacy-policy', '/terms', '/cookies'],
        disallow: ['/dashboard', '/paciente', '/api', '/login', '/anamnesis', '/reschedule'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
