import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Footer } from '@/components/layout/footer';
import { QueryProvider } from '@/lib/providers/query-provider';
import { PWARegister } from '@/components/layout/pwa-register';
import { PWAInstallPrompt } from '@/components/layout/pwa-install-prompt';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ReceiptWise - Receipt & Expense Tracker',
  description: 'Track receipts, manage spending, and sync your bank accounts in one place',
  applicationName: 'ReceiptWise',
  keywords: ['receipt tracker', 'expense tracker', 'receipt scanner', 'spending tracker', 'subscription manager', 'receipt management', 'expense management'],
  authors: [{ name: 'ReceiptWise' }],
  creator: 'ReceiptWise',
  publisher: 'ReceiptWise',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://receiptwise.io'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ReceiptWise - Receipt & Expense Tracker',
    description: 'Track receipts, manage spending, and sync your bank accounts in one place',
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
    title: 'ReceiptWise - Receipt & Expense Tracker',
    description: 'Track receipts, manage spending, and sync your bank accounts in one place',
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
        <head>
          <meta name="application-name" content="ReceiptWise" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="ReceiptWise" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#10b981" />
          <link rel="apple-touch-icon" href="/logo.png" />
        </head>
        <body className={`${inter.className} antialiased`}>
          <PWARegister />
          <QueryProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <div className="flex min-h-screen flex-col">
                <div className="flex-1">{children}</div>
                <Footer />
              </div>
              <Toaster />
              <PWAInstallPrompt />
            </ThemeProvider>
          </QueryProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
