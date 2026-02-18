'use client';

import Link from 'next/link';

/**
 * Integrations Page
 * Core technologies powering NewsAgent
 */
export default function IntegrationsPage() {
  const integrations = [
    {
      name: 'Ollama',
      description: 'Local AI processing for article ranking and summarization. Run LLMs like Llama 2 and Mistral privately on your own hardware.',
      status: 'core',
      icon: '🤖',
      category: 'AI Processing',
    },
    {
      name: 'News API',
      description: 'Access to 80,000+ news sources worldwide including Bloomberg, Reuters, and major publications.',
      status: 'core',
      icon: '📰',
      category: 'Data Source',
    },
    {
      name: 'MongoDB',
      description: 'Flexible document database for storing articles, user preferences, and collections.',
      status: 'core',
      icon: '🗄️',
      category: 'Database',
    },
    {
      name: 'Next.js',
      description: 'React framework for the frontend with server-side rendering and API routes.',
      status: 'core',
      icon: '⚛️',
      category: 'Frontend',
    },
    {
      name: 'FastAPI',
      description: 'Python backend for AI services with high performance async support.',
      status: 'core',
      icon: '🐍',
      category: 'Backend',
    },
    {
      name: 'Fastify',
      description: 'Node.js backend for API routes with low overhead and plugin architecture.',
      status: 'core',
      icon: '🚀',
      category: 'Backend',
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

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-[#111111]">Technology Stack</h1>
          <p className="mt-4 text-lg text-[#6B7280]">
            The core technologies powering NewsAgent&apos;s privacy-first news aggregation.
          </p>
        </div>

        {/* Core Technologies */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-[#111111]">Core Technologies</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {integrations.filter(i => i.status === 'core').map((integration) => (
              <div key={integration.name} className="rounded-xl border border-[#E5E7EB] p-6 hover:border-[#111111] transition">
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{integration.icon}</span>
                  <span className="rounded-full bg-[#111111] px-2 py-1 text-xs font-medium text-white">Core</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#111111]">{integration.name}</h3>
                <p className="mt-2 text-sm text-[#6B7280]">{integration.description}</p>
                <p className="mt-3 text-xs text-[#6B7280]">{integration.category}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture Highlights */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-[#111111]">Architecture Highlights</h2>
          <div className="rounded-xl border border-[#E5E7EB] p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-semibold text-[#111111]">🔒 Privacy-First Design</h3>
                <p className="mt-2 text-sm text-[#6B7280]">
                  All AI processing happens locally with Ollama. Your reading habits and summaries never leave your machine.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#111111]">⚡ Local-First Performance</h3>
                <p className="mt-2 text-sm text-[#6B7280]">
                  Articles are processed locally after fetching. Works offline with cached content.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#111111]">🎯 Smart Ranking</h3>
                <p className="mt-2 text-sm text-[#6B7280]">
                  Ollama-powered relevance scoring ranks articles by your interests in under 30 seconds.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#111111]">📊 Graceful Degradation</h3>
                <p className="mt-2 text-sm text-[#6B7280]">
                  If Ollama is unavailable, the app falls back to chronological ordering seamlessly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Open Source */}
        <section className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-8 text-center">
          <h2 className="text-xl font-semibold text-[#111111]">Open Source</h2>
          <p className="mt-2 text-[#6B7280]">
            NewsAgent is MIT licensed. Explore the codebase and contribute.
          </p>
          <a 
            href="https://github.com/newsagent/newsagent" 
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#111111] px-6 py-3 text-sm font-medium text-white hover:bg-[#000000] transition"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            View on GitHub
          </a>
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
