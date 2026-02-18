'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * ThemeContext - Provides app-wide theme management
 * Supports 'light', 'dark', and 'system' themes
 */
const ThemeContext = createContext(undefined);

/**
 * Apply theme to the document
 * @param {string} themeValue - 'light', 'dark', or 'system'
 */
function applyThemeToDocument(themeValue) {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  if (themeValue === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else if (themeValue === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Apply font size to the document
 * Converts 0-100 slider value to actual font size (14px-20px base)
 * @param {number} fontSizeValue - 0-100 slider value
 */
function applyFontSizeToDocument(fontSizeValue) {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  // Map 0-100 to 14px-20px (6px range)
  const baseFontSize = 14 + (fontSizeValue / 100) * 6;
  root.style.setProperty('--base-font-size', `${baseFontSize}px`);
  // Also set on body for inheritance
  root.style.fontSize = `${baseFontSize}px`;
}

/**
 * ThemeProvider component
 * Wraps the app to provide theme context to all children
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('light');
  const [fontSize, setFontSizeState] = useState(50);
  const [mounted, setMounted] = useState(false);

  // Initialize theme and fontSize from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const storedTheme = localStorage.getItem('theme') || 'light';
    const storedFontSize = parseInt(localStorage.getItem('fontSize') || '50', 10);
    setThemeState(storedTheme);
    setFontSizeState(storedFontSize);
    applyThemeToDocument(storedTheme);
    applyFontSizeToDocument(storedFontSize);
    setMounted(true);

    // Listen for system theme changes when using 'system' theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (localStorage.getItem('theme') === 'system') {
        applyThemeToDocument('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update theme and persist to localStorage
  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    applyThemeToDocument(newTheme);
  }, []);

  // Update fontSize and persist to localStorage
  const setFontSize = useCallback((newFontSize) => {
    const size = parseInt(newFontSize, 10);
    setFontSizeState(size);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fontSize', size.toString());
    }
    applyFontSizeToDocument(size);
  }, []);

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use theme context
 * @returns {{ theme: string, setTheme: (theme: string) => void, fontSize: number, setFontSize: (fontSize: number) => void }}
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
