'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile, getAuthToken, handleOAuthCallback, isOAuthCallback } from '../../lib/api';

/**
 * NewsAgent Onboarding Page
 * Multi-step onboarding to collect user preferences
 * Matches Figma design from FSA-Rad
 */

/**
 * Map frontend role IDs to backend enum values
 * Frontend uses hyphens, backend uses underscores
 */
const ROLE_MAP = {
  'research-analyst': 'research_analyst',
  'product-manager': 'product_manager',
  'software-engineer': 'software_engineer',
  'journalist': 'journalist',
  'business-consultant': 'business_consultant',
  'other': 'other',
};

const ROLES = [
  {
    id: 'research-analyst',
    title: 'Research Analyst',
    description: 'Deep dives into data & reports',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
      </svg>
    ),
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    description: 'Tracking market trends & competitors',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
      </svg>
    ),
  },
  {
    id: 'software-engineer',
    title: 'Software Engineer',
    description: 'Building and maintaining code',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
      </svg>
    ),
  },
  {
    id: 'journalist',
    title: 'Journalist / Creator',
    description: 'Reporting news and stories',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
      </svg>
    ),
  },
  {
    id: 'business-consultant',
    title: 'Business Consultant',
    description: 'Advising on strategy and ops',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
      </svg>
    ),
  },
  {
    id: 'other',
    title: 'Other',
    description: null,
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
  },
];

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

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Role & Interests
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState('');
  const [otherRoleText, setOtherRoleText] = useState('');

  // Check if user is authenticated on mount
  useEffect(() => {
    // Handle OAuth callback if present
    if (isOAuthCallback()) {
      const result = handleOAuthCallback();
      if (result.success && result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
        // If user already completed onboarding, redirect to dashboard
        if (result.user.onboardingComplete) {
          router.push('/dashboard');
        }
        return;
      }
    }

    const token = getAuthToken();
    if (!token) {
      router.push('/signup');
    }
  }, [router]);

  const handleTopicToggle = (topicId) => {
    if (selectedTopics.includes(topicId)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topicId));
    } else if (selectedTopics.length < 10) {
      setSelectedTopics([...selectedTopics, topicId]);
    }
  };

  const handleContinue = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save preferences to backend and redirect to dashboard
      setIsLoading(true);
      setError('');

      try {
        // Map role to backend format and prepare interests
        const backendRole = selectedRole ? (ROLE_MAP[selectedRole] || 'other') : null;
        
        // Convert topic IDs to readable names for interests
        const interests = selectedTopics.map(topicId => {
          const topic = TOPICS.find(t => t.id === topicId);
          return topic ? topic.name : topicId;
        });

        // Build update payload - only include fields that have values
        const updatePayload = {};
        if (backendRole) updatePayload.role = backendRole;
        if (interests.length > 0) updatePayload.interests = interests;

        // Only call API if there's something to update
        if (Object.keys(updatePayload).length > 0) {
          const response = await updateProfile(updatePayload);

          if (response.success) {
            // Update local storage with updated user data
            localStorage.setItem('user', JSON.stringify(response.user));
          } else {
            setError('Failed to save preferences. Please try again.');
            setIsLoading(false);
            return;
          }
        }
        
        // Mark onboarding as viewed in local storage and redirect
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.onboardingComplete = true;
        localStorage.setItem('user', JSON.stringify(storedUser));
        
        // Use window.location for reliable navigation after profile update
        window.location.href = '/dashboard';
      } catch (err) {
        console.error('Onboarding error:', err);
        setError(err.message || 'Failed to save preferences. Please try again.');
        setIsLoading(false);
      }
    }
  };

  const handleSkip = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Skip onboarding - mark as viewed locally and go to dashboard
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.onboardingComplete = true;
      localStorage.setItem('user', JSON.stringify(storedUser));
      window.location.href = '/dashboard';
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8F9FA]">
      {/* Main Content */}
      <div className="flex w-full flex-1 items-start justify-center px-4 py-8">
        <div className="w-full max-w-[720px]">
          {/* Progress Section */}
          <div className="mb-6 flex w-full items-center justify-between">
            <span className="text-sm font-medium text-[#6B7280]">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-[#111111]">
              {currentStep === 1 ? 'Role & Interests' : '✨ Discovery Complete'}
            </span>
          </div>
          <div className="mb-8 h-1 w-full rounded-full bg-[#E5E7EB]">
            <div
              className="h-1 rounded-full bg-[#111111] transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          {/* Step 1: Role & Interests */}
          {currentStep === 1 && (
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-8 shadow-sm">
              {/* Header */}
              <h1 className="mb-2 text-2xl font-bold text-[#111111]">
                Tell us about yourself
              </h1>
              <p className="mb-8 text-[#6B7280]">
                We&apos;ll use this to find the best news sources for you automatically.
              </p>

              {/* Role Selection */}
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-[#111111]">👤</span>
                  <h2 className="font-semibold text-[#111111]">
                    What best describes your role?
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.slice(0, 4).map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                        selectedRole === role.id
                          ? 'border-[#111111] bg-[#F8F9FA]'
                          : 'border-[#E5E7EB] hover:border-[#111111]/50'
                      }`}
                    >
                      <span className={`mt-0.5 ${selectedRole === role.id ? 'text-[#111111]' : 'text-[#6B7280]'}`}>
                        {role.icon}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#111111]">{role.title}</span>
                          {selectedRole === role.id && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111111]">
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {role.description && (
                          <span className="text-sm text-[#6B7280]">{role.description}</span>
                        )}
                      </div>
                    </button>
                  ))}
                  {/* Business Consultant */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('business-consultant')}
                    className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                      selectedRole === 'business-consultant'
                        ? 'border-[#111111] bg-[#F8F9FA]'
                        : 'border-[#E5E7EB] hover:border-[#111111]/50'
                    }`}
                  >
                    <span className={`mt-0.5 ${selectedRole === 'business-consultant' ? 'text-[#111111]' : 'text-[#6B7280]'}`}>
                      {ROLES[4].icon}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#111111]">{ROLES[4].title}</span>
                        {selectedRole === 'business-consultant' && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111111]">
                            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-[#6B7280]">{ROLES[4].description}</span>
                    </div>
                  </button>
                  {/* Other */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('other')}
                    className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                      selectedRole === 'other'
                        ? 'border-[#111111] bg-[#F8F9FA]'
                        : 'border-[#E5E7EB] hover:border-[#111111]/50'
                    }`}
                  >
                    <span className={`mt-0.5 ${selectedRole === 'other' ? 'text-[#111111]' : 'text-[#6B7280]'}`}>
                      {ROLES[5].icon}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#111111]">Other</span>
                        {selectedRole === 'other' && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111111]">
                            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {selectedRole === 'other' ? (
                        <input
                          type="text"
                          value={otherRoleText}
                          onChange={(e) => setOtherRoleText(e.target.value)}
                          placeholder="Enter your role..."
                          className="mt-1 w-full text-black placeholder:text-gray-500 rounded border border-[#E5E7EB] px-2 py-1 text-sm outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : null}
                    </div>
                  </button>
                </div>
              </div>

              {/* Topics Selection */}
              <div className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#111111]">🏷️</span>
                    <h2 className="font-semibold text-[#111111]">
                      What topics interest you?
                    </h2>
                  </div>
                  <span className="text-sm text-[#6B7280]">(Select 3-10)</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => handleTopicToggle(topic.id)}
                      className={`relative flex flex-col items-center rounded-xl border-2 px-4 py-3 transition-all ${
                        selectedTopics.includes(topic.id)
                          ? 'border-[#111111] bg-[#F8F9FA]'
                          : 'border-[#E5E7EB] hover:border-[#111111]/50'
                      }`}
                    >
                      {selectedTopics.includes(topic.id) && (
                        <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#111111]">
                          <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <span className="mb-1 text-xl">{topic.icon}</span>
                      <span className="text-sm font-medium text-[#4A4A4A]">{topic.name}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Topic Input */}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[#6B7280]">+</span>
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Add custom topic"
                    className="flex-1 rounded-lg text-black border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
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
                    className="rounded-lg bg-[#F8F9FA] px-4 py-2 text-sm font-medium text-[#4A4A4A] transition-colors hover:bg-[#E5E7EB] disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Discovery Complete */}
          {currentStep === 2 && (
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-8 shadow-sm">
              {/* Success Icon */}
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#111111]">
                  <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Header */}
              <h1 className="mb-2 text-center text-2xl font-bold text-[#111111]">
                Your personalized feed is ready!
              </h1>
              <p className="mb-8 text-center text-[#6B7280]">
                Our AI will analyze your interests and curate the best sources for you.
              </p>

              {/* Topics Selected */}
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-center">
                  <div className="rounded-xl border border-[#E5E7EB] p-6 text-center w-full max-w-xs">
                    <div className="mb-1 text-4xl font-bold text-[#111111]">{selectedTopics.length}</div>
                    <div className="flex items-center justify-center gap-1 text-sm text-[#6B7280]">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      {selectedTopics.length === 1 ? 'Topic Selected' : 'Topics Selected'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Interests */}
              <div className="mb-8">
                <div className="mb-3 text-xs font-medium uppercase tracking-wide text-[#6B7280] text-center">
                  Your Selected Interests
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  {selectedTopics.length > 0 ? (
                    selectedTopics.map((id, index) => {
                      const topic = TOPICS.find(t => t.id === id)?.name || id;
                      return (
                        <span
                          key={index}
                          className="rounded-full bg-[#F8F9FA] border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#111111]"
                        >
                          # {topic}
                        </span>
                      );
                    })
                  ) : (
                    <p className="text-sm text-[#6B7280] italic">
                      No interests selected yet
                    </p>
                  )}
                </div>
              </div>

              {/* Info Message */}
              <div className="mb-6 p-4 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-[#111111] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-[#111111]">We&apos;ll curate feeds for you</p>
                    <p className="text-xs text-[#6B7280] mt-1">
                      Based on your interests, our AI will automatically find and subscribe you to the most relevant news sources. You can always customize your feeds later in Settings.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Go to Dashboard Button */}
              <button
                type="button"
                onClick={handleContinue}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111111] py-4 font-semibold text-white transition-all hover:bg-[#000000] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    Go to Home
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-sm text-[#6B7280]">
                You can always add custom feeds or adjust interests in Settings
              </p>
            </div>
          )}

          {/* Footer Navigation - Only for Step 1 */}
          {currentStep === 1 && (
            <div className="mt-6 flex items-center justify-between rounded-xl bg-white border border-[#E5E7EB] px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#111111] text-xs font-bold text-white">
                  {selectedTopics.length}
                </span>
                <span className="text-sm text-[#6B7280]">of 3-10 topics selected</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-sm text-[#6B7280] hover:text-[#111111]"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={selectedTopics.length < 3}
                  className="flex items-center gap-2 rounded-lg bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#000000] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sidebar Navigation Item Component
function NavItem({ icon, label, active = false }) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? 'bg-[#111111]/10 text-[#111111]'
          : 'text-[#6B7280] hover:bg-[#F8F9FA] hover:text-[#111111]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Icon Components for Sidebar
function DashboardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
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

function RobotIcon() {
  return (
    <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2M7.5 13A1.5 1.5 0 006 14.5 1.5 1.5 0 007.5 16 1.5 1.5 0 009 14.5 1.5 1.5 0 007.5 13m9 0a1.5 1.5 0 00-1.5 1.5 1.5 1.5 0 001.5 1.5 1.5 1.5 0 001.5-1.5 1.5 1.5 0 00-1.5-1.5M8 18h8v2H8v-2z" />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function SearchIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

