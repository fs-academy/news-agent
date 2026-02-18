'use client';

import Link from 'next/link';

/**
 * Community Page
 * NewsAgent community resources and contribution guide
 */
export default function CommunityPage() {
  const resources = [
    {
      title: 'GitHub Repository',
      description: 'Browse the source code, report issues, and contribute to NewsAgent development.',
      icon: '🐙',
      link: 'https://github.com/newsagent/newsagent',
      cta: 'View Repository',
    },
    {
      title: 'GitHub Issues',
      description: 'Report bugs, request features, and track development progress.',
      icon: '🐛',
      link: 'https://github.com/newsagent/newsagent/issues',
      cta: 'View Issues',
    },
  ];

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

      {/* Hero */}
      <section className="border-b border-[#E5E7EB] bg-[#F8F9FA] py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-[#111111]">Community</h1>
          <p className="mt-4 text-lg text-[#6B7280]">
            NewsAgent is an open-source project. We welcome contributions and feedback!
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Getting Started Notice */}
        <section className="mb-12 rounded-xl border-2 border-dashed border-[#E5E7EB] bg-[#F8F9FA] p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#111111]">We&apos;re Just Getting Started</h2>
          <p className="mt-2 text-[#6B7280]">
            NewsAgent is in early development. Now is a great time to get involved and help shape the project!
          </p>
        </section>

        {/* GitHub Links */}
        <section className="mb-16">
          <h2 className="mb-8 text-2xl font-semibold text-[#111111]">Get Involved</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {resources.map((resource) => (
              <a
                key={resource.title}
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-[#E5E7EB] p-6 hover:border-[#111111] hover:shadow-lg transition"
              >
                <span className="text-4xl">{resource.icon}</span>
                <h3 className="mt-4 text-lg font-semibold text-[#111111] group-hover:underline">{resource.title}</h3>
                <p className="mt-2 text-[#6B7280]">{resource.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#111111]">
                  {resource.cta}
                  <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Contributing */}
        <section className="mb-16">
          <h2 className="mb-8 text-2xl font-semibold text-[#111111]">How to Contribute</h2>
          <div className="rounded-xl border border-[#E5E7EB] p-8">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold text-[#111111]">🐛 Report Bugs</h3>
                <p className="mt-2 text-[#6B7280]">
                  Found a bug? Open an issue on GitHub with steps to reproduce.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#111111]">💡 Suggest Features</h3>
                <p className="mt-2 text-[#6B7280]">
                  Have an idea? Open an issue to discuss your feature request.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#111111]">📝 Improve Docs</h3>
                <p className="mt-2 text-[#6B7280]">
                  Help us improve documentation. Every correction helps.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#111111]">🛠️ Submit Code</h3>
                <p className="mt-2 text-[#6B7280]">
                  Fork the repo, make changes, and submit a pull request.
                </p>
              </div>
            </div>
            <div className="mt-8 border-t border-[#E5E7EB] pt-8 text-center">
              <a 
                href="https://github.com/newsagent/newsagent"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#111111] px-6 py-3 text-sm font-medium text-white hover:bg-[#000000] transition"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Get Started on GitHub
              </a>
            </div>
          </div>
        </section>

        {/* Code of Conduct */}
        <section className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-8">
          <h2 className="text-xl font-semibold text-[#111111]">Code of Conduct</h2>
          <p className="mt-4 text-[#6B7280]">
            We are committed to providing a welcoming and inclusive community. All participants are expected to:
          </p>
          <ul className="mt-4 space-y-2 text-[#4A4A4A]">
            <li>• Be respectful and considerate</li>
            <li>• Use welcoming and inclusive language</li>
            <li>• Accept constructive feedback gracefully</li>
            <li>• Focus on what is best for the community</li>
          </ul>
        </section>
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
