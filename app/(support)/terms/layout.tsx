import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - ReceiptWise',
  description: 'Read the terms and conditions for using ReceiptWise receipt tracking and expense management service.',
  openGraph: {
    title: 'Terms of Service - ReceiptWise',
    description: 'Read the terms and conditions for using ReceiptWise receipt tracking and expense management service.',
  },
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
