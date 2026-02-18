import Link from 'next/link';
import NewsCarousel from '../components/NewsCarousel';

/**
 * NewsAgent Landing Page
 * Privacy-first AI-powered news aggregation
 * Design: Figma FSA-Rad node-id=91-33
 */

// Icons for feature cards
const CursorIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#0d0f1c" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#0d0f1c" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#0d0f1c" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const CodeIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#0d0f1c" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
  </svg>
);

const SearchIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

const ChartIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

// Trusted by badges
const badges = ['Research', 'Fintech', 'Journalism', 'Engineering'];

// Feature cards data
const features = [
  {
    icon: CursorIcon,
    title: 'Zero Friction',
    description: 'Just pick your interests. Our AI automatically discovers and configures the best RSS feeds for you.',
  },
  {
    icon: SparklesIcon,
    title: 'AI-Ranked Insights',
    description: 'Turn 50 articles into 5 actionable insights. Save hours of reading time every single day.',
  },
  {
    icon: ShieldIcon,
    title: '100% Private',
    description: 'Local AI processing via Ollama means your reading habits and data never leave your device.',
  },
  {
    icon: CodeIcon,
    title: 'Open Source',
    description: 'Auditable code, self-hosted option available, and free forever for personal use.',
  },
];

// How it works steps
const steps = [
  {
    icon: SearchIcon,
    title: 'Select Your Interests',
    description: 'Simply toggle topics like "AI", "Fintech", or "Healthcare". No need to hunt for RSS URLs.',
  },
  {
    icon: GlobeIcon,
    title: 'AI Discovers Feeds',
    description: 'Our agent scours the web for high-quality, relevant sources matching your criteria automatically.',
  },
  {
    icon: ChartIcon,
    title: 'Get Ranked Insights',
    description: 'Wake up to a daily digest. Articles are summarized, deduplicated, and ranked by relevance to your work.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111111]">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-[#111111]">NewsAgent</span>
          </div>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm font-medium text-[#6B7280] transition-colors hover:text-[#111111]">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-[#6B7280] transition-colors hover:text-[#111111]">
              How It Works
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-[#6B7280] transition-colors hover:text-[#111111]">
              Pricing
            </Link>
            <Link href="/docs" className="text-sm font-medium text-[#6B7280] transition-colors hover:text-[#111111]">
              Docs
            </Link>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-[#6B7280] transition-colors hover:text-[#111111] sm:block"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[#111111] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#000000]"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#F8F9FA]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left Content */}
            <div className="flex flex-col gap-6">
              {/* Version Badge */}
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#E5E7EB] px-3 py-1 text-xs font-medium text-[#4A4A4A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" />
                V1.0 NOW AVAILABLE
              </div>

              {/* Headline */}
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#111111] sm:text-5xl lg:text-[56px] lg:leading-[1.1]">
                AI-Powered News{' '}
                <span className="relative">
                  Intelligence
                  <span className="absolute -bottom-1 left-0 h-3 w-full bg-[#111111]/10" />
                </span>
                ,{' '}
                <span className="text-[#4A4A4A]">
                  100% Private
                </span>
              </h1>

              {/* Subheadline */}
              <p className="max-w-lg text-lg leading-relaxed text-[#4A4A4A]">
                Select your interests. Get ranked insights in minutes. No manual RSS setup required. Our local AI filters the noise so you don&apos;t have to.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg bg-[#111111] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-black/10 transition-all hover:bg-[#000000] hover:shadow-xl hover:shadow-black/15"
                >
                  Get Started Free
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-6 py-3 text-base font-semibold text-[#111111] transition-colors hover:bg-[#F8F9FA]"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  See How It Works
                </Link>
              </div>

              {/* Trust Signals */}
              <div className="flex flex-wrap items-center gap-4 pt-4 text-sm text-[#6B7280]">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#111111]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  No cloud data transmission
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#111111]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  GDPR/CCPA compliant
                </div>
              </div>
            </div>

            {/* Right Content - UI Mockup */}
            <div className="relative">
              {/* Floating dots decoration */}
              <div className="absolute -right-4 -top-4 flex gap-2">
                <div className="h-3 w-3 rounded-full bg-[#111111]" />
                <div className="h-3 w-3 rounded-full bg-[#6B7280]" />
                <div className="h-3 w-3 rounded-full bg-[#E5E7EB]" />
              </div>

              {/* Main Card */}
              <div className="relative rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-2xl shadow-black/5">
                {/* Card Header */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#111111]" />
                  <div>
                    <div className="h-3 w-24 rounded bg-[#E5E7EB]" />
                    <div className="mt-1 h-2 w-16 rounded bg-[#F8F9FA]" />
                  </div>
                </div>

                {/* AI Ranking Badge */}
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#F8F9FA] px-3 py-1.5 text-sm font-medium text-[#4A4A4A]">
                  <svg className="h-4 w-4 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  AI Ranking...
                </div>

                {/* Mock Content Lines */}
                <div className="space-y-3">
                  <div className="h-3 w-full rounded bg-[#F8F9FA]" />
                  <div className="h-3 w-5/6 rounded bg-[#F8F9FA]" />
                  <div className="h-3 w-4/6 rounded bg-[#F8F9FA]" />
                </div>

                {/* Bottom Stats */}
                <div className="mt-6 flex items-center justify-between border-t border-[#E5E7EB] pt-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-[#E5E7EB]" />
                    <div className="h-8 w-8 -ml-2 rounded-full bg-[#D1D5DB]" />
                    <div className="h-8 w-8 -ml-2 rounded-full bg-[#9CA3AF]" />
                  </div>
                  <div className="text-sm text-[#6B7280]">50 articles → 5 insights</div>
                </div>
              </div>

              {/* Floating Notification Card */}
              <div className="absolute -bottom-4 -left-4 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8F9FA]">
                    <svg className="h-5 w-5 text-[#111111]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111111]">Feed synced</p>
                    <p className="text-xs text-[#6B7280]">18 new articles</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="border-y border-[#E5E7EB] bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="text-sm font-medium text-[#6B7280]">TRUSTED BY PROS IN</span>
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-[#E5E7EB] bg-white px-4 py-1.5 text-sm font-medium text-[#111111]"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Live News Carousel */}
      <NewsCarousel />

      {/* Why Choose Section */}
      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[#111111] sm:text-4xl">
              Why Choose NewsAgent?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#4A4A4A]">
              Experience the future of news consumption. We&apos;ve redesigned the feed to respect your time and your privacy.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group rounded-xl border border-[#E5E7EB] bg-white p-6 transition-all hover:border-[#111111]/20 hover:shadow-lg hover:shadow-black/5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#F8F9FA] transition-colors group-hover:bg-[#E5E7EB]">
                  <feature.icon />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#111111]">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-[#4A4A4A]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-[#F8F9FA] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[#111111] sm:text-4xl">How It Works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#4A4A4A]">
              Three simple steps to smarter reading.
            </p>
          </div>

          {/* Steps */}
          <div className="mx-auto max-w-3xl space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-6">
                {/* Step Icon */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#111111] text-white">
                  <step.icon />
                </div>

                {/* Step Content */}
                <div className="pt-1">
                  <h3 className="text-lg font-semibold text-[#111111]">{step.title}</h3>
                  <p className="mt-1 text-[#4A4A4A]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id='pricing' className="bg-[#111111] py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to regain control of your news feed?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#9CA3AF]">
            Join thousands of analysts and engineers who save time with NewsAgent.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-[#111111] transition-colors hover:bg-[#F8F9FA]"
            >
              Get Started Free
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              View Documentation
            </Link>
          </div>

          <p className="mt-6 text-sm text-[#6B7280]">
            Free forever for individuals • No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111111]">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-[#111111]">NewsAgent</span>
              </div>
              <p className="mt-4 max-w-xs text-sm text-[#4A4A4A]">
                The private, AI-native news aggregator for knowledge workers. Filter the noise, focus on the signal.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-4 text-sm font-semibold text-[#111111]">Product</h4>
              <ul className="space-y-3 text-sm text-[#6B7280]">
                <li><Link href="#features" className="hover:text-[#111111]">Features</Link></li>
                <li><Link href="/integrations" className="hover:text-[#111111]">Integrations</Link></li>
                <li><Link href="#pricing" className="hover:text-[#111111]">Pricing</Link></li>
                <li><Link href="/changelog" className="hover:text-[#111111]">Changelog</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="mb-4 text-sm font-semibold text-[#111111]">Resources</h4>
              <ul className="space-y-3 text-sm text-[#6B7280]">
                <li><Link href="/docs" className="hover:text-[#111111]">Documentation</Link></li>
                <li><Link href="/docs#api-reference" className="hover:text-[#111111]">API Reference</Link></li>
                <li><Link href="/community" className="hover:text-[#111111]">Community</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-4 text-sm font-semibold text-[#111111]">Legal</h4>
              <ul className="space-y-3 text-sm text-[#6B7280]">
                <li><Link href="/privacy" className="hover:text-[#111111]">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#111111]">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 flex flex-wrap items-center justify-between border-t border-[#E5E7EB] pt-8">
            <p className="text-sm text-[#6B7280]">© 2026 NewsAgent Inc. MIT License</p>
            <div className="flex items-center gap-6">
              <span className="text-sm text-[#6B7280]">Powered by Ollama</span>
              <a href="https://github.com/newsagent/newsagent" target="_blank" rel="noopener noreferrer" className="text-sm text-[#6B7280] hover:text-[#111111]">GitHub</a>
              <a href="https://twitter.com/newsagent" target="_blank" rel="noopener noreferrer" className="text-sm text-[#6B7280] hover:text-[#111111]">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


