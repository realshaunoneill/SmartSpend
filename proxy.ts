import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/support',
  '/terms',
  '/privacy',
  '/refund',
  '/sitemap.xml',
  '/robots.txt',
  '/favicon.ico',
  '/icon.svg',
  '/apple-icon.png',
  '/manifest.json',
  '/opengraph-image(.*)',
  '/twitter-image(.*)',
  '/api/webhooks(.*)',
  '/api/stripe/webhooks', // Stripe webhooks
  '/api/extension(.*)', // Chrome extension API (uses API key auth)
  '/ingest(.*)', // PostHog analytics
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
