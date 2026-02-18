'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '../../lib/api';

/**
 * NewsAgent Forgot Password Page
 * Allows users to request a password reset email
 */

// Icons
const EmailIcon = () => (
  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const BackIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="h-16 w-16 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await forgotPassword(email.trim().toLowerCase());
      // Store any special message from the server (e.g., OAuth account notice)
      if (response.message) {
        setSuccessMessage(response.message);
      }
      setIsSuccess(true);
    } catch (err) {
      // Don't reveal if email exists or not for security
      // Always show success message to prevent email enumeration
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4">
        <div className="w-full max-w-md text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#111111]">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-[#111111]">NewsAgent</span>
          </div>

          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <CheckCircleIcon />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-[#111111] mb-4">Check your email</h1>
          {successMessage ? (
            <p className="text-[#6B7280] mb-6">{successMessage}</p>
          ) : (
            <p className="text-[#6B7280] mb-6">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link. 
              Please check your inbox and spam folder.
            </p>
          )}
          <p className="text-sm text-[#6B7280] mb-8">
            The link will expire in 1 hour for security reasons.
          </p>

          {/* Actions */}
          <div className="space-y-4">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 py-3 px-4 bg-[#111111] text-white font-semibold rounded-lg hover:bg-[#000000] transition-colors"
            >
              Back to Sign In
            </Link>
            <button
              onClick={() => {
                setIsSuccess(false);
                setEmail('');
              }}
              className="inline-flex w-full items-center justify-center gap-2 py-3 px-4 border border-[#E5E7EB] text-[#111111] font-medium rounded-lg hover:bg-[#F8F9FA] transition-colors"
            >
              Try a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#111111]">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-[#111111]">NewsAgent</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-8">
          {/* Back Link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111111] mb-6 transition-colors"
          >
            <BackIcon />
            Back to Sign In
          </Link>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#111111]">Forgot password?</h1>
            <p className="mt-2 text-[#6B7280]">
              No worries! Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#111111] mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EmailIcon />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-4 py-3 border border-[#E5E7EB] rounded-lg text-[#111111] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:border-transparent transition-colors"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#111111] text-white font-semibold rounded-lg hover:bg-[#000000] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-[#6B7280]">
            Remember your password?{' '}
            <Link href="/login" className="font-semibold text-[#111111] hover:text-[#4A4A4A]">
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-[#6B7280]">
          © 2026 NewsAgent Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}

