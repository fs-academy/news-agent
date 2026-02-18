'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthToken, getCollectionArticles, unsaveArticle, unfavouriteArticle, summarizeArticle } from '../../lib/api';
import { getStoredUser, logout } from '../../lib/auth';
import Sidebar, { MobileHeader } from '../../components/Sidebar';
import { useTheme } from '../../context/ThemeContext';

/**
 * NewsAgent Collections Page
 * View and manage saved and favourite articles
 */

const TABS = [
  { id: 'all', name: 'All', icon: <GridIcon /> },
  { id: 'read-later', name: 'Read Later', icon: <BookmarkIcon /> },
  { id: 'favourites', name: 'Favourites', icon: <HeartIcon /> },
];

export default function CollectionsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('all');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [articlesLoading, setArticlesLoading] = useState(false);
  
  // AI Summary states
  const [expandedSummaries, setExpandedSummaries] = useState({});
  const [summaryLoading, setSummaryLoading] = useState({});
  
  // Remove confirmation dialog state
  const [removeDialog, setRemoveDialog] = useState({ isOpen: false, articleId: null, type: null, articleTitle: '' });
  
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  /**
   * Fetch collection articles from backend
   */
  const fetchCollectionArticles = useCallback(async () => {
    setArticlesLoading(true);
    try {
      const response = await getCollectionArticles();
      console.log('Collection API response:', response);
      if (response.success) {
        setArticles(response.data || []);
        const savedSet = new Set(response.savedIds || []);
        const favSet = new Set(response.favouriteIds || []);
        console.log('Saved IDs:', response.savedIds);
        console.log('Favourite IDs:', response.favouriteIds);
        setSavedIds(savedSet);
        setFavouriteIds(favSet);
      }
    } catch (err) {
      console.error('Failed to fetch collection articles:', err);
    } finally {
      setArticlesLoading(false);
    }
  }, []);

  /**
   * Show confirmation dialog before removing from Read Later
   */
  const handleRemoveFromSaved = (articleId, articleTitle) => {
    setRemoveDialog({ isOpen: true, articleId, type: 'saved', articleTitle });
  };

  /**
   * Show confirmation dialog before removing from Favourites
   */
  const handleRemoveFromFavourites = (articleId, articleTitle) => {
    setRemoveDialog({ isOpen: true, articleId, type: 'favourite', articleTitle });
  };

  /**
   * Confirm and execute removal
   */
  const confirmRemove = async () => {
    const { articleId, type } = removeDialog;
    console.log('confirmRemove called:', { articleId, type });
    
    try {
      if (type === 'saved') {
        console.log('Calling unsaveArticle API for:', articleId);
        const response = await unsaveArticle(articleId);
        console.log('unsaveArticle response:', response);
        
        if (response.success) {
          // Check if article is in favourites BEFORE updating state
          const isInFavourites = favouriteIds.has(articleId);
          console.log('isInFavourites:', isInFavourites);
          
          setSavedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(articleId);
            return newSet;
          });
          
          // If article is no longer in favourites, remove from articles list
          if (!isInFavourites) {
            setArticles(prev => prev.filter(a => {
              const aId = typeof a._id === 'object' ? a._id.toString() : a._id;
              return aId !== articleId;
            }));
          }
        }
      } else if (type === 'favourite') {
        console.log('Calling unfavouriteArticle API for:', articleId);
        const response = await unfavouriteArticle(articleId);
        console.log('unfavouriteArticle response:', response);
        
        if (response.success) {
          // Check if article is in saved BEFORE updating state
          const isInSaved = savedIds.has(articleId);
          console.log('isInSaved:', isInSaved);
          
          setFavouriteIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(articleId);
            return newSet;
          });
          
          // If article is no longer in saved, remove from articles list
          if (!isInSaved) {
            setArticles(prev => prev.filter(a => {
              const aId = typeof a._id === 'object' ? a._id.toString() : a._id;
              return aId !== articleId;
            }));
          }
        }
      }
    } catch (err) {
      console.error('Failed to remove article:', err);
    } finally {
      setRemoveDialog({ isOpen: false, articleId: null, type: null, articleTitle: '' });
    }
  };

  /**
   * Cancel removal
   */
  const cancelRemove = () => {
    setRemoveDialog({ isOpen: false, articleId: null, type: null, articleTitle: '' });
  };

  /**
   * Toggle AI summary for an article
   */
  const handleToggleSummary = async (articleId) => {
    if (expandedSummaries[articleId]) {
      // Collapse
      setExpandedSummaries(prev => ({ ...prev, [articleId]: null }));
      return;
    }

    // Fetch summary
    setSummaryLoading(prev => ({ ...prev, [articleId]: true }));
    try {
      const response = await summarizeArticle(articleId);
      if (response.success && response.data) {
        // Check if there was an error in the response
        if (response.data.error || !response.data.summary) {
          setExpandedSummaries(prev => ({ 
            ...prev, 
            [articleId]: {
              summary: null,
              error: true,
              fallback: true,
              userMessage: response.data.userMessage || 'Unable to generate summary. Please try again.',
              retryable: response.data.retryable !== false
            }
          }));
        } else {
          setExpandedSummaries(prev => ({ 
            ...prev, 
            [articleId]: {
              summary: response.data.summary,
              cached: response.data.cached,
              fallback: response.data.fallback
            }
          }));
        }
      } else {
        throw new Error(response.message || 'Failed to generate summary');
      }
    } catch (err) {
      console.error('Failed to get summary:', err);
      setExpandedSummaries(prev => ({ 
        ...prev, 
        [articleId]: { 
          summary: null, 
          error: true,
          userMessage: err.message || 'Failed to generate summary. Please try again.',
          retryable: true
        }
      }));
    } finally {
      setSummaryLoading(prev => ({ ...prev, [articleId]: false }));
    }
  };

  // Check authentication on mount
  useEffect(() => {
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
    setIsLoading(false);
  }, [router]);

  // Fetch articles when user is loaded
  useEffect(() => {
    if (user) {
      fetchCollectionArticles();
    }
  }, [user, fetchCollectionArticles]);

  // Filter articles based on active tab
  const filteredArticles = articles.filter(article => {
    if (activeTab === 'all') return true;
    if (activeTab === 'read-later') return savedIds.has(article._id);
    if (activeTab === 'favourites') return favouriteIds.has(article._id);
    return true;
  });

  // Count stats
  const savedCount = articles.filter(a => savedIds.has(a._id)).length;
  const favouriteCount = articles.filter(a => favouriteIds.has(a._id)).length;

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

      {/* Remove Article Confirmation Dialog */}
      <RemoveConfirmDialog
        isOpen={removeDialog.isOpen}
        onClose={cancelRemove}
        onConfirm={confirmRemove}
        type={removeDialog.type}
        articleTitle={removeDialog.articleTitle}
      />

      {/* Main Content */}
      <main className="pt-16 lg:pt-0 lg:ml-[200px] flex-1 ">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] dark:text-white">Collections</h1>
            <p className="text-sm sm:text-base text-[#6B7280] dark:text-gray-400">Your saved and favourite articles in one place.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 lg:mb-8">
            <div className="rounded-xl border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                  <GridIcon className="h-5 w-5 text-[#6B7280] dark:text-gray-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#111111] dark:text-white">{articles.length}</p>
                  <p className="text-sm text-[#6B7280] dark:text-gray-400">Total Articles</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#111111]/10">
                  <BookmarkIcon className="h-5 w-5 text-[#111111]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#111111] dark:text-white">{savedCount}</p>
                  <p className="text-sm text-[#6B7280] dark:text-gray-400">Read Later</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30">
                  <HeartIcon className="h-5 w-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#111111] dark:text-white">{favouriteCount}</p>
                  <p className="text-sm text-[#6B7280] dark:text-gray-400">Favourites</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs - Sticky */}
          <div className="sticky top-16 lg:top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-[#f8f9fa] dark:bg-gray-900 mb-6 shadow-sm">
            <div className="flex items-center gap-1 sm:gap-2 border border-[#E5E7EB] dark:border-gray-700 overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#111111] text-[#111111]'
                      : 'border-transparent text-[#6B7280] dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.name}</span>
                  {tab.id === 'all' && <span className="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{articles.length}</span>}
                  {tab.id === 'read-later' && <span className="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{savedCount}</span>}
                  {tab.id === 'favourites' && <span className="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{favouriteCount}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Articles List */}
          <div className="space-y-4">
            {articlesLoading ? (
              <LoadingSkeleton />
            ) : filteredArticles.length === 0 ? (
              <EmptyState activeTab={activeTab} />
            ) : (
              filteredArticles.map((article) => {
                const articleIdStr = typeof article._id === 'object' ? article._id.toString() : article._id;
                return (
                <CollectionArticleCard
                  key={articleIdStr}
                  article={article}
                  articleId={articleIdStr}
                  isSaved={savedIds.has(articleIdStr)}
                  isFavourite={favouriteIds.has(articleIdStr)}
                  onRemoveFromSaved={handleRemoveFromSaved}
                  onRemoveFromFavourites={handleRemoveFromFavourites}
                  summaryData={expandedSummaries[articleIdStr]}
                  summaryLoading={summaryLoading[articleIdStr]}
                  onToggleSummary={handleToggleSummary}
                />
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Collection Article Card Component
 */
function CollectionArticleCard({ article, articleId, isSaved, isFavourite, onRemoveFromSaved, onRemoveFromFavourites, summaryData, summaryLoading, onToggleSummary }) {
  const timeAgo = getTimeAgo(article.publishedAt);
  const sourceName = article.source?.name || article.feed?.title || null;
  const imageUrl = article.urlToImage || article.metadata?.imageUrl;

  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 transition hover:shadow-md">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          {/* Source, Time and Status badges */}
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111111] text-[10px] text-white">📰</span>
            {sourceName && (
              <>
                <span className="text-sm font-medium text-[#111111] dark:text-white">{sourceName}</span>
                <span className="text-sm text-gray-400">•</span>
              </>
            )}
            <span className="text-sm text-gray-400">{timeAgo}</span>
            {/* Status badges - moved to left near date */}
            {isSaved && (
              <>
                <span className="text-sm text-gray-400">•</span>
                <span className="flex items-center gap-1 rounded-full bg-[#111111]/10 px-2 py-0.5 text-xs text-[#111111]">
                  <BookmarkIcon className="h-3 w-3" />
                  Read Later
                </span>
              </>
            )}
            {isFavourite && (
              <>
                <span className="text-sm text-gray-400">•</span>
                <span className="flex items-center gap-1 rounded-full bg-pink-100 dark:bg-pink-900/30 px-2 py-0.5 text-xs text-pink-500">
                  <HeartIcon className="h-3 w-3" />
                  Favourite
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="mb-2 text-lg font-semibold text-[#111111] dark:text-white leading-snug">{article.title}</h3>

          {/* Description */}
          <p className="mb-3 text-sm text-[#6B7280] dark:text-gray-400 leading-relaxed line-clamp-2">
            {article.content?.substring(0, 200)}...
          </p>

          {/* Category */}
          {article.feed?.category && (
            <span className="inline-block rounded-full border border-[#E5E7EB] dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1 text-xs text-[#6B7280] dark:text-gray-300 capitalize mb-3">
              {article.feed.category}
            </span>
          )}

          {/* Actions - Read Article moved to left with remove buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-gray-900 dark:bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white dark:text-[#111111] hover:bg-gray-800 dark:hover:bg-gray-200 transition"
            >
              Read Article
            </a>
            <button
              onClick={() => onToggleSummary(articleId)}
              disabled={summaryLoading}
              className="flex items-center gap-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-50 transition-colors"
            >
              {summaryLoading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <SparkleIcon className="h-4 w-4" />
              )}
              <span className="text-xs">{summaryData ? 'Hide' : 'AI Summary'}</span>
            </button>
            {isSaved && (
              <button
                onClick={() => onRemoveFromSaved(articleId, article.title)}
                className="flex items-center gap-1 text-xs sm:text-sm text-[#6B7280] hover:text-[#111111] transition-colors"
              >
                <BookmarkIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Remove from Read Later</span>
                <span className="sm:hidden">Remove</span>
              </button>
            )}
            {isFavourite && (
              <button
                onClick={() => onRemoveFromFavourites(articleId, article.title)}
                className="flex items-center gap-1 text-xs sm:text-sm text-[#6B7280] hover:text-pink-500 transition-colors"
              >
                <HeartIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Remove from Favourites</span>
                <span className="sm:hidden">Remove</span>
              </button>
            )}
          </div>
        </div>

        {/* Article Image */}
        {imageUrl && (
          <div className="relative h-[160px] sm:h-[120px] w-full sm:w-[160px] flex-shrink-0 overflow-hidden rounded-lg order-first sm:order-last">
            <img
              src={imageUrl}
              alt={article.title}
              className="h-full w-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
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
                  onClick={() => onToggleSummary(articleId)}
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

/**
 * Remove Confirmation Dialog Component
 */
function RemoveConfirmDialog({ isOpen, onClose, onConfirm, type, articleTitle }) {
  if (!isOpen) return null;

  const typeLabel = type === 'saved' ? 'Read Later' : 'Favourites';
  const typeIcon = type === 'saved' ? (
    <BookmarkIcon className="h-6 w-6 text-[#111111]" />
  ) : (
    <HeartIcon className="h-6 w-6 text-pink-500" />
  );
  const confirmButtonClass = type === 'saved' 
    ? 'bg-[#111111] hover:bg-[#000000]' 
    : 'bg-pink-500 hover:bg-pink-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl mx-4">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
          {typeIcon}
        </div>
        
        {/* Title */}
        <h3 className="text-center text-lg font-semibold text-[#111111] dark:text-white mb-2">
          Remove from {typeLabel}?
        </h3>
        
        {/* Description */}
        <p className="text-center text-sm text-[#6B7280] dark:text-gray-400 mb-6">
          Are you sure you want to remove <span className="font-medium text-gray-700 dark:text-gray-300">&quot;{articleTitle?.substring(0, 50)}{articleTitle?.length > 50 ? '...' : ''}&quot;</span> from your {typeLabel} collection?
        </p>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#F8F9FA] dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition ${confirmButtonClass}`}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading Skeleton Component
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 p-5 animate-pulse">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
            <div className="h-[120px] w-[160px] bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty State Component
 */
function EmptyState({ activeTab }) {
  const messages = {
    all: {
      title: 'No saved articles yet',
      description: 'Start saving articles from your dashboard to build your collection.',
      icon: <GridIcon className="h-6 w-6 text-gray-400" />,
    },
    'read-later': {
      title: 'No Read Later articles',
      description: 'Click the bookmark icon on any article to save it for later.',
      icon: <BookmarkIcon className="h-6 w-6 text-gray-400" />,
    },
    favourites: {
      title: 'No Favourite articles',
      description: 'Click the heart icon on any article to add it to your favourites.',
      icon: <HeartIcon className="h-6 w-6 text-gray-400" />,
    },
  };

  const content = messages[activeTab] || messages.all;

  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
        {content.icon}
      </div>
      <h3 className="font-semibold text-[#111111] dark:text-white">{content.title}</h3>
      <p className="mt-2 text-sm text-[#6B7280] dark:text-gray-400">{content.description}</p>
      <Link
        href="/dashboard"
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#111111] px-4 py-2 text-sm font-medium text-white hover:bg-[#000000] transition"
      >
        Go to Home
      </Link>
    </div>
  );
}

/**
 * Navigation Item Component
 */
function NavItem({ href, icon, label, active = false, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? 'bg-[#111111]/10 text-[#111111]'
          : 'text-[#6B7280] dark:text-gray-300 hover:bg-[#F8F9FA] dark:hover:bg-gray-700 hover:text-[#111111] dark:hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

/**
 * Get time ago string
 */
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

function GridIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  );
}

function BookmarkIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function HeartIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function SparkleIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
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
