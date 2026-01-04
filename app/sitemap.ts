import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://receiptwise.io';

  // Public routes that should be indexed
  const routes = [
    { path: '', changeFreq: 'daily' as const, priority: 1 },
    { path: '/support', changeFreq: 'monthly' as const, priority: 0.7 },
    { path: '/privacy', changeFreq: 'monthly' as const, priority: 0.5 },
    { path: '/terms', changeFreq: 'monthly' as const, priority: 0.5 },
    { path: '/refund', changeFreq: 'monthly' as const, priority: 0.5 },
  ].map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFreq,
    priority: route.priority,
  }));

  return routes;
}
