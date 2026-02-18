'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import heroImage from '../../../public/images/heroImageSignup.svg';
import { signup, initiateOAuthLogin, handleOAuthCallback, isOAuthCallback, removeAuthToken } from '../../lib/api';

/**
 * NewsAgent Signup Page
 * Split-screen design with branding and signup form
 */

// Icons
const UserIcon = () => (
  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const EmailIcon = () => (
  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const LockIcon = () => (
  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const EyeIcon = ({ onClick, visible }) => (
  <button type="button" onClick={onClick} className="text-gray-400 hover:text-gray-600 focus:outline-none">
    {visible ? (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    ) : (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )}
  </button>
);

const CheckIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="h-5 w-5 text-[#111111]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const GitHubIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

/**
 * Validates email format using RFC 5322 compliant regex
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
const validatePasswordStrength = (password) => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  return { isValid: true, message: '' };
};

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState('');

  // Clear any existing auth data on signup page mount (unless OAuth callback)
  // This ensures clean state for new signup attempts
  useEffect(() => {
    if (!isOAuthCallback()) {
      removeAuthToken();
      localStorage.removeItem('user');
    }
  }, []);

  // Handle OAuth callback on page load
  useEffect(() => {
    if (isOAuthCallback()) {
      const result = handleOAuthCallback();
      
      if (result.success && result.user) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Redirect based on onboarding status
        if (!result.user.onboardingComplete) {
          window.location.href = '/onboarding';
        } else {
          window.location.href = '/dashboard';
        }
      } else if (result.error) {
        setError(result.error);
      }
    }
  }, []);

  // Handle OAuth button click
  const handleOAuthClick = (provider) => {
    setError('');
    setOauthLoading(provider);
    initiateOAuthLogin(provider);
  };

  /**
   * Validates all signup form fields
   * @returns {boolean} True if all fields are valid
   */
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Full name validation
    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
      isValid = false;
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
      isValid = false;
    } else if (fullName.trim().length > 100) {
      errors.fullName = 'Full name must be less than 100 characters';
      isValid = false;
    } else if (!/^[a-zA-Z\s'-]+$/.test(fullName.trim())) {
      errors.fullName = 'Full name can only contain letters, spaces, hyphens, and apostrophes';
      isValid = false;
    }

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email address is required';
      isValid = false;
    } else if (email.trim() !== email.trim().toLowerCase()) {
      errors.email = 'Email must contain only lowercase letters';
      isValid = false;
    } else if (!isValidEmail(email.trim())) {
      errors.email = 'Please enter a valid email address (e.g., name@company.com)';
      isValid = false;
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else {
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.message;
        isValid = false;
      }
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (password && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    // Terms agreement validation
    if (!agreeToTerms) {
      errors.terms = 'You must agree to the Terms of Service and Privacy Policy';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  /**
   * Clears field error when user starts typing
   * @param {string} field - Field name to clear error for
   */
  const clearFieldError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validate all fields
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await signup({
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim()
      });

      if (response.success) {
        // Store user data in localStorage for onboarding
        localStorage.setItem('user', JSON.stringify(response.user));
        // Use window.location for more reliable navigation after auth
        window.location.href = '/onboarding';
      } else {
        setError(response.message || 'Registration failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      // Handle specific error cases
      if (err.status === 409) {
        setError('This email is already registered. Please login or use a different email.');
      } else if (err.status === 400) {
        setError(err.message || 'Invalid input. Please check your details.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-[#111111] p-8 relative overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-2 z-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
            <svg className="h-5 w-5 text-[#111111]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-white">NewsAgent</span>
        </div>

        {/* Center Content - Image */}
        <div className="flex flex-1 items-center justify-center py-12 z-10">
          <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <Image
              src={heroImage}
              alt="AI-powered news visualization"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Bottom Content - Tagline */}
        <div className="z-10">
          <h2 className="text-3xl font-bold text-white mb-2">
            Your AI-powered news<br />
            <span className="text-[#E5E7EB]">intelligence</span>
          </h2>
          <p className="text-[#9CA3AF] text-base max-w-sm">
            Cut through the noise. Get synthesized insights tailored to your professional interests, processed privately on your device.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 z-10">
          <p className="text-gray-400 text-sm">© 2026 NewsAgent Inc.</p>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-white px-6 py-8 sm:px-12 overflow-y-auto">
        {/* Mobile Logo */}
        <div className="flex items-center gap-2 mb-6 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111111]">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-[#111111]">NewsAgent</span>
        </div>

        <div className="w-full max-w-md">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#111111] uppercase tracking-wide">Sign Up</span>
              <div className="h-0.5 w-12 bg-[#111111] rounded-full" />
            </div>
            <span className="text-sm text-[#6B7280]">Step 1 of 2</span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#111111]">Create your account</h1>
            <p className="mt-1 text-[#6B7280]">Start getting AI-powered news insights in minutes.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-[#111111] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon />
                </div>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    clearFieldError('fullName');
                  }}
                  placeholder="e.g. Sarah Connor"
                  className={`block w-full pl-10 pr-4 py-2.5 border rounded-lg text-[#111111] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:border-transparent transition-colors ${
                    fieldErrors.fullName ? 'border-red-500 bg-red-50' : 'border-[#E5E7EB]'
                  }`}
                  aria-invalid={!!fieldErrors.fullName}
                  aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
                />
              </div>
              {fieldErrors.fullName && (
                <p id="fullName-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

            {/* Work Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#111111] mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EmailIcon />
                </div>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                  }}
                  placeholder="name@company.com"
                  autoComplete="email"
                  className={`block w-full pl-10 pr-4 py-2.5 border rounded-lg text-[#111111] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:border-transparent transition-colors ${
                    fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-[#E5E7EB]'
                  }`}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
              </div>
              {fieldErrors.email ? (
                <p id="email-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.email}
                </p>
              ) : email && (
                <div id="email-requirements" className="mt-1.5 text-xs text-gray-500">
                  <p className={isValidEmail(email.trim()) ? 'text-green-600' : ''}>
                    {isValidEmail(email.trim()) ? '✓' : '•'} Valid email format (e.g., name@company.com)
                  </p>
                  <p className={email.trim() === email.trim().toLowerCase() ? 'text-green-600' : 'text-red-600'}>
                    {email.trim() === email.trim().toLowerCase() ? '✓' : '✗'} Lowercase letters only
                  </p>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#111111] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError('password');
                  }}
                  placeholder="Create a password"
                  className={`block w-full pl-10 pr-12 py-2.5 border rounded-lg text-[#111111] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:border-transparent transition-colors ${
                    fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-[#E5E7EB]'
                  }`}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : 'password-requirements'}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <EyeIcon onClick={() => setShowPassword(!showPassword)} visible={showPassword} />
                </div>
              </div>

              {/* Password requirements or error */}
              {fieldErrors.password ? (
                <p id="password-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.password}
                </p>
              ) : password && (
                <div id="password-requirements" className="mt-1.5 text-xs text-gray-500">
                  <p className={password.length >= 8 ? 'text-green-600' : ''}>
                    {password.length >= 8 ? '✓' : '•'} At least 8 characters
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#111111] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearFieldError('confirmPassword');
                  }}
                  placeholder="Confirm your password"
                  className={`block w-full pl-10 pr-12 py-2.5 border rounded-lg text-[#111111] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:border-transparent transition-colors ${
                    fieldErrors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-[#E5E7EB]'
                  }`}
                  aria-invalid={!!fieldErrors.confirmPassword}
                  aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <EyeIcon onClick={() => setShowConfirmPassword(!showConfirmPassword)} visible={showConfirmPassword} />
                </div>
              </div>
              {fieldErrors.confirmPassword && (
                <p id="confirmPassword-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.confirmPassword}
                </p>
              )}
              {/* Show match indicator when both passwords entered */}
              {confirmPassword && password && !fieldErrors.confirmPassword && password === confirmPassword && (
                <p className="mt-1.5 text-sm text-green-600 flex items-center gap-1">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Passwords match
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div>
              <div className="flex items-start gap-2">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => {
                    setAgreeToTerms(e.target.checked);
                    clearFieldError('terms');
                  }}
                  className={`mt-1 h-4 w-4 rounded text-[#111111] focus:ring-[#111111] cursor-pointer ${
                    fieldErrors.terms ? 'border-red-500' : 'border-[#E5E7EB]'
                  }`}
                  aria-invalid={!!fieldErrors.terms}
                  aria-describedby={fieldErrors.terms ? 'terms-error' : undefined}
                />
                <label htmlFor="terms" className="text-sm text-[#6B7280] cursor-pointer">
                  I agree to the{' '}
                  <Link href="/terms" className="font-medium text-[#111111] hover:text-[#4A4A4A]">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="font-medium text-[#111111] hover:text-[#4A4A4A]">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>
              {fieldErrors.terms && (
                <p id="terms-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.terms}
                </p>
              )}
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#111111] text-white font-semibold rounded-lg hover:bg-[#000000] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  Create Account
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500 uppercase text-xs tracking-wide">or sign up with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuthClick('google')}
              disabled={oauthLoading !== ''}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#111111] hover:bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading === 'google' ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <GoogleIcon />
              )}
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuthClick('github')}
              disabled={oauthLoading !== ''}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#111111] hover:bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading === 'github' ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <GitHubIcon />
              )}
              GitHub
            </button>
          </div>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-[#6B7280]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#111111] hover:text-[#4A4A4A]">
              Sign in
            </Link>
          </p>

          {/* Privacy Trust Badge */}
          <div className="mt-6 p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg">
            <div className="flex items-start gap-3">
              <ShieldIcon />
              <div>
                <p className="text-sm font-medium text-[#111111]">Your data stays local</p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  We never transmit your reading activity to external servers. Intelligence runs on your device.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
