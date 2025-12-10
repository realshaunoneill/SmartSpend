import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://receiptwise.io';

  // Static routes
  const routes = [
    '',
    '/dashboard',
    '/receipts',
    '/insights',
    '/subscriptions',
    '/sharing',
    '/settings',
    '/support',
    '/privacy',
    '/terms',
    '/sign-in',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' as const : 'weekly' as const,
    priority: route === '' ? 1 : route === '/dashboard' ? 0.9 : 0.8,
  }));

  return routes;
}
