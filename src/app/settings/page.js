'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthToken, updateProfile, getCurrentUser } from '../../lib/api';
import { getStoredUser, storeUser } from '../../lib/auth';
import Sidebar, { MobileHeader } from '../../components/Sidebar';
import { useTheme } from '../../context/ThemeContext';

/**
 * NewsAgent Settings Page
 * Comprehensive settings for profile, interests, and appearance
 * Matches Figma design from FSA-Rad node 119-75
 */

// Default settings values
const DEFAULT_SETTINGS = {
  theme: 'light',
  fontSize: 50,
  articlesPerPage: 20,
};

/**
 * Topic definitions - must match onboarding topics
 */
const TOPICS = [
  { id: 'ai-ml', name: 'AI & ML', icon: '🤖' },
  { id: 'fintech', name: 'Fintech', icon: '💰' },
  { id: 'biotech', name: 'Biotech', icon: '🧬' },
  { id: 'security', name: 'Security', icon: '🔒' },
  { id: 'startups', name: 'Startups', icon: '🚀' },
  { id: 'tech-news', name: 'Tech News', icon: '📱' },
  { id: 'markets', name: 'Markets', icon: '📈' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'politics', name: 'Politics', icon: '🏛️' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'design', name: 'Design', icon: '🎨' },
  { id: 'web3', name: 'Web3', icon: '⛓️' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme: setGlobalTheme, fontSize: globalFontSize, setFontSize: setGlobalFontSize } = useTheme();
  const [activeSection, setActiveSection] = useState('profile');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const userInitials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  
  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);
  
  // Flag to skip hasChanges recalculation right after save
  const [justSaved, setJustSaved] = useState(false);
  
  // Original values for cancel functionality
  const [originalValues, setOriginalValues] = useState({});

  // Profile state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // Interests state
  const [professionalRole, setProfessionalRole] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState('');

  // Avatar upload state
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Appearance state (theme and fontSize from context, local state for form tracking)
  const [localTheme, setLocalTheme] = useState(theme);
  const [fontSize, setFontSize] = useState(globalFontSize || DEFAULT_SETTINGS.fontSize);

  // Settings section navigation items (for top bar)
  const sectionItems = [
    { id: 'profile', label: 'Profile', icon: <ProfileIcon /> },
    { id: 'interests', label: 'Interests', icon: <InterestsIcon /> },
    { id: 'appearance', label: 'Appearance', icon: <AppearanceIcon /> },
  ];

  /**
   * Initialize form values from user data
   */
  const initializeFormValues = useCallback((userData) => {
    const settings = userData.settings || DEFAULT_SETTINGS;
    
    // Profile
    setFullName(userData.fullName || '');
    setEmail(userData.email || '');
    
    // Interests - convert backend role format to display format
    // e.g., "software_engineer" -> "Software Engineer"
    const roleDisplay = userData.role?.replace(/_/g, ' ') || '';
    const capitalizedRole = roleDisplay.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    // Map to exact dropdown value
    const roleMapping = {
      'Software Engineer': 'Software Engineer',
      'Product Manager': 'Product Manager',
      'Research Analyst': 'Research Analyst',
      'Journalist': 'Journalist / Creator',
      'Business Consultant': 'Business Consultant',
      'Other': 'Other',
    };
    const mappedRole = roleMapping[capitalizedRole] || capitalizedRole || 'Other';
    setProfessionalRole(mappedRole);
    setSelectedTopics(userData.interests || []);
    
    // Avatar
    setAvatarUrl(userData.avatarUrl || null);
    
    // Appearance - set both local and global theme
    const themeValue = settings.theme || DEFAULT_SETTINGS.theme;
    setLocalTheme(themeValue);
    setFontSize(settings.fontSize ?? DEFAULT_SETTINGS.fontSize);
    
    // Store original values for cancel (use the mapped role, including avatarUrl)
    setOriginalValues({
      fullName: userData.fullName || '',
      email: userData.email || '',
      professionalRole: mappedRole,
      selectedTopics: userData.interests || [],
      theme: themeValue,
      fontSize: settings.fontSize ?? DEFAULT_SETTINGS.fontSize,
      avatarUrl: userData.avatarUrl || null,
    });
    
    setHasChanges(false);
  }, []);

  /**
   * Fetch user data from backend
   */
  const fetchUserData = useCallback(async () => {
    try {
      const response = await getCurrentUser();
      if (response.success && response.user) {
        setUser(response.user);
        storeUser(response.user);
        initializeFormValues(response.user);
        return response.user.interests || [];
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      // Fall back to stored user data
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        initializeFormValues(storedUser);
        return storedUser.interests || [];
      }
    }
    return [];
  }, [initializeFormValues]);

  // Check authentication and fetch user data on mount
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    // First load from localStorage for immediate display
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      initializeFormValues(storedUser);
    }
    
    // Fetch fresh data from backend
    const loadData = async () => {
      await fetchUserData();
      setIsLoading(false);
    };
    
    loadData();
  }, [router, fetchUserData, initializeFormValues]);

  /**
   * Sync local theme state with global theme on mount
   */
  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  /**
   * Apply theme change to global context when local theme changes
   */
  const handleThemeChange = (newTheme) => {
    setLocalTheme(newTheme);
    setGlobalTheme(newTheme);
  };

  /**
   * Check if current values differ from original
   * Skip check if we just saved to prevent race condition
   */
  useEffect(() => {
    if (Object.keys(originalValues).length === 0) return;
    if (justSaved) {
      setJustSaved(false);
      return;
    }
    
    const changed = 
      fullName !== originalValues.fullName ||
      email !== originalValues.email ||
      professionalRole !== originalValues.professionalRole ||
      JSON.stringify(selectedTopics) !== JSON.stringify(originalValues.selectedTopics) ||
      localTheme !== originalValues.theme ||
      parseInt(fontSize) !== parseInt(originalValues.fontSize) ||
      avatarUrl !== originalValues.avatarUrl;
    
    setHasChanges(changed);
  }, [fullName, email, professionalRole, selectedTopics, localTheme, fontSize, avatarUrl, originalValues, justSaved]);

  const handleTopicToggle = (topicId) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  /**
   * Handle avatar file selection - updates local state only
   * Actual save happens when user clicks Save Changes
   */
  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSaveMessage({ type: 'error', text: 'Please select an image file' });
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
      return;
    }

    // Validate file size (1MB max)
    if (file.size > 1024 * 1024) {
      setSaveMessage({ type: 'error', text: 'Image must be less than 1MB' });
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
      return;
    }

    setIsUploadingAvatar(true);
    
    // Convert to base64 and update local state only
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setAvatarUrl(base64String);
      setIsUploadingAvatar(false);
    };
    reader.onerror = () => {
      setSaveMessage({ type: 'error', text: 'Failed to read image file' });
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
      setIsUploadingAvatar(false);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Scroll to section and update active state
   */
  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /**
   * Cancel changes and revert to original values
   */
  const handleCancelChanges = () => {
    setFullName(originalValues.fullName);
    setEmail(originalValues.email);
    setProfessionalRole(originalValues.professionalRole);
    setSelectedTopics(originalValues.selectedTopics);
    handleThemeChange(originalValues.theme);
    setFontSize(originalValues.fontSize);
    // Restore global font size to original value
    setGlobalFontSize(originalValues.fontSize);
    setAvatarUrl(originalValues.avatarUrl);
    setHasChanges(false);
    setSaveMessage({ type: '', text: '' });
  };

  /**
   * Save all changes to backend
   */
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveMessage({ type: '', text: '' });

    try {
      const roleMap = {
        'research analyst': 'research_analyst',
        'product manager': 'product_manager',
        'software engineer': 'software_engineer',
        'journalist': 'journalist',
        'journalist / creator': 'journalist',
        'business consultant': 'business_consultant',
        'other': 'other',
      };

      // Build update payload, including avatarUrl and email if changed
      const updatePayload = {
        fullName,
        role: roleMap[professionalRole.toLowerCase()] || 'other',
        interests: selectedTopics,
        settings: {
          theme,
          fontSize: parseInt(fontSize),
        },
      };

      // Include email if it has changed
      if (email !== originalValues.email) {
        updatePayload.email = email;
      }

      // Include avatarUrl if it has changed
      if (avatarUrl !== originalValues.avatarUrl) {
        updatePayload.avatarUrl = avatarUrl;
      }

      const response = await updateProfile(updatePayload);

      if (response.success) {
        // Update stored user data
        storeUser(response.user);
        setUser(response.user);
        
        // Sync selectedTopics with what was actually saved in the database
        // This ensures custom topics are persisted correctly
        if (response.user.interests) {
          setSelectedTopics(response.user.interests);
        }
        
        // Apply global theme and font size immediately
        setGlobalTheme(localTheme);
        setGlobalFontSize(parseInt(fontSize));
        
        // Create new original values object (including avatarUrl)
        // Use response.user.interests to ensure sync with database
        const newOriginalValues = {
          fullName,
          email,
          professionalRole,
          selectedTopics: response.user.interests || [...selectedTopics],
          theme: localTheme,
          fontSize: parseInt(fontSize),
          avatarUrl: avatarUrl,
        };
        
        // Set justSaved to prevent useEffect from recalculating hasChanges
        setJustSaved(true);
        
        // Update original values to current values
        setOriginalValues(newOriginalValues);
        
        // Force hasChanges to false immediately
        setHasChanges(false);
        
        setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
        
        // Clear success message after 3 seconds
        setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
        setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
      }
    } catch (err) {
      console.error('Save error:', err);
      setSaveMessage({ type: 'error', text: err.message || 'Failed to save settings. Please try again.' });
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Reset interests to defaults
   */
  const handleResetInterests = () => {
    setProfessionalRole('Software Engineer');
    setSelectedTopics([]);
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-[#111111]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-[#6B7280] dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-900">
      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />

      {/* Shared Sidebar */}
      <Sidebar 
        user={user} 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />

      {/* Main Content */}
      <main className="lg:ml-[200px] flex-1 pt-14 lg:pt-0">
        {/* Settings Top Navigation Bar */}
        <div className="sticky top-14 lg:top-0 z-20 border-b border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="mx-auto max-w-4xl px-4 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div>
                <h1 className="text-xl font-semibold text-[#111111] dark:text-white">Settings</h1>
                <p className="text-sm text-[#6B7280] dark:text-gray-400">Manage your account and preferences</p>
              </div>

            </div>
            {/* Section Tabs - Scrollable on mobile */}
            <div className="flex gap-1 overflow-x-auto pb-px -mb-px scrollbar-hide">
              {sectionItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex items-center gap-2 px-3 lg:px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activeSection === item.id
                      ? 'border-[#111111] text-[#111111]'
                      : 'border-transparent text-[#6B7280] dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="mx-auto max-w-3xl px-4 lg:px-8 py-6 lg:py-8">
          {/* Profile Section */}
          <section id="profile" className="mb-12 scroll-mt-48 lg:scroll-mt-32">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#111111] dark:text-white">Profile</h2>
              <p className="text-sm text-[#6B7280] dark:text-gray-400">Manage your personal information and login details.</p>
            </div>

            {/* Avatar */}
            <div className="mb-6 flex items-center gap-4">
              <div className="relative">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="User avatar" 
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#111111] text-xl font-semibold text-white">
                    {userInitials}
                  </div>
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                    <svg className="h-6 w-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className='flex flex-col'>
                <label className="cursor-pointer text-sm font-medium text-[#111111] hover:underline">
                  Change Avatar
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl(null)}
                    className="cursor-pointer text-left text-sm font-medium text-[#6B7280] dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    Reset to default
                  </button>
                )}
                <p className="text-xs text-gray-400 dark:text-[#6B7280]">JPG, GIF or PNG. 1MB max.</p>
              </div>
            </div>

            {/* Name and Email */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] dark:border-gray-600 bg-[#F8F9FA] dark:bg-gray-700 px-3 py-2.5 text-sm text-[#111111] dark:text-white focus:border-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] dark:border-gray-600 bg-[#F8F9FA] dark:bg-gray-700 px-3 py-2.5 text-sm text-[#111111] dark:text-white focus:border-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
                />
              </div>
            </div>
          </section>

          {/* Interests Section */}
          <section id="interests" className="mb-12 border-t border-[#E5E7EB] dark:border-gray-700 pt-8 scroll-mt-48 lg:scroll-mt-32">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold text-[#111111] dark:text-white">Interests</h2>
                <p className="text-sm text-[#6B7280] dark:text-gray-400">Customize what content the AI prioritizes for you.</p>
              </div>
              <button 
                onClick={handleResetInterests}
                className="text-sm text-[#6B7280] dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 self-start sm:self-auto"
              >
                Reset to defaults
              </button>
            </div>

            {/* Professional Role */}
            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Professional Role</label>
              <div className="relative">
                <select
                  value={professionalRole}
                  onChange={(e) => setProfessionalRole(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-[#E5E7EB] dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 pr-10 text-sm text-[#111111] dark:text-white focus:border-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
                >
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="Research Analyst">Research Analyst</option>
                  <option value="Journalist / Creator">Journalist / Creator</option>
                  <option value="Business Consultant">Business Consultant</option>
                  <option value="Other">Other</option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Topic Focus */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">Topic Focus</label>
              <p className="text-xs text-gray-400 dark:text-[#6B7280] mb-3">Click to select or deselect topics. Selected topics influence your feed recommendations.</p>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((topic) => {
                  // Check if selected by matching either ID or name (for backward compatibility)
                  const isSelected = selectedTopics.includes(topic.id) || selectedTopics.includes(topic.name);
                  return (
                    <button
                      key={topic.id}
                      onClick={() => handleTopicToggle(topic.name)}
                      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-[#111111] text-white shadow-md shadow-gray-500/20'
                          : 'border border-[#E5E7EB] dark:border-gray-600 bg-white dark:bg-gray-700 text-[#6B7280] dark:text-gray-300 hover:bg-[#F8F9FA] dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <span className="mr-0.5">{topic.icon}</span>
                      {isSelected ? (
                        <CheckIcon className="h-3.5 w-3.5" />
                      ) : (
                        <PlusIcon className="h-3.5 w-3.5 text-gray-400" />
                      )}
                      {topic.name}
                    </button>
                  );
                })}
                {/* Display custom topics (topics not in predefined TOPICS list) */}
                {selectedTopics
                  .filter(topic => !TOPICS.some(t => t.id === topic || t.name === topic))
                  .map((customTopicName) => (
                    <button
                      key={customTopicName}
                      onClick={() => handleTopicToggle(customTopicName)}
                      className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all bg-[#111111] text-white shadow-md shadow-gray-500/20"
                    >
                      <span className="mr-0.5">🏷️</span>
                      <CheckIcon className="h-3.5 w-3.5" />
                      {customTopicName}
                    </button>
                  ))}
              </div>
              {selectedTopics.length > 0 && (
                <p className="text-xs text-[#111111] mt-3">{selectedTopics.length} topic{selectedTopics.length > 1 ? 's' : ''} selected</p>
              )}

              {/* Custom Topic Input */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-gray-400 dark:text-[#6B7280]">+</span>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customTopic.trim() && selectedTopics.length < 10) {
                      e.preventDefault();
                      setSelectedTopics([...selectedTopics, customTopic.trim()]);
                      setCustomTopic('');
                    }
                  }}
                  placeholder="Add custom topic"
                  className="flex-1 rounded-lg border border-[#E5E7EB] dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-[#111111] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customTopic.trim() && selectedTopics.length < 10) {
                      setSelectedTopics([...selectedTopics, customTopic.trim()]);
                      setCustomTopic('');
                    }
                  }}
                  disabled={!customTopic.trim() || selectedTopics.length >= 10}
                  className="rounded-lg bg-gray-100 dark:bg-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-200 dark:hover:bg-[#F8F9FA]0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              {selectedTopics.length >= 10 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Maximum of 10 topics reached</p>
              )}
            </div>
          </section>

          {/* Appearance Section */}
          <section id="appearance" className="border-t border-[#E5E7EB] dark:border-gray-700 pt-8 scroll-mt-48 lg:scroll-mt-32">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#111111] dark:text-white">Appearance</h2>
              <p className="text-sm text-[#6B7280] dark:text-gray-400">Customize how NewsAgent looks on your device.</p>
            </div>

            {/* Theme Preference */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">Theme Preference</label>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {[
                  { id: 'light', label: 'Light', icon: SunIcon },
                  { id: 'dark', label: 'Dark', icon: MoonIcon },
                  { id: 'system', label: 'System', icon: ComputerIcon },
                ].map((themeOption) => {
                  const IconComponent = themeOption.icon;
                  return (
                    <button
                      key={themeOption.id}
                      onClick={() => handleThemeChange(themeOption.id)}
                      className={`flex flex-1 flex-row sm:flex-col items-center gap-3 rounded-xl p-3 sm:p-4 transition-all border-2 ${
                        localTheme === themeOption.id
                          ? 'border-[#111111] bg-[#F8F9FA] dark:bg-teal-900/30'
                          : 'border-[#E5E7EB] dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      }`}
                    >
                      {/* Theme preview - hidden on mobile */}
                      <div className={`hidden sm:block h-16 w-full rounded-lg overflow-hidden border ${
                        localTheme === themeOption.id ? 'border-[#111111]' : 'border-[#E5E7EB] dark:border-gray-600'
                      }`}>
                        {themeOption.id === 'light' && (
                          <div className="h-full bg-white p-2">
                            <div className="h-2 w-8 rounded bg-gray-200 mb-1.5"></div>
                            <div className="h-2 w-12 rounded bg-gray-100 mb-1.5"></div>
                            <div className="h-2 w-6 rounded bg-teal-200"></div>
                          </div>
                        )}
                        {themeOption.id === 'dark' && (
                          <div className="h-full bg-gray-900 p-2">
                            <div className="h-2 w-8 rounded bg-gray-700 mb-1.5"></div>
                            <div className="h-2 w-12 rounded bg-gray-800 mb-1.5"></div>
                            <div className="h-2 w-6 rounded bg-teal-800"></div>
                          </div>
                        )}
                        {themeOption.id === 'system' && (
                          <div className="flex h-full">
                            <div className="flex-1 bg-white p-2">
                              <div className="h-1.5 w-4 rounded bg-gray-200 mb-1"></div>
                              <div className="h-1.5 w-3 rounded bg-gray-100"></div>
                            </div>
                            <div className="flex-1 bg-gray-900 p-2">
                              <div className="h-1.5 w-4 rounded bg-gray-700 mb-1"></div>
                              <div className="h-1.5 w-3 rounded bg-gray-800"></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <IconComponent className={`h-4 w-4 ${
                          localTheme === themeOption.id ? 'text-[#111111]' : 'text-gray-400'
                        }`} />
                        <span className={`text-sm font-medium ${
                          localTheme === themeOption.id ? 'text-[#111111]' : 'text-[#6B7280] dark:text-gray-400'
                        }`}>
                          {themeOption.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Font Size</label>
                <span className="text-xs text-gray-400">{fontSize < 33 ? 'Small' : fontSize < 66 ? 'Medium' : 'Large'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">A</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={fontSize}
                  onChange={(e) => {
                    setFontSize(e.target.value);
                    // Apply immediately for real-time preview
                    setGlobalFontSize(parseInt(e.target.value));
                  }}
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-[#E5E7EB] dark:bg-gray-700 accent-[#111111]"
                />
                <span className="text-lg text-gray-400">A</span>
              </div>
            </div>
          </section>

          {/* Spacer for floating save bar */}
          {hasChanges && <div className="h-24 lg:h-20" />}
        </div>
      </main>

      {/* Floating Save Bar - Shows when there are unsaved changes */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 lg:left-[200px] right-0 z-40 border-t border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 px-4 lg:px-8 py-3 lg:py-4 shadow-lg">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0"></div>
              <span className="text-sm text-[#6B7280] dark:text-gray-400 truncate">Unsaved changes</span>
            </div>
            <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
              <button
                onClick={handleCancelChanges}
                disabled={isSaving}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 lg:px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#F8F9FA] dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-[#111111] px-4 py-2 text-sm font-medium text-white hover:bg-[#000000] disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Message Toast */}
      {saveMessage.text && (
        <div className={`fixed bottom-24 lg:bottom-20 left-1/2 z-50 -translate-x-1/2 transform rounded-lg px-4 py-3 shadow-lg max-w-[90vw] ${
          saveMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {saveMessage.type === 'success' ? (
              <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <span className={`text-sm font-medium ${saveMessage.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
              {saveMessage.text}
            </span>
          </div>
        </div>
      )}

      {/* Right Actions - Desktop only */}
      <div className="hidden lg:flex fixed right-6 top-6 items-center gap-4">
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="User avatar" 
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111111] text-sm font-medium text-white">
            {userInitials}
          </div>
        )}
      </div>
    </div>
  );
}

// Navigation Item Component
function NavItem({ href, icon, label, active, onClick }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? 'bg-[#F8F9FA] dark:bg-teal-900/30 text-[#111111]' 
          : 'text-[#6B7280] dark:text-gray-400 hover:bg-[#F8F9FA] dark:hover:bg-gray-700'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

// Sidebar Navigation Icons
function HamburgerIcon() {
  return (
    <svg className="h-5 w-5 text-[#6B7280] dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5 text-[#6B7280] dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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

function CollectionIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
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

// Icon Components
function ProfileIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function InterestsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function AppearanceIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );
}

function ChevronDownIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function PlusIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function CheckIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SunIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function MoonIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function ComputerIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

