import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Center - ReceiptWise',
  description: 'Get help with ReceiptWise. Contact our support team, browse FAQs, and find answers to common questions about receipt scanning and expense tracking.',
  openGraph: {
    title: 'Support Center - ReceiptWise',
    description: 'Get help with ReceiptWise. Contact our support team, browse FAQs, and find answers to common questions.',
  },
  alternates: {
    canonical: '/support',
  },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
