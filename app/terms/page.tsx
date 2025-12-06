"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/layout/navigation"

export default function TermsPage() {
  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-4xl space-y-6 p-4 sm:p-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Terms of Service</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2">
            Last updated: December 6, 2025
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              By accessing and using ReceiptWise ("the Service"), you accept and agree to be bound by the terms and 
              provision of this agreement. If you do not agree to these terms, please do not use the Service.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Description of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              ReceiptWise provides receipt management and expense tracking services, including AI-powered OCR 
              (Optical Character Recognition) for extracting data from receipt images, spending analytics, 
              and household sharing features.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. User Accounts</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              You are responsible for maintaining the confidentiality of your account and password. You agree to 
              accept responsibility for all activities that occur under your account.
            </p>
            <p>
              You must provide accurate and complete information when creating your account and keep this 
              information up to date.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Subscription and Payment</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              <strong>Free Tier:</strong> The Service offers a free tier with limited features and receipt storage.
            </p>
            <p>
              <strong>Premium Subscription:</strong> Premium features require a paid subscription. Subscriptions are 
              billed on a recurring basis (monthly or annually) and will automatically renew unless cancelled.
            </p>
            <p>
              <strong>Payment Processing:</strong> All payments are processed securely through Stripe. We do not 
              store your credit card information.
            </p>
            <p>
              <strong>Cancellation:</strong> You may cancel your subscription at any time through the billing portal 
              in your account settings. Upon cancellation, you will retain access to premium features until the end 
              of your current billing period.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. User Content</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              You retain all rights to the content you upload to the Service, including receipt images and associated 
              data. By uploading content, you grant us a license to process, store, and display this content solely 
              for the purpose of providing the Service to you.
            </p>
            <p>
              You are responsible for ensuring you have the right to upload any content to the Service and that such 
              content does not violate any laws or third-party rights.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Acceptable Use</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Upload malicious code, viruses, or any harmful content</li>
              <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
              <li>Use automated systems to access the Service without our permission</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. AI and OCR Processing</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              Our Service uses AI-powered OCR technology to extract information from receipt images. While we strive 
              for accuracy, we cannot guarantee that all extracted data will be 100% accurate. Users are responsible 
              for reviewing and verifying the accuracy of extracted data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Data Privacy and Security</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              We take data privacy and security seriously. Please review our Privacy Policy to understand how we 
              collect, use, and protect your personal information.
            </p>
            <p>
              While we implement industry-standard security measures, no method of transmission or storage is 100% 
              secure. You use the Service at your own risk.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Household Sharing</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              Premium users may create households and invite other users to share receipts. By creating or joining 
              a household, you agree that other household members will have access to shared receipts and associated 
              data.
            </p>
            <p>
              Household administrators are responsible for managing member access and permissions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10. Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              The Service and its original content, features, and functionality are owned by ReceiptWise and are 
              protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>11. Disclaimer of Warranties</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              The Service is provided "as is" and "as available" without any warranties of any kind, either express 
              or implied. We do not warrant that the Service will be uninterrupted, secure, or error-free.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>12. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              To the fullest extent permitted by law, ReceiptWise shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred 
              directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>13. Termination</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              We may terminate or suspend your account and access to the Service immediately, without prior notice, 
              for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, 
              or for any other reason.
            </p>
            <p>
              Upon termination, your right to use the Service will immediately cease. You may delete your account 
              at any time through your account settings.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>14. Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              We reserve the right to modify these terms at any time. If we make material changes, we will notify 
              you by email or through a notice on the Service. Your continued use of the Service after such 
              modifications constitutes your acceptance of the updated terms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>15. Governing Law</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in 
              which ReceiptWise operates, without regard to its conflict of law provisions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>16. Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p>
              Email: <a href="mailto:support@receiptwise.com" className="text-primary hover:underline">support@receiptwise.com</a>
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
