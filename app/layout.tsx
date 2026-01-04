import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { ClerkProvider } from '@clerk/nextjs';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Footer } from '@/components/layout/footer';
import { QueryProvider } from '@/lib/providers/query-provider';
import { PostHogProvider } from '@/lib/providers/posthog-provider';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ReceiptWise - Family Expense & Receipt Tracker',
  description: 'Share expenses with family, roommates, or partners. AI-powered receipt scanning and household collaboration in one place',
  applicationName: 'ReceiptWise',
  keywords: ['receipt tracker', 'expense tracker', 'family expenses', 'household sharing', 'receipt scanner', 'spending tracker', 'subscription manager', 'shared expenses', 'roommate expenses'],
  authors: [{ name: 'ReceiptWise' }],
  creator: 'ReceiptWise',
  publisher: 'ReceiptWise',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.receiptwise.io'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ReceiptWise - Family Expense & Receipt Tracker',
    description: 'Share expenses with family, roommates, or partners. AI-powered receipt scanning and household collaboration in one place',
    url: '/',
    siteName: 'ReceiptWise',
    images: [
      {
        url: '/opengraph.png',
        width: 1536,
        height: 1024,
        alt: 'ReceiptWise - Receipt & Expense Tracker',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReceiptWise - Family Expense & Receipt Tracker',
    description: 'Share expenses with family, roommates, or partners. AI-powered receipt scanning and household collaboration in one place',
    images: ['/opengraph.png'],
    creator: '@receiptwise',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      {
        url: '/logo.png',
      },
    ],
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} antialiased`}>
          <NuqsAdapter>
            <QueryProvider>
              <PostHogProvider>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                  <div className="flex min-h-screen flex-col">
                    <div className="flex-1">{children}</div>
                    <Footer />
                  </div>
                  <Toaster />
                </ThemeProvider>
              </PostHogProvider>
            </QueryProvider>
          </NuqsAdapter>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
