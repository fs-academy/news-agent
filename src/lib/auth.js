/**
 * Authentication utilities for NewsAgent
 * Provides hooks and helpers for managing auth state across the app
 */

import { getAuthToken, removeAuthToken, getCurrentUser } from './api';

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has a valid token
 */
export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  return !!getAuthToken();
}

/**
 * Get current user from localStorage
 * @returns {Object|null} User object or null if not found
 */
export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

/**
 * Store user in localStorage
 * @param {Object} user - User object to store
 */
export function storeUser(user) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Clear all auth data from localStorage
 */
export function clearAuthData() {
  if (typeof window === 'undefined') return;
  removeAuthToken();
  localStorage.removeItem('user');
}

/**
 * Logout user and redirect to login page
 */
export function logout() {
  clearAuthData();
  window.location.href = '/login';
}

/**
 * Validate token by fetching current user from API
 * @returns {Promise<Object|null>} User object if valid, null otherwise
 */
export async function validateSession() {
  if (!isAuthenticated()) return null;
  
  try {
    const response = await getCurrentUser();
    if (response.success && response.user) {
      storeUser(response.user);
      return response.user;
    }
    return null;
  } catch {
    // Token is invalid or expired
    clearAuthData();
    return null;
  }
}

/**
 * Check if user has completed onboarding
 * @returns {boolean} True if onboarding is complete
 */
export function hasCompletedOnboarding() {
  const user = getStoredUser();
  return user?.onboardingComplete === true;
}

/**
 * Redirect user based on auth status
 * @param {Object} options - Redirect options
 * @param {boolean} options.requireAuth - If true, redirect to login if not authenticated
 * @param {boolean} options.requireOnboarding - If true, redirect to onboarding if not completed
 * @param {string} options.redirectTo - Custom redirect URL
 * @returns {string|null} Redirect URL or null if no redirect needed
 */
export function getAuthRedirect({ requireAuth = false, requireOnboarding = false, redirectTo = null } = {}) {
  const authenticated = isAuthenticated();
  const user = getStoredUser();
  
  if (requireAuth && !authenticated) {
    return '/login';
  }
  
  if (requireOnboarding && authenticated && user && !user.onboardingComplete) {
    return '/onboarding';
  }
  
  if (redirectTo && authenticated) {
    return redirectTo;
  }
  
  return null;
}
