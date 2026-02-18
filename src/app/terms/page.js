'use client';

import Link from 'next/link';

/**
 * Terms of Service Page
 * NewsAgent Terms and Conditions
 */
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111111]">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-[#111111]">NewsAgent</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm text-[#6B7280] hover:text-[#111111]">Home</Link>
            <Link href="/login" className="rounded-lg bg-[#111111] px-4 py-2 text-sm font-medium text-white hover:bg-[#000000]">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#111111]">Terms of Service</h1>
          <p className="mt-4 text-[#6B7280]">
            Last updated: January 1, 2026
          </p>
        </div>

        <div className="prose prose-gray max-w-none">
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">1. Acceptance of Terms</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              By accessing or using NewsAgent (&quot;the Service&quot;), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Service. These terms apply to all users, 
              including visitors, registered users, and contributors.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">2. Description of Service</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              NewsAgent is a privacy-first, AI-powered news aggregation platform designed for knowledge workers. 
              The Service provides personalized news feeds, AI-generated summaries, article collections, and 
              full-text search capabilities. We use local AI processing through Ollama to ensure your data 
              remains private.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">3. User Accounts</h2>
            <p className="text-[#4A4A4A] leading-relaxed mb-4">
              To access certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#4A4A4A]">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">4. Acceptable Use</h2>
            <p className="text-[#4A4A4A] leading-relaxed mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#4A4A4A]">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the intellectual property rights of others</li>
              <li>Transmit malicious code or interfere with the Service</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Scrape or harvest data without permission</li>
              <li>Use the Service for commercial purposes without authorization</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">5. Intellectual Property</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              The Service and its original content (excluding user content and third-party news articles) 
              are the property of NewsAgent and are protected by copyright, trademark, and other intellectual 
              property laws. NewsAgent is released under the MIT License for open-source components.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">6. Third-Party Content</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              The Service aggregates news articles from third-party sources. We do not claim ownership of 
              this content. All articles remain the property of their respective publishers. We provide 
              links to original sources and encourage users to visit the original publishers.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">7. Disclaimer of Warranties</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, 
              EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, 
              SECURE, OR ERROR-FREE. AI-GENERATED SUMMARIES MAY CONTAIN INACCURACIES.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">8. Limitation of Liability</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEWSAGENT SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">9. Termination</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violations of 
              these Terms. You may also delete your account at any time through the Settings page. 
              Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">10. Changes to Terms</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              We may update these Terms from time to time. We will notify you of any changes by posting 
              the new Terms on this page and updating the &quot;Last updated&quot; date. Your continued use of 
              the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">11. Governing Law</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws, 
              without regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">12. Contact Us</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="mt-4 text-[#4A4A4A]">
              📧 Email: <a href="mailto:legal@newsagent.com" className="text-[#111111] underline">legal@newsagent.com</a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-[#6B7280]">© 2026 NewsAgent Inc. MIT License</p>
            <div className="flex items-center gap-6">
              <Link href="/docs" className="text-sm text-[#6B7280] hover:text-[#111111]">Docs</Link>
              <Link href="/privacy" className="text-sm text-[#6B7280] hover:text-[#111111]">Privacy</Link>
              <Link href="/terms" className="text-sm text-[#6B7280] hover:text-[#111111]">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
