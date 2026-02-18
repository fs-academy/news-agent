'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from './api';
import { getStoredUser } from './auth';

/**
 * Higher-order component to protect routes that require authentication
 * @param {React.ComponentType} WrappedComponent - Component to protect
 * @param {Object} options - Protection options
 * @param {boolean} options.requireOnboarding - If true, redirect to onboarding if not completed
 * @returns {React.ComponentType} Protected component
 */
export function withAuth(WrappedComponent, { requireOnboarding = true } = {}) {
  return function ProtectedComponent(props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const storedUser = getStoredUser();
      if (!storedUser) {
        router.push('/login');
        return;
      }

      if (requireOnboarding && !storedUser.onboardingComplete) {
        router.push('/onboarding');
        return;
      }

      setUser(storedUser);
      setIsLoading(false);
    }, [router]);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-8 w-8 text-[#111111]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} user={user} />;
  };
}

/**
 * Hook to get current authenticated user
 * @returns {Object} { user, isLoading, isAuthenticated }
 */
export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    const storedUser = getStoredUser();

    if (token && storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}

/**
 * Hook to require authentication and redirect if not authenticated
 * @param {Object} options - Options
 * @param {boolean} options.requireOnboarding - If true, redirect to onboarding if not completed
 * @returns {Object} { user, isLoading }
 */
export function useRequireAuth({ requireOnboarding = true } = {}) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push('/login');
      return;
    }

    if (requireOnboarding && !storedUser.onboardingComplete) {
      router.push('/onboarding');
      return;
    }

    setUser(storedUser);
    setIsLoading(false);
  }, [router, requireOnboarding]);

  return { user, isLoading };
}
