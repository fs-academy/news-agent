'use client';

import { useState, useEffect } from 'react';

/**
 * Service Status Banner Component
 * Shows status indicators when services are degraded or offline
 * Automatically checks health endpoints and displays warnings
 */
export default function ServiceStatusBanner() {
  const [status, setStatus] = useState({
    backend: 'checking',
    ai: 'checking',
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkServiceHealth();
    
    // Recheck every 30 seconds
    const interval = setInterval(checkServiceHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkServiceHealth = async () => {
    // Check backend health
    try {
      const backendResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/health`,
        { method: 'GET', signal: AbortSignal.timeout(5000) }
      );
      setStatus(prev => ({
        ...prev,
        backend: backendResponse.ok ? 'online' : 'degraded',
      }));
    } catch {
      setStatus(prev => ({ ...prev, backend: 'offline' }));
    }

    // Check AI service health (through backend proxy or direct)
    try {
      const aiResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/health`,
        { method: 'GET', signal: AbortSignal.timeout(5000) }
      );
      const data = await aiResponse.json();
      // If backend returns AI status, use it; otherwise assume available
      setStatus(prev => ({
        ...prev,
        ai: data?.services?.ai || (aiResponse.ok ? 'online' : 'degraded'),
      }));
    } catch {
      setStatus(prev => ({ ...prev, ai: 'unknown' }));
    }
  };

  // Don't show if dismissed or all services online
  if (dismissed) return null;
  if (status.backend === 'online' && (status.ai === 'online' || status.ai === 'unknown')) {
    return null;
  }
  if (status.backend === 'checking' && status.ai === 'checking') {
    return null;
  }

  const isOffline = status.backend === 'offline';
  const isDegraded = status.backend === 'degraded' || status.ai === 'degraded' || status.ai === 'offline';

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] sm:w-auto rounded-lg shadow-lg border px-4 py-3 ${
      isOffline 
        ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' 
        : 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800'
    }`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${isOffline ? 'text-red-500' : 'text-yellow-500'}`}>
          {isOffline ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isOffline ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
            {isOffline ? 'Connection Lost' : 'Limited Functionality'}
          </p>
          <p className={`text-xs mt-0.5 ${isOffline ? 'text-red-600 dark:text-red-300' : 'text-yellow-600 dark:text-yellow-300'}`}>
            {isOffline 
              ? 'Unable to connect to server. Please check your connection.'
              : status.ai === 'offline' || status.ai === 'degraded'
                ? 'AI summaries temporarily unavailable. Other features work normally.'
                : 'Some features may be slower than usual.'
            }
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          className={`flex-shrink-0 p-1 rounded hover:bg-black/10 ${
            isOffline ? 'text-red-500' : 'text-yellow-500'
          }`}
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Retry button for offline state */}
      {isOffline && (
        <button
          onClick={() => {
            setStatus({ backend: 'checking', ai: 'checking' });
            checkServiceHealth();
          }}
          className="mt-2 w-full text-xs font-medium text-red-700 dark:text-red-300 hover:underline"
        >
          Retry connection
        </button>
      )}
    </div>
  );
}

/**
 * Inline AI Status Indicator
 * Shows when AI features are unavailable inline with content
 */
export function AIStatusIndicator({ isAvailable = true, className = '' }) {
  if (isAvailable) return null;

  return (
    <div className={`flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 ${className}`}>
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>AI features limited</span>
    </div>
  );
}
