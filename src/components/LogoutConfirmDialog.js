'use client';

import { useState } from 'react';

/**
 * Logout confirmation dialog component
 * Shows a modal to confirm logout action
 * Responsive for mobile, tablet, and desktop views
 */
export function LogoutConfirmDialog({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog - Responsive sizing */}
      <div className="relative z-10 w-full max-w-[calc(100vw-2rem)] sm:max-w-sm md:max-w-md rounded-xl bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-xl mx-auto">
        {/* Icon - Smaller on mobile */}
        <div className="mx-auto mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>

        {/* Title - Responsive text */}
        <h3 className="mb-1.5 sm:mb-2 text-center text-base sm:text-lg font-semibold text-[#111111] dark:text-white">
          Confirm Logout
        </h3>

        {/* Description - Responsive text and spacing */}
        <p className="mb-4 sm:mb-6 text-center text-xs sm:text-sm text-[#6B7280] dark:text-gray-400 px-2 sm:px-0">
          Are you sure you want to log out? You will need to sign in again to access your account.
        </p>

        {/* Actions - Stack on very small screens, side by side otherwise */}
        <div className="flex flex-col-reverse xs:flex-row gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#E5E7EB] dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-[#4A4A4A] dark:text-gray-300 transition hover:bg-[#F8F9FA] dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-600 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white transition hover:bg-red-700 active:bg-red-800"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage logout confirmation dialog state
 * @param {Function} logoutFn - The logout function to call on confirmation
 * @returns {Object} { showDialog, setShowDialog, handleLogoutClick, handleConfirmLogout }
 */
export function useLogoutDialog(logoutFn) {
  const [showDialog, setShowDialog] = useState(false);

  const handleLogoutClick = () => {
    setShowDialog(true);
  };

  const handleConfirmLogout = () => {
    setShowDialog(false);
    logoutFn();
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };

  return {
    showDialog,
    setShowDialog,
    handleLogoutClick,
    handleConfirmLogout,
    handleCloseDialog,
  };
}
