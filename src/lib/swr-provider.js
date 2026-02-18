'use client';

import { SWRConfig } from 'swr';

/**
 * Default fetcher for SWR
 * @param {string} url - The URL to fetch
 * @returns {Promise<any>} Parsed JSON response
 */
const fetcher = (url) => fetch(url).then((res) => res.json());

/**
 * SWR Provider with offline support and caching
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function SWRProvider({ children }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateIfStale: true,
        dedupingInterval: 5000,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
