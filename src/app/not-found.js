'use client';

import Link from 'next/link';

/**
 * 404 Not Found Page
 * Displayed when a page is not found
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#E5E7EB] bg-white">
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
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* 404 Illustration */}
          <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-[#F8F9FA]">
            <svg className="h-16 w-16 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>

          {/* Error Code */}
          <h1 className="text-8xl font-bold text-[#111111]">404</h1>
          
          {/* Error Message */}
          <h2 className="mt-4 text-2xl font-semibold text-[#111111]">Page Not Found</h2>
          <p className="mt-4 max-w-md text-[#6B7280]">
            Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved. 
            Let&apos;s get you back on track.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-[#111111] px-6 py-3 text-sm font-medium text-white hover:bg-[#000000] transition"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Go to Homepage
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-6 py-3 text-sm font-medium text-[#111111] hover:bg-[#F8F9FA] transition"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              Go to Dashboard
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 border-t border-[#E5E7EB] pt-8">
            <p className="text-sm text-[#6B7280]">Here are some helpful links:</p>
            <div className="mt-4 flex flex-wrap justify-center gap-6">
              <Link href="/docs" className="text-sm text-[#111111] hover:underline">Documentation</Link>
              <Link href="/search" className="text-sm text-[#111111] hover:underline">Search</Link>
              <Link href="/settings" className="text-sm text-[#111111] hover:underline">Settings</Link>
              <Link href="/collections" className="text-sm text-[#111111] hover:underline">Collections</Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-[#6B7280]">© 2026 NewsAgent Inc.</p>
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
