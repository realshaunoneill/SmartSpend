import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy - ReceiptWise',
  description: 'Learn about our refund process and subscription management. Pro-rated refunds available within 7 days of purchase.',
  openGraph: {
    title: 'Refund Policy - ReceiptWise',
    description: 'Learn about our refund process and subscription management for ReceiptWise.',
  },
  alternates: {
    canonical: '/refund',
  },
};

export default function RefundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
