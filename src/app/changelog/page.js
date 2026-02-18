'use client';

import Link from 'next/link';

/**
 * Changelog Page
 * NewsAgent release history and updates
 */
export default function ChangelogPage() {
  // Version 1.0 release features
  const releases = [
    {
      version: '1.0.0',
      date: 'February 4, 2026',
      title: 'Initial Release',
      description: 'The first official release of NewsAgent - your privacy-first AI-powered news aggregator.',
      changes: [
        { type: 'feature', text: 'AI-powered article ranking using Ollama' },
        { type: 'feature', text: 'Personalized news feed based on interests' },
        { type: 'feature', text: 'One-click AI summaries for any article' },
        { type: 'feature', text: 'Collections for saving and organizing articles' },
        { type: 'feature', text: 'Full-text search across all articles' },
        { type: 'feature', text: 'Dark mode support' },
        { type: 'feature', text: 'Google and GitHub OAuth authentication' },
        { type: 'feature', text: 'Privacy-first architecture with local AI processing' },
        { type: 'feature', text: 'News API integration with 80,000+ sources' },
      ],
    },
  ];

  const getTypeColor = (type) => {
    switch (type) {
      case 'feature': return 'bg-green-100 text-green-700';
      case 'improvement': return 'bg-blue-100 text-blue-700';
      case 'fix': return 'bg-amber-100 text-amber-700';
      case 'security': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

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
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#111111]">Changelog</h1>
          <p className="mt-4 text-lg text-[#6B7280]">
            All notable changes to NewsAgent are documented here.
          </p>
        </div>

        {/* Releases */}
        {releases.map((release, index) => (
          <div key={index} className="mb-12">
            {/* Release Header */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <h2 className="text-2xl font-bold text-[#111111]">v{release.version}</h2>
              <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                Latest
              </span>
              <span className="text-[#6B7280]">{release.date}</span>
            </div>

            {/* Release Card */}
            <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
              {/* Release Title Banner */}
              <div className="bg-gradient-to-r from-[#111111] to-[#374151] px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{release.title}</h3>
                    <p className="text-sm text-white/70">{release.description}</p>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="p-6">
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#6B7280]">What&apos;s Included</h4>
                <ul className="space-y-3">
                  {release.changes.map((change, changeIndex) => (
                    <li key={changeIndex} className="flex items-start gap-3">
                      <span className={`mt-0.5 rounded px-2 py-0.5 text-xs font-medium capitalize ${getTypeColor(change.type)}`}>
                        {change.type}
                      </span>
                      <span className="text-[#4A4A4A]">{change.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}

        {/* Get Started CTA */}
        <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#111111]">Ready to Get Started?</h2>
          <p className="mt-2 text-[#6B7280]">
            NewsAgent v1.0 is now available. Sign up for free and experience privacy-first AI news.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-[#111111] px-6 py-3 text-sm font-medium text-white hover:bg-[#000000] transition"
            >
              Get Started Free
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a 
              href="https://github.com/newsagent/newsagent" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-6 py-3 text-sm font-medium text-[#111111] hover:bg-[#F8F9FA] transition"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              View on GitHub
            </a>
          </div>
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
