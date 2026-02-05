'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/layout/navigation';

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-4xl space-y-6 p-4 sm:p-6 pb-12" aria-labelledby="privacy-title">
        <div>
          <h1 id="privacy-title" className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Privacy Policy</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2">
            Last updated: December 6, 2025
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Introduction</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              ReceiptWise ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our receipt
              management service.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p><strong>Account Information:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name and email address (via Clerk authentication)</li>
              <li>Profile information you provide</li>
              <li>Account preferences and settings</li>
            </ul>

            <p><strong>Receipt Data:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Receipt images you upload</li>
              <li>Extracted data from receipts (merchant name, items, prices, dates, etc.)</li>
              <li>Categories and tags you assign</li>
              <li>Notes and modifications you make</li>
            </ul>

            <p><strong>Usage Information:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>How you interact with the Service</li>
              <li>Features you use</li>
              <li>Time and date of your visits</li>
              <li>Browser type and device information</li>
            </ul>

            <p><strong>Payment Information:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Payment information is processed and stored by Stripe</li>
              <li>We only store your Stripe customer ID and subscription status</li>
              <li>We never see or store your complete credit card information</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide, maintain, and improve our Service</li>
              <li>Process and store your receipt data</li>
              <li>Perform AI-powered OCR processing on receipt images</li>
              <li>Generate spending insights and analytics</li>
              <li>Process subscription payments</li>
              <li>Send you service-related notifications</li>
              <li>Respond to your requests and support inquiries</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. AI and OCR Processing</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              We use OpenAI's GPT-4 Vision API to process receipt images and extract structured data. When you
              upload a receipt:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The image is sent to OpenAI's API for processing</li>
              <li>OpenAI processes the image and returns extracted data</li>
              <li>We store the extracted data in our database</li>
              <li>OpenAI's data processing is subject to their privacy policy and data retention practices</li>
            </ul>
            <p>
              According to OpenAI's policies, API data is not used to train their models and is retained for a
              limited period for abuse monitoring.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Data Storage and Security</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Receipt images are stored securely in cloud storage</li>
              <li>Database connections are encrypted</li>
              <li>Access to data is restricted and monitored</li>
              <li>Authentication is handled by Clerk, a secure identity platform</li>
              <li>Payment processing is handled by Stripe with PCI compliance</li>
            </ul>
            <p>
              While we strive to protect your data, no method of transmission or storage is 100% secure. We cannot
              guarantee absolute security.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Household Sharing</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              When you create or join a household:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Receipts assigned to the household are visible to all household members</li>
              <li>Members can see receipt images and extracted data for shared receipts</li>
              <li>Household administrators can manage member access</li>
              <li>You can leave a household or remove shared receipts at any time</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Third-Party Services</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Clerk:</strong> Authentication and user management</li>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>OpenAI:</strong> AI-powered receipt OCR processing</li>
              <li><strong>Vercel:</strong> Hosting and deployment</li>
            </ul>
            <p>
              These services have their own privacy policies governing how they process your information.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              We retain your data for as long as your account is active or as needed to provide you with our
              services. You can delete receipts at any time through the Service. When you delete your account,
              we will delete or anonymize your personal data, except where we are required to retain it for
              legal or regulatory purposes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Your Rights and Choices</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data (subject to legal requirements)</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
              <li>Close your account</li>
            </ul>
            <p>
              To exercise these rights, please contact us at support@receiptwise.io or use the account
              settings in the Service.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10. Cookies and Tracking</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              We use cookies and similar tracking technologies to maintain your session and improve your
              experience. Essential cookies are required for the Service to function. You can control
              non-essential cookies through your browser settings.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>11. Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              Our Service is not intended for children under 13 years of age. We do not knowingly collect
              personal information from children under 13. If you become aware that a child has provided us
              with personal information, please contact us.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>12. International Data Transfers</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              Your information may be transferred to and processed in countries other than your country of
              residence. These countries may have different data protection laws. By using our Service, you
              consent to such transfers.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>13. Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes
              by posting the new policy on this page and updating the "Last updated" date. Your continued use
              of the Service after such changes constitutes acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>14. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              If you have questions about this Privacy Policy or how we handle your data, please contact us at:
            </p>
            <p>
              Email: <a href="mailto:support@receiptwise.io" className="text-primary hover:underline">support@receiptwise.io</a>
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
