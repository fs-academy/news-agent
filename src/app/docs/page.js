'use client';

import Link from 'next/link';

/**
 * Documentation Page
 * NewsAgent user guide and API documentation
 */
export default function DocsPage() {
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
          <h1 className="text-4xl font-bold text-[#111111]">Documentation</h1>
          <p className="mt-4 text-lg text-[#6B7280]">
            Everything you need to know to get started with NewsAgent.
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-[#111111]">Quick Start</h2>
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-6">
            <ol className="space-y-4 text-[#4A4A4A]">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111111] text-sm font-medium text-white">1</span>
                <div>
                  <h3 className="font-medium text-[#111111]">Create an Account</h3>
                  <p className="mt-1 text-sm">Sign up with your email or use Google/GitHub authentication.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111111] text-sm font-medium text-white">2</span>
                <div>
                  <h3 className="font-medium text-[#111111]">Select Your Interests</h3>
                  <p className="mt-1 text-sm">Choose topics like AI, Startups, Security, and more to personalize your feed.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111111] text-sm font-medium text-white">3</span>
                <div>
                  <h3 className="font-medium text-[#111111]">Explore Your Dashboard</h3>
                  <p className="mt-1 text-sm">View AI-ranked articles, save favorites, and generate summaries.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Features */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-[#111111]">Features</h2>
          <div className="space-y-6">
            <div className="rounded-xl border border-[#E5E7EB] p-6">
              <h3 className="text-lg font-medium text-[#111111]">🤖 AI-Powered Ranking</h3>
              <p className="mt-2 text-[#4A4A4A]">
                NewsAgent uses local AI (Ollama) to rank articles based on relevance to your interests. 
                All processing happens on your device for maximum privacy.
              </p>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] p-6">
              <h3 className="text-lg font-medium text-[#111111]">📝 Smart Summaries</h3>
              <p className="mt-2 text-[#4A4A4A]">
                Generate concise summaries of any article with one click. Perfect for quickly scanning 
                content and deciding what&apos;s worth a deeper read.
              </p>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] p-6">
              <h3 className="text-lg font-medium text-[#111111]">🔒 Privacy-First Design</h3>
              <p className="mt-2 text-[#4A4A4A]">
                Your data stays yours. We use local LLM processing, minimal data collection, 
                and never sell your information to third parties.
              </p>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] p-6">
              <h3 className="text-lg font-medium text-[#111111]">📚 Collections</h3>
              <p className="mt-2 text-[#4A4A4A]">
                Save articles to collections for later reading. Mark favorites to quickly access 
                your most important content.
              </p>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] p-6">
              <h3 className="text-lg font-medium text-[#111111]">🔍 Full-Text Search</h3>
              <p className="mt-2 text-[#4A4A4A]">
                Search across all your articles with powerful full-text search. Find exactly what 
                you&apos;re looking for in seconds.
              </p>
            </div>
          </div>
        </section>

        {/* API Reference */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-[#111111]">API Reference</h2>
          <div className="rounded-xl border border-[#E5E7EB] p-6">
            <p className="text-[#4A4A4A]">
              NewsAgent provides a RESTful API for developers. Authentication is handled via JWT tokens.
            </p>
            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-[#111111] p-4">
                <code className="text-sm text-green-400">GET /api/news/discover</code>
                <p className="mt-2 text-sm text-gray-400">Fetch personalized news based on user interests</p>
              </div>
              <div className="rounded-lg bg-[#111111] p-4">
                <code className="text-sm text-green-400">GET /api/news/search?q=query</code>
                <p className="mt-2 text-sm text-gray-400">Search news articles by keyword</p>
              </div>
              <div className="rounded-lg bg-[#111111] p-4">
                <code className="text-sm text-green-400">POST /api/articles/:id/summarize</code>
                <p className="mt-2 text-sm text-gray-400">Generate AI summary for an article</p>
              </div>
              <div className="rounded-lg bg-[#111111] p-4">
                <code className="text-sm text-green-400">POST /api/collections/save</code>
                <p className="mt-2 text-sm text-gray-400">Save an article to collections</p>
              </div>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-[#111111]">Support</h2>
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-6">
            <p className="text-[#4A4A4A]">
              Need help? We&apos;re here for you.
            </p>
            <ul className="mt-4 space-y-2 text-[#4A4A4A]">
              <li>📧 Email: <a href="mailto:support@newsagent.com" className="text-[#111111] underline">support@newsagent.com</a></li>
              <li>💬 GitHub Issues: <a href="https://github.com/newsagent/newsagent" className="text-[#111111] underline" target="_blank" rel="noopener noreferrer">Report a bug</a></li>
              <li>📖 Community: Join our Discord for discussions</li>
            </ul>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-[#6B7280]">© 2026 NewsAgent Inc. MIT License</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-[#6B7280] hover:text-[#111111]">Privacy</Link>
              <Link href="/terms" className="text-sm text-[#6B7280] hover:text-[#111111]">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
