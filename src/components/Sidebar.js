'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '../lib/auth';
import { LogoutConfirmDialog, useLogoutDialog } from './LogoutConfirmDialog';

/**
 * Shared Sidebar Component
 * Used across Dashboard, Collections, Search, and Settings pages
 * Supports both desktop (fixed) and mobile (drawer) modes
 */
export default function Sidebar({ user, isOpen, onClose }) {
  const pathname = usePathname();
  const { showDialog, handleLogoutClick, handleConfirmLogout, handleCloseDialog } = useLogoutDialog(logout);
  
  // Get user initials for avatar
  const userInitials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: <HomeIcon /> },
    { href: '/collections', label: 'Collections', icon: <CollectionsIcon /> },
    { href: '/search', label: 'Search', icon: <SearchIcon /> },
    { href: '/settings', label: 'Settings', icon: <SettingsIcon /> },
  ];

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] lg:w-[200px] flex-col border-r border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo + Close button for mobile */}
        <div className="flex items-center justify-between px-5 py-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111111]">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-[#111111] dark:text-white">NewsAgent</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href === '/settings' && pathname?.startsWith('/settings'));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#111111]/10 text-[#111111] dark:bg-white/10 dark:text-white'
                    : 'text-[#6B7280] dark:text-gray-400 hover:bg-[#F8F9FA] dark:hover:bg-gray-700 hover:text-[#111111] dark:hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section - Responsive for long names */}
        <div className="border-t border-[#E5E7EB] dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 min-w-0">
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt="User avatar" 
                className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#111111] text-sm font-medium text-white">
                {userInitials}
              </div>
            )}
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-medium text-[#111111] dark:text-white truncate" title={user?.fullName || 'User'}>
                {user?.fullName || 'User'}
              </p>
              <p className="text-xs text-[#6B7280] dark:text-gray-400 truncate" title={user?.email || ''}>
                {user?.email || ''}
              </p>
            </div>
            <div className="relative group flex-shrink-0">
              <button 
                onClick={handleLogoutClick}
                className="text-[#6B7280] hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                aria-label="Logout"
              >
                <LogoutIcon />
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Logout
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        isOpen={showDialog}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}

/**
 * Mobile Header Component - Shared across pages
 */
export function MobileHeader({ onMenuClick }) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-[#E5E7EB] dark:border-gray-700">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111111]">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <span className="text-lg font-semibold text-[#111111] dark:text-white">NewsAgent</span>
      </div>
      <button
        onClick={onMenuClick}
        className="p-2 text-[#6B7280] hover:bg-[#F8F9FA] dark:hover:bg-gray-700 rounded-lg"
        aria-label="Open menu"
      >
        <HamburgerIcon />
      </button>
    </header>
  );
}

// Icon Components
function HomeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function CollectionsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
