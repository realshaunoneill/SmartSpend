import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - ReceiptWise',
  description: 'Learn how ReceiptWise collects, uses, and protects your personal information. Our commitment to your privacy and data security.',
  openGraph: {
    title: 'Privacy Policy - ReceiptWise',
    description: 'Learn how ReceiptWise collects, uses, and protects your personal information.',
  },
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
