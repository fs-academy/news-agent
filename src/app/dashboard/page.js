'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthToken, handleOAuthCallback, isOAuthCallback, summarizeArticle, getCurrentUser, saveArticle, unsaveArticle, favouriteArticle, unfavouriteArticle, getCollectionArticles, discoverNews, refreshNews, getNewsByTopic, storeArticle } from '../../lib/api';
import { getStoredUser, storeUser, logout } from '../../lib/auth';
import Sidebar, { MobileHeader } from '../../components/Sidebar';
import { useTheme } from '../../context/ThemeContext';

// Interest categories mapping for News API
const INTEREST_CATEGORIES = [
  'AI & ML',
  'Startups',
  'Security',
  'Tech News',
  'Fintech',
  'Biotech',
  'Design',
  'Markets',
  'Politics',
  'Science',
  'Gaming',
  'Web3',
];

/**
 * NewsAgent Dashboard Page
 * Main application interface with personalized news feed using News API
 */
export default function DashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [activeFilter, setActiveFilter] = useState('All');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articlesError, setArticlesError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categories, setCategories] = useState(['All']);
  const [stats, setStats] = useState({ totalArticles: 0, source: null });
  const [newsSource, setNewsSource] = useState(null);
  
  // Track if initial fetch has been done to prevent loops
  const hasFetchedRef = useRef(false);
  
  // For article summaries
  const [expandedSummaries, setExpandedSummaries] = useState({});
  const [summaryLoading, setSummaryLoading] = useState({});
  
  // Error and notification states
  const [errorMessages, setErrorMessages] = useState({});
  
  // For saved and favourite articles
  const [savedArticles, setSavedArticles] = useState(new Set());
  const [favouriteArticles, setFavouriteArticles] = useState(new Set());
  
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Get user's first name for greeting
  const firstName = user?.fullName?.split(' ')[0] || 'User';

  // Check if user has completed profile setup (role and interests)
  const hasCompletedProfile = user?.role && user?.interests?.length >= 3;

  // Get current date formatted
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  }).toUpperCase();

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Set categories when user data loads
  useEffect(() => {
    if (user?.interests?.length > 0) {
      setCategories(['All', ...user.interests]);
    }
  }, [user?.interests]);

  /**
   * Fetch articles based on user's interests using News API
   * Discovers news based on interests or fetches by specific topic
   */
  const fetchArticles = useCallback(async (category = 'All') => {
    if (!hasCompletedProfile) return;

    setArticlesLoading(true);
    setArticlesError(null);

    try {
      let response;
      
      if (category === 'All') {
        // Fetch news based on all user interests using News API
        response = await discoverNews({ limit: 30 });
      } else {
        // Fetch news for specific interest/topic using News API
        response = await getNewsByTopic(category, { limit: 20 });
      }
      
      if (response.success) {
        if (response.needsInterests) {
          setArticlesError({ type: 'needs-interests', message: response.message || 'Please set your interests to see personalized news' });
          setArticles([]);
          setStats({ totalArticles: 0, source: null });
        } else {
          const articlesData = response.data || [];
          setArticles(articlesData);
          setNewsSource(response.source);
          setStats({
            totalArticles: articlesData.length,
            source: response.source,
            totalResults: response.totalResults
          });
        }
      } else {
        setArticlesError({ type: 'error', message: 'Failed to fetch articles' });
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err);
      setArticlesError({ type: 'error', message: err.message || 'Failed to fetch news' });
    } finally {
      setArticlesLoading(false);
    }
  }, [hasCompletedProfile]);

  /**
   * Refresh news - fetch fresh articles from News API
   */
  const handleRefreshFeeds = async () => {
    setIsRefreshing(true);
    try {
      await refreshNews();
      await fetchArticles(activeFilter);
    } catch (err) {
      console.error('Failed to refresh news:', err);
      setArticlesError({ type: 'error', message: 'Failed to refresh news. Please try again.' });
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Helper function to ensure an article is stored in the database
   * For external articles, stores them first and returns the MongoDB ID
   * @param {Object} article - The article object
   * @returns {Promise<string>} - The MongoDB article ID
   */
  const ensureArticleStored = async (article) => {
    // Validate article data
    if (!article) {
      throw new Error('Article data is missing');
    }

    if (!article.title || !article.url) {
      throw new Error('Article must have a title and URL to be saved');
    }

    // If article already has a valid MongoDB ObjectId (24 hex chars), return it
    if (article._id && /^[a-f\d]{24}$/i.test(article._id)) {
      return article._id;
    }
    
    // External article - store it first
    try {
      const response = await storeArticle({
        url: article.url,
        title: article.title,
        description: article.content || article.description,
        content: article.content,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        source: article.source,
        author: article.author
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to store article in database');
      }

      if (!response.data?._id) {
        throw new Error('Server did not return article ID');
      }
      
      // Update the article in state with the new MongoDB ID
      setArticles(prev => prev.map(a => 
        a.url === article.url ? { ...a, _id: response.data._id } : a
      ));
      
      return response.data._id;
    } catch (err) {
      throw new Error(err.message || 'Failed to store article. Check your connection and try again.');
    }
  };

  /**
   * Toggle article summary expansion and fetch if needed
   */
  const handleToggleSummary = async (articleId) => {
    if (expandedSummaries[articleId]) {
      // Collapse
      setExpandedSummaries(prev => ({ ...prev, [articleId]: null }));
      return;
    }

    // Find the article to ensure it's stored
    const article = articles.find(a => a._id === articleId);
    
    if (!article) {
      setErrorMessages(prev => ({
        ...prev,
        [articleId]: 'Article not found'
      }));
      return;
    }

    // Fetch summary
    setSummaryLoading(prev => ({ ...prev, [articleId]: true }));
    try {
      // Ensure article is stored and get MongoDB ID
      const storedId = await ensureArticleStored(article);
      
      const response = await summarizeArticle(storedId);
      if (response.success && response.data) {
        // Check if there was an error in the response
        if (response.data.error || !response.data.summary) {
          const userMsg = response.data.userMessage || 'Unable to generate summary. Please try again.';
          setExpandedSummaries(prev => ({ 
            ...prev, 
            [articleId]: {
              summary: null,
              error: true,
              fallback: true,
              userMessage: userMsg,
              retryable: response.data.retryable !== false
            }
          }));
          setErrorMessages(prev => ({
            ...prev,
            [articleId]: userMsg
          }));
        } else {
          const userMsg = response.data.userMessage || '';
          setExpandedSummaries(prev => ({ 
            ...prev, 
            [articleId]: {
              summary: response.data.summary,
              cached: response.data.cached,
              fallback: false,
              userMessage: userMsg
            }
          }));
          // Clear any previous error
          setErrorMessages(prev => {
            const newMessages = { ...prev };
            delete newMessages[articleId];
            return newMessages;
          });
        }
      } else {
        throw new Error(response.message || 'Summary generation failed');
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to generate summary. Please try again later.';
      console.error('Failed to get summary:', err);
      setExpandedSummaries(prev => ({ 
        ...prev, 
        [articleId]: { 
          summary: null, 
          error: true,
          fallback: true,
          userMessage: errorMsg,
          retryable: true
        }
      }));
      setErrorMessages(prev => ({
        ...prev,
        [articleId]: errorMsg
      }));
    } finally {
      setSummaryLoading(prev => ({ ...prev, [articleId]: false }));
    }
  };

  /**
   * Toggle save article for "Read Later"
   */
  const handleToggleSave = async (articleId) => {
    const isSaved = savedArticles.has(articleId);
    
    // Find the article
    const article = articles.find(a => a._id === articleId);
    
    if (!article) {
      setErrorMessages(prev => ({
        ...prev,
        [articleId]: 'Article not found'
      }));
      return;
    }

    try {
      // Ensure article is stored and get MongoDB ID
      const storedId = await ensureArticleStored(article);
      
      if (isSaved) {
        await unsaveArticle(storedId);
        setSavedArticles(prev => {
          const newSet = new Set(prev);
          newSet.delete(articleId);
          if (storedId !== articleId) newSet.delete(storedId);
          return newSet;
        });
        // Clear any error messages on success
        setErrorMessages(prev => {
          const updated = { ...prev };
          delete updated[articleId];
          return updated;
        });
      } else {
        await saveArticle(storedId);
        setSavedArticles(prev => {
          const newSet = new Set(prev);
          newSet.add(storedId);
          if (storedId !== articleId) newSet.add(articleId);
          return newSet;
        });
        // Clear any error messages on success
        setErrorMessages(prev => {
          const updated = { ...prev };
          delete updated[articleId];
          return updated;
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to save article. Please try again later.';
      console.error('Failed to toggle save:', err);
      setErrorMessages(prev => ({
        ...prev,
        [articleId]: errorMsg
      }));
    }
  };

  /**
   * Toggle favourite article
   */
  const handleToggleFavourite = async (articleId) => {
    const isFavourite = favouriteArticles.has(articleId);
    
    // Find the article
    const article = articles.find(a => a._id === articleId);
    
    if (!article) {
      setErrorMessages(prev => ({
        ...prev,
        [articleId]: 'Article not found'
      }));
      return;
    }

    try {
      // Ensure article is stored and get MongoDB ID
      const storedId = await ensureArticleStored(article);
      
      if (isFavourite) {
        await unfavouriteArticle(storedId);
        setFavouriteArticles(prev => {
          const newSet = new Set(prev);
          newSet.delete(articleId);
          if (storedId !== articleId) newSet.delete(storedId);
          return newSet;
        });
        // Clear any error messages on success
        setErrorMessages(prev => {
          const updated = { ...prev };
          delete updated[articleId];
          return updated;
        });
      } else {
        await favouriteArticle(storedId);
        setFavouriteArticles(prev => {
          const newSet = new Set(prev);
          newSet.add(storedId);
          if (storedId !== articleId) newSet.add(articleId);
          return newSet;
        });
        // Clear any error messages on success
        setErrorMessages(prev => {
          const updated = { ...prev };
          delete updated[articleId];
          return updated;
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to favourite article. Please try again later.';
      console.error('Failed to toggle favourite:', err);
      setErrorMessages(prev => ({
        ...prev,
        [articleId]: errorMsg
      }));
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const initDashboard = async () => {
      // Handle OAuth callback if present
      if (isOAuthCallback()) {
        const result = handleOAuthCallback();
        if (result.success && result.user) {
          localStorage.setItem('user', JSON.stringify(result.user));
          setUser(result.user);
          setIsLoading(false);
          return;
        }
      }

      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      // Check local storage first for onboarding status
      // User might have skipped onboarding (local onboardingComplete = true)
      const storedUser = getStoredUser();
      const localOnboardingComplete = storedUser?.onboardingComplete;

      // Try to get fresh user data from API
      try {
        const response = await getCurrentUser();
        if (response.success && response.user) {
          // Preserve local onboardingComplete if user skipped onboarding
          // (API returns false but user chose to skip)
          const mergedUser = {
            ...response.user,
            onboardingComplete: localOnboardingComplete || response.user.onboardingComplete
          };
          storeUser(mergedUser);
          setUser(mergedUser);
          
          // Fetch saved and favourite article IDs from collection endpoint
          // This ensures we get proper string IDs for comparison
          try {
            const collectionResponse = await getCollectionArticles();
            if (collectionResponse.success) {
              setSavedArticles(new Set(collectionResponse.savedIds || []));
              setFavouriteArticles(new Set(collectionResponse.favouriteIds || []));
            }
          } catch (collectionErr) {
            console.error('Failed to fetch collection data:', collectionErr);
          }
          
          // Check if onboarding is complete (respecting local skip)
          if (!mergedUser.onboardingComplete) {
            router.push('/onboarding');
            return;
          }
        }
      } catch (err) {
        console.error('Failed to get current user:', err);
        
        // If user not found (404) or unauthorized (401), clear auth and redirect
        if (err.status === 404 || err.status === 401) {
          logout(); // Clear all auth data
          router.push('/login');
          return;
        }
        
        // For other errors, fall back to stored user data
        if (storedUser) {
          if (!storedUser.onboardingComplete) {
            router.push('/onboarding');
            return;
          }
          setUser(storedUser);
          
          // Try to fetch collection data even with stored user
          try {
            const collectionResponse = await getCollectionArticles();
            if (collectionResponse.success) {
              setSavedArticles(new Set(collectionResponse.savedIds || []));
              setFavouriteArticles(new Set(collectionResponse.favouriteIds || []));
            }
          } catch (collectionErr) {
            console.error('Failed to fetch collection data:', collectionErr);
          }
        } else {
          router.push('/login');
          return;
        }
      }
      
      setIsLoading(false);
    };

    initDashboard();
  }, [router]);

  // Fetch articles ONCE when user is loaded and has completed profile
  useEffect(() => {
    if (user && hasCompletedProfile && !isLoading && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchArticles(activeFilter);
    }
  }, [user, hasCompletedProfile, isLoading]); // Removed fetchArticles and activeFilter from deps

  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    fetchArticles(filter);
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-[#111111] dark:text-[#E5E7EB]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-[#6B7280]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#020617]">
      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />

      {/* Shared Sidebar */}
      <Sidebar 
        user={user} 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />

      {/* Main Content */}
      <main className="pt-16 lg:pt-0 lg:ml-[200px] lg:mr-[280px] flex-1 ">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-[#111111] dark:text-[#E5E7EB]">{getGreeting()}, {firstName}</h1>
              <p className="text-sm sm:text-base text-[#4A4A4A] dark:text-[#9CA3AF]">
                {hasCompletedProfile ? 'Here is your daily briefing tailored for you.' : 'Complete your profile to see personalized news.'}
              </p>
            </div>
            <p className="text-sm text-[#6B7280]">{currentDate}</p>
          </div>

          {/* Mobile Stats Cards - Only visible on mobile */}
          {hasCompletedProfile && (
            <div className="lg:hidden mb-6 grid grid-cols-2 gap-3">
              {/* Today's Insights Mobile Card */}
              <div className="rounded-xl bg-[#111111] p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <SparkleIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Articles</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalArticles}</p>
                <p className="text-xs text-white/70">Ranked today</p>
              </div>
              <div className="rounded-xl bg-[#111111] p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <RssIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Feeds</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalFeeds}</p>
                <p className="text-xs text-white/70">Active sources</p>
              </div>
            </div>
          )}

          {/* Profile Incomplete Banner */}
          {!hasCompletedProfile && (
            <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                  <AlertIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">Complete your profile to get started</h3>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                    Set your role and select at least 3 interests to receive personalized news feeds tailored to your preferences.
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <Link href="/settings" className="inline-flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 text-sm font-medium text-white transition">
                      <SettingsIcon className="h-4 w-4" />
                      Go to Settings
                    </Link>
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      {user?.interests?.length || 0}/3 interests selected
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Pills - Sticky on scroll */}
          {hasCompletedProfile && (
            <div className="sticky top-16 lg:top-0 z-20 bg-[#FFFFFF] dark:bg-[#020617] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 mb-2">
              <div className="flex gap-2 flex-wrap">
                {categories.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleFilterChange(filter)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      activeFilter === filter
                        ? 'bg-[#111111] text-white'
                        : 'bg-white dark:bg-[#020617] text-[#4A4A4A] dark:text-[#9CA3AF] hover:bg-[#F8F9FA] dark:hover:bg-[#1F2933] border border-[#E5E7EB] dark:border-[#1F2933]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Top Picks Header */}
          {hasCompletedProfile && (
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[#111111] dark:text-[#E5E7EB]">Top Picks for You</h2>
                {stats.aiRanked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
                    <SparkleIcon className="h-3 w-3" />
                    AI Ranked
                  </span>
                )}
              </div>
              <button 
                onClick={handleRefreshFeeds}
                disabled={isRefreshing}
                className="flex items-center gap-2 text-sm font-medium text-[#111111] dark:text-[#E5E7EB] hover:underline disabled:opacity-50"
              >
                <RefreshIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh News'}
              </button>
            </div>
          )}

          {/* Articles Feed */}
          {hasCompletedProfile && (
            <div className="space-y-4">
              {articlesLoading ? (
                <LoadingSkeleton />
              ) : articlesError ? (
                <ErrorState error={articlesError} onRetry={() => fetchArticles(activeFilter)} />
              ) : articles.length === 0 ? (
                <EmptyState isRefreshing={isRefreshing} onRefresh={handleRefreshFeeds} />
              ) : (
                articles.map((article) => {
                  const articleId = typeof article._id === 'object' ? article._id.toString() : article._id;
                  return (
                    <ArticleCard 
                      key={articleId} 
                      article={article}
                      articleId={articleId}
                      onToggleSummary={handleToggleSummary}
                      summaryData={expandedSummaries[articleId]}
                      summaryLoading={summaryLoading[articleId]}
                      isSaved={savedArticles.has(articleId)}
                      isFavourite={favouriteArticles.has(articleId)}
                      onToggleSave={handleToggleSave}
                      onToggleFavourite={handleToggleFavourite}
                    />
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar - Hidden on mobile, shown as cards in main content on mobile */}
      <aside className="hidden lg:block fixed right-0 top-0 z-30 h-screen w-[280px] overflow-y-auto border-l border-[#E5E7EB] dark:border-[#1F2933] bg-white dark:bg-[#020617] p-5">
        {/* Today's Insights Card */}
        <div className="mb-6 rounded-xl bg-[#111111] p-5 text-white">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-semibold">Today&apos;s Insights</h3>
            <SparkleIcon />
          </div>
          <p className="mb-4 text-sm text-white/70">Daily briefing statistics</p>
          <div className="rounded-lg bg-white/10 p-4 text-center">
            <p className="text-3xl font-bold">{stats.totalArticles}</p>
            <p className="text-sm text-white/70">Articles Available</p>
          </div>
        </div>

        {/* User Interests */}
        {user?.interests?.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-[#111111] dark:text-[#E5E7EB]">Your Interests</h3>
              <Link href="/settings" className="text-[#6B7280] hover:text-[#111111] dark:hover:text-[#E5E7EB]">
                <SettingsIcon className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.interests.slice(0, 6).map((interest) => (
                <span key={interest} className="rounded-full bg-[#F8F9FA] dark:bg-[#1F2933] px-3 py-1 text-xs text-[#4A4A4A] dark:text-[#9CA3AF]">
                  {interest}
                </span>
              ))}
              {user.interests.length > 6 && (
                <span className="rounded-full bg-[#F8F9FA] dark:bg-[#1F2933] px-3 py-1 text-xs text-[#6B7280]">
                  +{user.interests.length - 6} more
                </span>
              )}
            </div>
            <Link href="/settings" className="mt-3 inline-block text-sm font-medium text-[#111111] dark:text-[#E5E7EB] hover:underline">
              Manage interests
            </Link>
          </div>
        )}

        {/* Pro Tip */}
        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1F2933] bg-[#F8F9FA] dark:bg-[#1F2933]/50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Pro Tip</p>
          <p className="mb-3 text-sm text-[#4A4A4A] dark:text-[#9CA3AF]">
            {hasCompletedProfile 
              ? 'Click "AI Summary" on any article to get an instant summary powered by local AI.'
              : 'Add more interests to get better personalized news recommendations.'}
          </p>
          <Link href={hasCompletedProfile ? '/search' : '/settings'} className="text-sm font-medium text-[#111111] dark:text-[#E5E7EB] hover:underline">
            {hasCompletedProfile ? 'Search Articles →' : 'Update Interests →'}
          </Link>
        </div>
      </aside>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-xl border border-[#E5E7EB] dark:border-[#1F2933] bg-white dark:bg-[#020617] p-5">
          <div className="flex gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-[#E5E7EB] dark:bg-[#1F2933]"></div>
                <div className="h-4 w-24 bg-[#E5E7EB] dark:bg-[#1F2933] rounded"></div>
              </div>
              <div className="h-6 w-3/4 bg-[#E5E7EB] dark:bg-[#1F2933] rounded"></div>
              <div className="h-4 w-full bg-[#E5E7EB] dark:bg-[#1F2933] rounded"></div>
              <div className="h-4 w-2/3 bg-[#E5E7EB] dark:bg-[#1F2933] rounded"></div>
            </div>
            <div className="h-[140px] w-[180px] bg-[#E5E7EB] dark:bg-[#1F2933] rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1F2933] bg-white dark:bg-[#020617] p-8 text-center">
      {error.type === 'curating' ? (
        <>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F9FA] dark:bg-[#1F2933]">
            <RefreshIcon className="h-6 w-6 text-[#111111] dark:text-[#E5E7EB] animate-spin" />
          </div>
          <h3 className="font-semibold text-[#111111] dark:text-[#E5E7EB]">Setting Up Your Feeds</h3>
          <p className="mt-2 text-sm text-[#6B7280]">{error.message}</p>
          <p className="mt-1 text-xs text-[#6B7280]">Adding personalized sources based on your interests...</p>
        </>
      ) : error.type === 'refreshing' ? (
        <>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F9FA] dark:bg-[#1F2933]">
            <RefreshIcon className="h-6 w-6 text-[#111111] dark:text-[#E5E7EB] animate-spin" />
          </div>
          <h3 className="font-semibold text-[#111111] dark:text-[#E5E7EB]">Fetching Your News</h3>
          <p className="mt-2 text-sm text-[#6B7280]">{error.message}</p>
          <p className="mt-1 text-xs text-[#6B7280]">This may take a moment...</p>
        </>
      ) : error.type === 'empty' ? (
        <>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F9FA] dark:bg-[#1F2933]">
            <NewspaperIcon className="h-6 w-6 text-[#6B7280]" />
          </div>
          <h3 className="font-semibold text-[#111111] dark:text-[#E5E7EB]">No Articles Found</h3>
          <p className="mt-2 text-sm text-[#6B7280]">{error.message}</p>
          <button onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#111111] px-4 py-2 text-sm font-medium text-white hover:bg-[#000000] transition">
            <RefreshIcon className="h-4 w-4" />
            Try Again
          </button>
        </>
      ) : error.type === 'needs-interests' ? (
        <>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-semibold text-[#111111] dark:text-[#E5E7EB]">Set Your Interests</h3>
          <p className="mt-2 text-sm text-[#6B7280]">{error.message}</p>
          <Link href="/settings" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#111111] px-4 py-2 text-sm font-medium text-white hover:bg-[#000000] transition">
            <SettingsIcon className="h-4 w-4" />
            Go to Settings
          </Link>
        </>
      ) : error.type === 'needs-feeds' ? (
        <>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <RssIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-[#111111] dark:text-[#E5E7EB]">Add News Feeds</h3>
          <p className="mt-2 text-sm text-[#6B7280]">{error.message}</p>
          <Link href="/settings" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#111111] px-4 py-2 text-sm font-medium text-white hover:bg-[#000000] transition">
            <SettingsIcon className="h-4 w-4" />
            Manage Sources
          </Link>
        </>
      ) : (
        <>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#B91C1C]/10 dark:bg-[#EF4444]/10">
            <AlertIcon className="h-6 w-6 text-[#B91C1C] dark:text-[#EF4444]" />
          </div>
          <h3 className="font-semibold text-[#111111] dark:text-[#E5E7EB]">Error Loading Articles</h3>
          <p className="mt-2 text-sm text-[#6B7280]">{error.message}</p>
          <button onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#111111] px-4 py-2 text-sm font-medium text-white hover:bg-[#000000] transition">
            <RefreshIcon className="h-4 w-4" />
            Try Again
          </button>
        </>
      )}
    </div>
  );
}

function EmptyState({ isRefreshing, onRefresh }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1F2933] bg-white dark:bg-[#020617] p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F9FA] dark:bg-[#1F2933]">
        <NewspaperIcon className="h-6 w-6 text-[#6B7280]" />
      </div>
      <h3 className="font-semibold text-[#111111] dark:text-[#E5E7EB]">No Articles Yet</h3>
      <p className="mt-2 text-sm text-[#6B7280]">
        Your feeds haven&apos;t been refreshed yet. Click the button below to fetch the latest news.
      </p>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#111111] px-4 py-2 text-sm font-medium text-white hover:bg-[#000000] transition disabled:opacity-50"
      >
        <RefreshIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Refreshing...' : 'Refresh News'}
      </button>
    </div>
  );
}

function ArticleCard({ article, articleId, onToggleSummary, summaryData, summaryLoading, isSaved, isFavourite, onToggleSave, onToggleFavourite }) {
  const timeAgo = getTimeAgo(article.publishedAt);
  const sourceName = article.source?.name || article.feed?.title || null;
  const imageUrl = article.urlToImage || article.metadata?.imageUrl;
  
  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1F2933] bg-white dark:bg-[#020617] p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          {/* Source and Time */}
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111111] text-[10px] text-white">📰</span>
            {sourceName && (
              <>
                <span className="text-sm font-medium text-[#111111] dark:text-[#E5E7EB]">{sourceName}</span>
                <span className="text-sm text-[#6B7280]">•</span>
              </>
            )}
            <span className="text-sm text-[#6B7280]">{timeAgo}</span>
          </div>

          {/* Title */}
          <h3 className="mb-2 text-lg font-semibold text-[#111111] dark:text-[#E5E7EB] leading-snug">{article.title}</h3>

          {/* Description */}
          <p className="mb-3 text-sm text-[#4A4A4A] dark:text-[#9CA3AF] leading-relaxed line-clamp-2">
            {article.content?.substring(0, 200)}...
          </p>

          {/* Match and Tags */}
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            {article.relevanceScore && (
              <span className="flex items-center gap-1 rounded-full bg-[#F8F9FA] dark:bg-[#1F2933] px-2.5 py-1 text-xs font-medium text-[#111111] dark:text-[#E5E7EB]">
                <LightningIcon />
                {article.relevanceScore}% Match
              </span>
            )}
            {article.feed?.category && (
              <span className="rounded-full border border-[#E5E7EB] dark:border-[#1F2933] bg-white dark:bg-[#020617] px-2.5 py-1 text-xs text-[#4A4A4A] dark:text-[#9CA3AF] capitalize">
                {article.feed.category}
              </span>
            )}
            {article.metadata?.tags?.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full border border-[#E5E7EB] dark:border-[#1F2933] bg-white dark:bg-[#020617] px-2.5 py-1 text-xs text-[#4A4A4A] dark:text-[#9CA3AF]">
                {tag}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={() => onToggleSummary(articleId)}
              disabled={summaryLoading}
              className="flex items-center gap-1 h-9 px-3 rounded-full border border-[#E5E7EB] dark:border-[#1F2933] text-[#6B7280] hover:text-[#111111] dark:hover:text-[#E5E7EB] hover:border-[#111111] dark:hover:border-[#E5E7EB] disabled:opacity-50 transition-colors"
            >
              {summaryLoading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <SparkleIcon className="h-4 w-4" />
              )}
              <span className="text-xs font-medium">{summaryData ? 'Hide' : 'AI Summary'}</span>
            </button>
            {/* Read Later Button with Tooltip */}
            <div className="relative group">
              <button 
                onClick={() => onToggleSave(articleId)}
                className={`flex items-center justify-center h-9 w-9 rounded-full border transition-colors ${isSaved ? 'text-[#111111] dark:text-[#E5E7EB] border-[#111111] dark:border-[#E5E7EB] bg-[#111111]/10 dark:bg-[#E5E7EB]/10' : 'text-[#6B7280] border-[#E5E7EB] dark:border-[#1F2933] hover:text-[#111111] dark:hover:text-[#E5E7EB] hover:border-[#111111] dark:hover:border-[#E5E7EB]'}`}
              >
                <BookmarkIcon filled={isSaved} />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#111111] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {isSaved ? 'Remove from Read Later' : 'Read Later'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#111111]"></div>
              </div>
            </div>
            {/* Favourite Button with Tooltip */}
            <div className="relative group">
              <button 
                onClick={() => onToggleFavourite(articleId)}
                className={`flex items-center justify-center h-9 w-9 rounded-full border transition-colors ${isFavourite ? 'text-[#111111] dark:text-[#E5E7EB] border-[#111111] dark:border-[#E5E7EB] bg-[#111111]/10 dark:bg-[#E5E7EB]/10' : 'text-[#6B7280] border-[#E5E7EB] dark:border-[#1F2933] hover:text-[#111111] dark:hover:text-[#E5E7EB] hover:border-[#111111] dark:hover:border-[#E5E7EB]'}`}
              >
                <HeartIcon filled={isFavourite} />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#111111] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {isFavourite ? 'Remove from Favourites' : 'Favourite'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#111111]"></div>
              </div>
            </div>
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-9 rounded-full bg-[#111111] dark:bg-[#E5E7EB] px-4 text-sm font-medium text-white dark:text-[#111111] hover:bg-[#000000] dark:hover:bg-white transition-colors">
              Read more
            </a>
          </div>
        </div>

        {/* Article Image */}
        {imageUrl && (
          <div className="relative h-[160px] sm:h-[140px] w-full sm:w-[180px] flex-shrink-0 overflow-hidden rounded-lg order-first sm:order-last">
            <img src={imageUrl} alt={article.title} className="h-full w-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
        )}
      </div>

      {/* AI Summary Section - Full width */}
      {summaryData && (
        <div className="mt-4 rounded-lg bg-[#F8F9FA] dark:bg-[#1F2933] border border-[#E5E7EB] dark:border-[#1F2933] p-3">
          <div className="flex items-center gap-2 mb-2">
            <SparkleIcon className="h-4 w-4 text-[#111111] dark:text-[#E5E7EB]" />
            <span className="text-xs font-medium text-[#111111] dark:text-[#E5E7EB]">
              AI Summary {summaryData.cached && '(cached)'}
            </span>
          </div>
          {summaryData.error || !summaryData.summary ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-red-600 dark:text-red-400">
                {summaryData.userMessage || 'Unable to generate summary.'}
              </p>
              {summaryData.retryable !== false && (
                <button
                  onClick={() => onToggleSummary(article._id)}
                  className="self-start text-xs px-3 py-1.5 bg-[#111111] hover:bg-[#333333] text-white dark:bg-[#E5E7EB] dark:hover:bg-[#D1D5DB] dark:text-[#111111] rounded-md transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#4A4A4A] dark:text-[#9CA3AF]">{summaryData.summary}</p>
          )}
        </div>
      )}
    </div>
  );
}

function NavItem({ href, icon, label, active = false, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active ? 'bg-[#111111]/10 dark:bg-[#E5E7EB]/10 text-[#111111] dark:text-[#E5E7EB]' : 'text-[#6B7280] hover:bg-[#F8F9FA] dark:hover:bg-[#1F2933] hover:text-[#111111] dark:hover:text-[#E5E7EB]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function getTimeAgo(date) {
  if (!date) return 'Unknown';
  const now = new Date();
  const published = new Date(date);
  const diffMs = now - published;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return published.toLocaleDateString();
}

// ============================================
// Icon Components
// ============================================

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

function SearchIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function SettingsIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

function SparkleIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L9.19 8.63L2 12l7.19 3.37L12 22l2.81-6.63L22 12l-7.19-3.37L12 2z" />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}

function BookmarkIcon({ filled = false }) {
  return (
    <svg className="h-5 w-5" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function HeartIcon({ filled = false }) {
  return (
    <svg className="h-5 w-5" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function RefreshIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function AlertIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function RssIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  );
}

function NewspaperIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  );
}

function HamburgerIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
