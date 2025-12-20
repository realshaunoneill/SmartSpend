import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://receiptwise.io';

  // Static routes
  const routes = [
    '',
    '/support',
    '/privacy',
    '/terms',
    '/refund',
    '/sign-in',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' as const : 'weekly' as const,
    priority: route === '' ? 1 : route === '/support' ? 0.7 : 0.6,
  }));

  return routes;
}
