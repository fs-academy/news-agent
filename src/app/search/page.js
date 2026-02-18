'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthToken, getUserArticles, searchArticles, summarizeArticle, saveArticle, unsaveArticle, favouriteArticle, unfavouriteArticle, getCurrentUser, getRankedArticles, discoverNews, searchNews, getNewsByTopic, storeArticle } from '../../lib/api';
import { getStoredUser } from '../../lib/auth';
import Sidebar, { MobileHeader } from '../../components/Sidebar';

/**
 * NewsAgent Search Page
 * Full-text search with filters, topics, and date ranges
 */
export default function SearchPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Most Relevant');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Data states
  const [articles, setArticles] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Discovery articles ("In case you missed it")
  const [discoveryArticles, setDiscoveryArticles] = useState([]);
  const [filteredDiscoveryArticles, setFilteredDiscoveryArticles] = useState([]);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(false);

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month

  // Summary states
  const [expandedSummaries, setExpandedSummaries] = useState({});
  const [summaryLoading, setSummaryLoading] = useState({});

  // Error and notification states
  const [errorMessages, setErrorMessages] = useState({});

  // Saved and favourite articles
  const [savedArticles, setSavedArticles] = useState(new Set());
  const [favouriteArticles, setFavouriteArticles] = useState(new Set());

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Mobile filter drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // User interests as categories (dynamically loaded from user profile)
  const [userInterests, setUserInterests] = useState([]);

  // Check authentication on mount
  useEffect(() => {
    const initPage = async () => {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const storedUser = getStoredUser();
      if (storedUser) {
        if (!storedUser.onboardingComplete) {
          router.push('/onboarding');
          return;
        }
        setUser(storedUser);
      }

      try {
        // Get current user to load saved/favourite articles and interests
        const userResponse = await getCurrentUser();
        if (userResponse.success && userResponse.user) {
          setUser(userResponse.user);
          if (userResponse.user.savedArticles?.length > 0) {
            setSavedArticles(new Set(userResponse.user.savedArticles));
          }
          if (userResponse.user.favouriteArticles?.length > 0) {
            setFavouriteArticles(new Set(userResponse.user.favouriteArticles));
          }
          // Set user interests as filter categories
          if (userResponse.user.interests?.length > 0) {
            setUserInterests(userResponse.user.interests);
          }
        }
        
        // Load discovery articles for "In case you missed it" section
        setIsLoadingDiscovery(true);
        try {
          // Try to get user's news from discover endpoint (includes all articles from their interests)
          const discoverResponse = await discoverNews({ limit: 50 });
          if (discoverResponse.success && discoverResponse.data?.length > 0) {
            // Shuffle articles to show variety
            const shuffled = [...discoverResponse.data].sort(() => Math.random() - 0.5);
            setDiscoveryArticles(shuffled);
            setFilteredDiscoveryArticles(shuffled);
          } else {
            // Fallback to user articles if discover returns empty
            const articlesResponse = await getUserArticles({ limit: 30 });
            if (articlesResponse.success && articlesResponse.data) {
              const shuffled = [...articlesResponse.data].sort(() => Math.random() - 0.5);
              setDiscoveryArticles(shuffled);
              setFilteredDiscoveryArticles(shuffled);
            }
          }
        } catch (discoveryErr) {
          console.error('Failed to load discovery articles:', discoveryErr);
        } finally {
          setIsLoadingDiscovery(false);
        }
      } catch (err) {
        console.error('Failed to initialize search page:', err);
      }

      setIsLoading(false);
    };

    initPage();
  }, [router]);

  /**
   * Perform search with current filters
   * Uses News API to fetch relevant articles based on search query and filters
   */
  const handleSearch = useCallback(async () => {
    // If no search query and no categories selected, don't search
    if (!searchQuery.trim() && selectedCategories.length === 0) {
      setArticles([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      let results = [];

      // Build search query - combine user query with selected interests
      // If user has search query, use it; if interests selected, add them to query
      let searchTerms = searchQuery.trim();
      
      // If interests/categories are selected, build a combined query
      if (selectedCategories.length > 0) {
        // Join selected interests with OR to broaden search
        const interestQuery = selectedCategories.join(' OR ');
        if (searchTerms) {
          // Combine user query with interests: "user query" AND (interest1 OR interest2)
          searchTerms = `${searchTerms} ${interestQuery}`;
        } else {
          // Just search by interests
          searchTerms = interestQuery;
        }
      }

      // Calculate date filter for API
      let fromDate;
      if (dateRange !== 'all') {
        const now = new Date();
        switch (dateRange) {
          case 'today':
            fromDate = new Date(now.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
            break;
          case 'week':
            fromDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
            break;
          case 'month':
            fromDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
            break;
        }
      }

      // Determine sort parameter for News API
      let sortByParam = 'publishedAt';
      if (sortBy === 'Most Relevant') {
        sortByParam = 'relevancy';
      } else if (sortBy === 'Highest Match') {
        sortByParam = 'popularity';
      }

      // Use News API search endpoint with combined query
      const response = await searchNews(searchTerms, {
        limit: 50,
        from: fromDate,
        sortBy: sortByParam,
      });

      if (response.success && response.data) {
        results = response.data.map(article => ({
          _id: article.url, // Use URL as unique ID for external articles
          title: article.title,
          content: article.description || article.content,
          url: article.url,
          urlToImage: article.urlToImage,
          publishedAt: article.publishedAt,
          source: article.source,
          author: article.author,
        }));
      }

      // Apply local sorting if needed (News API already sorted, but for display consistency)
      if (sortBy === 'Most Recent') {
        results.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      }

      setArticles(results);
    } catch (err) {
      console.error('Search failed:', err);
      setArticles([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, selectedCategories, dateRange, sortBy]);

  // Auto-search when filters change (with debounce for query)
  useEffect(() => {
    if (hasSearched) {
      handleSearch();
    }
  }, [selectedCategories, dateRange, sortBy]);

  // Filter discovery articles when filters change (before user searches)
  useEffect(() => {
    if (!hasSearched && discoveryArticles.length > 0) {
      let filtered = [...discoveryArticles];
      
      // Apply category filter - match by interest in matchedInterests, tags, or title/content
      if (selectedCategories.length > 0) {
        filtered = filtered.filter(article => {
          // Check matchedInterests array from discover API
          if (article.matchedInterests?.some(interest => 
            selectedCategories.some(cat => cat.toLowerCase() === interest.toLowerCase())
          )) {
            return true;
          }
          // Check tags
          if (article.tags?.some(tag => 
            selectedCategories.some(cat => tag.toLowerCase().includes(cat.toLowerCase()))
          )) {
            return true;
          }
          // Fallback: check title and content for interest keywords
          const articleText = `${article.title || ''} ${article.content || ''} ${article.description || ''}`.toLowerCase();
          return selectedCategories.some(category => 
            articleText.includes(category.toLowerCase())
          );
        });
      }
      
      // Apply date filter
      if (dateRange !== 'all') {
        const now = new Date();
        let cutoffDate;
        switch (dateRange) {
          case 'today':
            cutoffDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            cutoffDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        }
        if (cutoffDate) {
          filtered = filtered.filter(article =>
            new Date(article.publishedAt) >= cutoffDate
          );
        }
      }
      
      setFilteredDiscoveryArticles(filtered);
    }
  }, [hasSearched, discoveryArticles, selectedCategories, dateRange]);

  // Handle search on Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setArticles([]);
    setHasSearched(false);
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setDateRange('all');
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  /**
   * Helper function to ensure an article is stored in the database
   * For external articles (from search), stores them first and returns the MongoDB ID
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
   * Toggle article summary expansion
   */
  const handleToggleSummary = async (articleId) => {
    if (expandedSummaries[articleId]) {
      setExpandedSummaries(prev => ({ ...prev, [articleId]: null }));
      return;
    }

    // Find the article to ensure it's stored
    const article = articles.find(a => a._id === articleId) || 
                    filteredDiscoveryArticles.find(a => a._id === articleId);
    
    if (!article) {
      setErrorMessages(prev => ({
        ...prev,
        [articleId]: 'Article not found'
      }));
      return;
    }

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
   * Toggle save article
   */
  const handleToggleSave = async (articleId) => {
    const isSaved = savedArticles.has(articleId);
    
    // Find the article
    const article = articles.find(a => a._id === articleId) || 
                    filteredDiscoveryArticles.find(a => a._id === articleId);
    
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
          // Also remove the stored ID if different
          if (storedId !== articleId) {
            newSet.delete(storedId);
          }
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
          // Keep original ID for UI state if different
          if (storedId !== articleId) {
            newSet.add(articleId);
          }
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
    const article = articles.find(a => a._id === articleId) || 
                    filteredDiscoveryArticles.find(a => a._id === articleId);
    
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
          // Also remove the stored ID if different
          if (storedId !== articleId) {
            newSet.delete(storedId);
          }
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
          // Keep original ID for UI state if different
          if (storedId !== articleId) {
            newSet.add(articleId);
          }
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

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 flex items-center justify-center">
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

  const activeFiltersCount = selectedCategories.length + (dateRange !== 'all' ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900">
      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />

      {/* Mobile Filter Overlay */}
      {isMobileFilterOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileFilterOpen(false)}
        />
      )}

      {/* Shared Sidebar */}
      <Sidebar 
        user={user} 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />

      {/* Main Content */}
      <main className="pt-16 lg:pt-0 lg:ml-[200px]">
        {/* Search Bar Section - Fixed on desktop, scrolls on mobile */}
        <div className="lg:fixed lg:top-0 lg:left-[200px] lg:right-0 z-20 border-b border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 py-4 lg:py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            {/* Search Input */}
            <div className="relative mb-3 lg:mb-4">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4">
                <SearchIcon className="h-5 w-5 text-[#9CA3AF]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search articles..."
                className="w-full rounded-xl border border-[#E5E7EB] dark:border-gray-600 bg-white dark:bg-gray-700 py-3 sm:py-3.5 pl-10 sm:pl-12 pr-20 sm:pr-24 text-sm sm:text-base text-[#111111] dark:text-white placeholder-[#9CA3AF] focus:border-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
              />
              <div className="absolute inset-y-0 right-0 flex items-center gap-1 sm:gap-2 pr-2 sm:pr-3">
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                  >
                    <XIcon />
                  </button>
                )}
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="rounded-lg bg-[#111111] px-2.5 sm:px-4 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-[#000000] disabled:opacity-50 transition"
                >
                  {isSearching ? '...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap overflow-x-auto pb-1 -mb-1">
              <span className="hidden md:inline text-sm text-[#6B7280] dark:text-gray-400 flex-shrink-0">Quick Filters:</span>
              
              {/* Mobile Filter Button */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1 rounded-full px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium bg-[#F8F9FA] dark:bg-gray-700 text-[#6B7280] dark:text-gray-300 flex-shrink-0"
              >
                <FilterIcon className="h-4 w-4" />
                <span className="hidden xs:inline">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-0.5 sm:ml-1 bg-[#111111] text-white text-xs px-1.5 rounded-full">{activeFiltersCount}</span>
                )}
              </button>
              
              {/* Date Range Pills */}
              <button
                onClick={() => setDateRange(dateRange === 'today' ? 'all' : 'today')}
                className={`rounded-full px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition flex-shrink-0 ${
                  dateRange === 'today'
                    ? 'bg-[#111111] text-white'
                    : 'bg-[#F8F9FA] dark:bg-gray-700 text-[#6B7280] dark:text-gray-300 hover:bg-[#E5E7EB] dark:hover:bg-gray-600'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateRange(dateRange === 'week' ? 'all' : 'week')}
                className={`rounded-full px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition flex-shrink-0 ${
                  dateRange === 'week'
                    ? 'bg-[#111111] text-white'
                    : 'bg-[#F8F9FA] dark:bg-gray-700 text-[#6B7280] dark:text-gray-300 hover:bg-[#E5E7EB] dark:hover:bg-gray-600'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setDateRange(dateRange === 'month' ? 'all' : 'month')}
                className={`rounded-full px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition flex-shrink-0 ${
                  dateRange === 'month'
                    ? 'bg-[#111111] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                This Month
              </button>

              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="rounded-full px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex-shrink-0"
                >
                  Clear ({activeFiltersCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 lg:py-6 lg:pt-[140px]">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Left Sidebar Filters - Hidden on mobile, shown in drawer */}
            <aside className="hidden lg:block mt-10 w-[200px] flex-shrink-0 sticky top-[155px] self-start max-h-[calc(100vh-160px)] overflow-y-auto">
              {/* Interests Filter */}
              {userInterests.length > 0 && (
                <div className="mb-6 mt-4 rounded-lg bg-white dark:bg-gray-800 p-4 border border-[#E5E7EB] dark:border-gray-700">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280] dark:text-gray-400">
                    Your Interests
                  </h3>
                  <div className="space-y-2">
                    {userInterests.map((interest) => (
                      <label
                        key={interest}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(interest)}
                          onChange={() => handleCategoryToggle(interest)}
                          className="h-4 w-4 rounded border-[#E5E7EB] text-[#111111] focus:ring-[#111111]"
                        />
                        <span className="text-sm text-[#4A4A4A] dark:text-gray-300">{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* Main Results */}
            <section className="flex-1 lg:mt-10 min-w-0">
              {/* Results Header */}
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                  {hasSearched ? (
                    <>
                      <span className="font-semibold text-gray-900 dark:text-white">{articles.length} results</span>
                      {searchQuery && <span className="hidden sm:inline"> for &ldquo;{searchQuery}&rdquo;</span>}
                    </>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Enter a search query to find articles</span>
                  )}
                </p>
                {hasSearched && articles.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="flex items-center gap-1 text-sm text-[#6B7280] dark:text-gray-400 hover:text-[#111111] dark:hover:text-white"
                    >
                      Sort by: <span className="font-medium text-[#111111]">{sortBy}</span>
                      <ChevronDownIcon />
                    </button>
                    {showSortDropdown && (
                      <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-[#E5E7EB] dark:border-gray-600 bg-white dark:bg-gray-800 py-1 shadow-lg">
                        {['Most Relevant', 'Most Recent', 'Highest Match'].map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setSortBy(option);
                              setShowSortDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-[#F8F9FA] dark:hover:bg-gray-700 ${
                              sortBy === option ? 'text-[#111111]' : 'text-[#4A4A4A] dark:text-gray-300'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Search Results */}
              <div className="space-y-4">
                {isSearching ? (
                  <LoadingSkeleton />
                ) : !hasSearched ? (
                  <DiscoverySection 
                    articles={filteredDiscoveryArticles}
                    isLoading={isLoadingDiscovery}
                    hasFilters={selectedCategories.length > 0 || dateRange !== 'all'}
                    onToggleSummary={handleToggleSummary}
                    expandedSummaries={expandedSummaries}
                    summaryLoading={summaryLoading}
                    savedArticles={savedArticles}
                    favouriteArticles={favouriteArticles}
                    onToggleSave={handleToggleSave}
                    onToggleFavourite={handleToggleFavourite}
                  />
                ) : articles.length === 0 ? (
                  <NoResultsState query={searchQuery} onClearFilters={handleClearFilters} />
                ) : (
                  articles.map((article) => (
                    <ArticleCard
                      key={article._id}
                      article={article}
                      searchQuery={searchQuery}
                      onToggleSummary={handleToggleSummary}
                      summaryData={expandedSummaries[article._id]}
                      summaryLoading={summaryLoading[article._id]}
                      isSaved={savedArticles.has(article._id)}
                      isFavourite={favouriteArticles.has(article._id)}
                      onToggleSave={handleToggleSave}
                      onToggleFavourite={handleToggleFavourite}
                    />
                  ))
                )}
              </div>

              {/* Load More */}
              {hasSearched && articles.length > 0 && articles.length >= 20 && (
                <div className="mt-6 flex justify-center">
                  <button className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    Load more results
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        <div className={`lg:hidden fixed right-0 top-0 z-50 h-screen w-[280px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out overflow-y-auto ${
          isMobileFilterOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <CloseMenuIcon />
            </button>
          </div>
          <div className="p-4">
            {/* Interests Filter */}
            {userInterests.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280] dark:text-gray-400">
                  Your Interests
                </h3>
                <div className="space-y-2">
                  {userInterests.map((interest) => (
                    <label key={interest} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(interest)}
                        onChange={() => handleCategoryToggle(interest)}
                        className="h-4 w-4 rounded border-[#E5E7EB] text-[#111111] focus:ring-[#111111]"
                      />
                      <span className="text-sm text-[#4A4A4A] dark:text-gray-300">{interest}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  handleClearFilters();
                  setIsMobileFilterOpen(false);
                }}
                className="w-full rounded-lg border border-red-300 dark:border-red-700 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

/**
 * Article Card Component - Matches Dashboard style
 */
function ArticleCard({ article, searchQuery, onToggleSummary, summaryData, summaryLoading, isSaved, isFavourite, onToggleSave, onToggleFavourite }) {
  const timeAgo = getTimeAgo(article.publishedAt);
  const feedTitle = article.source?.name || article.feed?.title || null;
  const imageUrl = article.urlToImage || article.metadata?.imageUrl;

  // Highlight search terms in text
  const highlightText = (text, query) => {
    if (!query || !text) return text;
    try {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
      return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="rounded bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-200 px-0.5">{part}</span>
        ) : (
          part
        )
      );
    } catch {
      return text;
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          {/* Source and Time */}
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111111] text-[10px] text-white">📰</span>
            {feedTitle && (
              <>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{feedTitle}</span>
                <span className="text-sm text-gray-400">•</span>
              </>
            )}
            <span className="text-sm text-gray-400">{timeAgo}</span>
          </div>

          {/* Title */}
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white leading-snug">
            {highlightText(article.title, searchQuery)}
          </h3>

          {/* Description */}
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
            {highlightText(article.content?.substring(0, 200), searchQuery)}...
          </p>

          {/* Match and Tags */}
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            {article.relevanceScore && (
              <span className="flex items-center gap-1 rounded-full bg-[#d1fae5] dark:bg-teal-900/50 px-2.5 py-1 text-xs font-medium text-[#059669] dark:text-teal-400">
                <LightningIcon />
                {article.relevanceScore}% Match
              </span>
            )}
            {article.feed?.category && (
              <span className="rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1 text-xs text-gray-600 dark:text-gray-300 capitalize">
                {article.feed.category}
              </span>
            )}
            {article.metadata?.tags?.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1 text-xs text-gray-600 dark:text-gray-300">
                {tag}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => onToggleSummary(article._id)}
              disabled={summaryLoading}
              className="flex items-center gap-1 h-9 px-3 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-600 disabled:opacity-50 transition-colors"
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
                onClick={() => onToggleSave(article._id)}
                className={`flex items-center justify-center h-9 w-9 rounded-full border transition-colors ${isSaved ? 'text-[#111111] border-[#111111] bg-[#111111]/10' : 'text-gray-400 border-gray-200 dark:border-gray-600 hover:text-[#111111] hover:border-[#111111]'}`}
              >
                <BookmarkIcon filled={isSaved} />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {isSaved ? 'Remove from Read Later' : 'Read Later'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
            {/* Favourite Button with Tooltip */}
            <div className="relative group">
              <button
                onClick={() => onToggleFavourite(article._id)}
                className={`flex items-center justify-center h-9 w-9 rounded-full border transition-colors ${isFavourite ? 'text-pink-500 border-pink-500 bg-pink-500/10' : 'text-gray-400 border-gray-200 dark:border-gray-600 hover:text-pink-500 hover:border-pink-500'}`}
              >
                <HeartIcon filled={isFavourite} />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {isFavourite ? 'Remove from Favourites' : 'Favourite'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-9 rounded-full bg-gray-900 dark:bg-gray-100 px-4 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
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
        <div className="mt-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <SparkleIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
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
                  className="self-start text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-purple-900 dark:text-purple-100">{summaryData.summary}</p>
          )}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
          <div className="flex gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-[140px] w-[180px] bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DiscoverySection({ 
  articles, 
  isLoading, 
  hasFilters, 
  onToggleSummary, 
  expandedSummaries,  
  summaryLoading,
  savedArticles,
  favouriteArticles,
  onToggleSave,
  onToggleFavourite
}) {
  return (
    <div className="space-y-6">
      {/* Search Prompt */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
          <SearchIcon className="h-7 w-7 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Search Your News</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Enter keywords, topics, or source names to find relevant articles from your feeds.
        </p>
      </div>

      {/* Discovery Section */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-[#111111]" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {hasFilters ? 'Filtered Results' : 'In Case You Missed It'}
          </h3>
          {hasFilters && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({articles.length} article{articles.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="h-[100px] w-[140px] bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {hasFilters 
                ? 'No articles match your selected filters. Try adjusting your filter criteria.'
                : 'No articles available yet. Add more feeds to see content here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <ArticleCard
                key={article._id}
                article={article}
                searchQuery=""
                onToggleSummary={onToggleSummary}
                summaryData={expandedSummaries[article._id]}
                summaryLoading={summaryLoading[article._id]}
                isSaved={savedArticles.has(article._id)}
                isFavourite={favouriteArticles.has(article._id)}
                onToggleSave={onToggleSave}
                onToggleFavourite={onToggleFavourite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NoResultsState({ query, onClearFilters }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
        <SearchIcon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Results Found</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
        No articles match &ldquo;{query}&rdquo; with your current filters. Try different keywords or clear filters.
      </p>
      <button
        onClick={onClearFilters}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#111111] px-4 py-2 text-sm font-medium text-white hover:bg-[#000000] transition"
      >
        Clear All Filters
      </button>
    </div>
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

function SearchIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function SparklesIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

function SparkleIcon({ className = 'h-4 w-4' }) {
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

function HamburgerIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseMenuIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function FilterIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
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

function CollectionsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function NavSearchIcon() {
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

function NavItem({ href, icon, label, active = false, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active ? 'bg-[#111111]/10 text-[#111111]' : 'text-[#6B7280] dark:text-gray-300 hover:bg-[#F8F9FA] dark:hover:bg-gray-700 hover:text-[#111111] dark:hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
