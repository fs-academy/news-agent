'use client';

import Link from 'next/link';

/**
 * Privacy Policy Page
 * NewsAgent Privacy Policy and Data Handling
 */
export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold text-[#111111]">Privacy Policy</h1>
          <p className="mt-4 text-[#6B7280]">
            Last updated: January 1, 2026
          </p>
        </div>

        {/* Privacy Highlights */}
        <div className="mb-12 rounded-xl border border-green-200 bg-green-50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-green-800">🔒 Privacy Highlights</h2>
          <ul className="space-y-2 text-green-700">
            <li>✓ Local AI processing - your data never leaves your device for AI analysis</li>
            <li>✓ No third-party trackers or analytics</li>
            <li>✓ No selling of personal data</li>
            <li>✓ Minimal data collection</li>
            <li>✓ You can delete your account and data at any time</li>
          </ul>
        </div>

        <div className="prose prose-gray max-w-none">
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">1. Introduction</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              At NewsAgent, privacy is not just a feature—it&apos;s our core principle. This Privacy Policy 
              explains how we collect, use, and protect your information when you use our Service. 
              We are committed to maintaining the trust and confidence of our users.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">2. Information We Collect</h2>
            
            <h3 className="mb-3 mt-6 text-xl font-medium text-[#111111]">2.1 Account Information</h3>
            <p className="text-[#4A4A4A] leading-relaxed mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#4A4A4A]">
              <li>Email address (for authentication and communication)</li>
              <li>Name (optional, for personalization)</li>
              <li>Password (securely hashed, never stored in plain text)</li>
            </ul>

            <h3 className="mb-3 mt-6 text-xl font-medium text-[#111111]">2.2 Preferences</h3>
            <p className="text-[#4A4A4A] leading-relaxed mb-4">
              To personalize your experience, we store:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#4A4A4A]">
              <li>Selected interests and topics</li>
              <li>Saved articles and collections</li>
              <li>Display preferences (theme, layout)</li>
            </ul>

            <h3 className="mb-3 mt-6 text-xl font-medium text-[#111111]">2.3 Usage Data</h3>
            <p className="text-[#4A4A4A] leading-relaxed">
              We collect minimal usage data to improve the Service, including basic interaction patterns. 
              We do NOT track individual article reading behavior or sell any usage data.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">3. Local AI Processing</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              NewsAgent uses Ollama for AI-powered features like article ranking and summarization. 
              <strong> All AI processing happens locally on our servers after articles are fetched.</strong> 
              Your reading habits and preferences are never sent to external AI services like OpenAI, 
              Anthropic, or Google. This ensures your intellectual interests remain private.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">4. How We Use Your Information</h2>
            <p className="text-[#4A4A4A] leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#4A4A4A]">
              <li>Provide and maintain the Service</li>
              <li>Personalize your news feed based on selected interests</li>
              <li>Send important service updates (you can opt out)</li>
              <li>Respond to support requests</li>
              <li>Improve the Service based on aggregate usage patterns</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">5. Data Sharing</h2>
            <p className="text-[#4A4A4A] leading-relaxed mb-4">
              We do NOT sell your personal data. We may share information only in these limited circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#4A4A4A]">
              <li><strong>Service Providers:</strong> We use MongoDB Atlas for database hosting with encryption at rest</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In the event of a merger or acquisition (with notice to users)</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">6. Data Security</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#4A4A4A] mt-4">
              <li>HTTPS encryption for all data transmission</li>
              <li>Bcrypt password hashing</li>
              <li>JWT-based authentication with secure token handling</li>
              <li>Database encryption at rest</li>
              <li>Regular security audits</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">7. Your Rights</h2>
            <p className="text-[#4A4A4A] leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#4A4A4A]">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Update or correct your information</li>
              <li><strong>Deletion:</strong> Delete your account and all associated data</li>
              <li><strong>Portability:</strong> Export your data in a standard format</li>
              <li><strong>Objection:</strong> Opt out of non-essential data processing</li>
            </ul>
            <p className="text-[#4A4A4A] leading-relaxed mt-4">
              To exercise these rights, visit Settings or contact us at privacy@newsagent.com.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">8. Cookies</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              We use only essential cookies required for authentication and session management. 
              We do NOT use tracking cookies, advertising cookies, or third-party analytics services 
              like Google Analytics.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">9. Data Retention</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              We retain your account data as long as your account is active. You can delete your 
              account at any time, which will permanently remove all your personal data within 30 days. 
              Some anonymized, aggregate data may be retained for service improvement.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">10. Children&apos;s Privacy</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              NewsAgent is not intended for users under 13 years of age. We do not knowingly collect 
              personal information from children. If you believe we have collected information from 
              a child, please contact us immediately.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">11. International Users</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              NewsAgent is designed to comply with GDPR (EU), CCPA (California), and other privacy 
              regulations. Our local-first AI processing approach means minimal data transfer to 
              external services.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">12. Changes to This Policy</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any significant 
              changes by email or through a prominent notice in the Service. Your continued use after 
              changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#111111]">13. Contact Us</h2>
            <p className="text-[#4A4A4A] leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, contact us at:
            </p>
            <div className="mt-4 rounded-lg bg-[#F8F9FA] p-4 text-[#4A4A4A]">
              <p>📧 Email: <a href="mailto:privacy@newsagent.com" className="text-[#111111] underline">privacy@newsagent.com</a></p>
              <p className="mt-2">🏢 NewsAgent Inc.</p>
            </div>
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
