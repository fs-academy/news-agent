/**
 * API utility functions for NewsAgent
 */

// Backend API URL - configured via environment variable
// In development: NEXT_PUBLIC_API_URL=http://localhost:3001/api
// In production: NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Get the configured API base URL
 * @returns {string} API base URL
 */
export function getApiBaseUrl() {
  return API_BASE_URL;
}

/**
 * Custom API error class with response details
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Parse error response from API
 * @param {Response} response - Fetch response object
 * @returns {Promise<ApiError>} ApiError with details
 */
async function parseErrorResponse(response) {
  let message = `API error: ${response.status} ${response.statusText}`;
  let data = null;
  
  try {
    data = await response.json();
    message = data.message || data.error || message;
  } catch {
    // Response is not JSON, use default message
  }

  // Auto-clear auth on 401 Unauthorized errors (expired/invalid token)
  if (response.status === 401) {
    removeAuthToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  }
  
  return new ApiError(message, response.status, data);
}

/**
 * Get auth token from localStorage
 * @returns {string|null} JWT token or null
 */
export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Set auth token in localStorage
 * @param {string} token - JWT token
 */
export function setAuthToken(token) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
}

/**
 * Remove auth token from localStorage
 */
export function removeAuthToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
}

/**
 * Get default headers including auth token if available
 * @returns {Object} Headers object
 */
function getDefaultHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Make a GET request to the API
 * @param {string} endpoint - API endpoint path
 * @param {Object} [options] - Fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiGet(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      ...getDefaultHeaders(),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json();
}

/**
 * Make a POST request to the API
 * @param {string} endpoint - API endpoint path
 * @param {Object} data - Request body data
 * @param {Object} [options] - Fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiPost(endpoint, data, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      ...getDefaultHeaders(),
      ...options.headers,
    },
    body: JSON.stringify(data),
    ...options,
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json();
}

/**
 * Make a PATCH request to the API
 * @param {string} endpoint - API endpoint path
 * @param {Object} data - Request body data
 * @param {Object} [options] - Fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiPatch(endpoint, data, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: {
      ...getDefaultHeaders(),
      ...options.headers,
    },
    body: JSON.stringify(data),
    ...options,
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json();
}

/**
 * Make a DELETE request to the API
 * @param {string} endpoint - API endpoint path
 * @param {Object} [options] - Fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiDelete(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers,
    ...options,
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json();
}

// ============================================
// Auth API Functions
// ============================================

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.fullName - User full name
 * @returns {Promise<{success: boolean, token: string, user: Object}>}
 */
export async function signup(userData) {
  const response = await apiPost('/auth/signup', userData);
  if (response.token) {
    setAuthToken(response.token);
  }
  return response;
}

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<{success: boolean, token: string, user: Object}>}
 */
export async function login(credentials) {
  const response = await apiPost('/auth/login', credentials);
  if (response.token) {
    setAuthToken(response.token);
  }
  return response;
}

/**
 * Logout user (client-side only)
 * Clears all auth data from localStorage
 */
export function logout() {
  removeAuthToken();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
}

/**
 * Request password reset email
 * @param {string} email - User email address
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function forgotPassword(email) {
  return apiPost('/auth/forgot-password', { email });
}

/**
 * Verify password reset token
 * @param {string} token - Reset token from email
 * @returns {Promise<{success: boolean, valid: boolean}>}
 */
export async function verifyResetToken(token) {
  return apiPost('/auth/verify-reset-token', { token });
}

/**
 * Reset password using token
 * @param {string} token - Reset token from email
 * @param {string} newPassword - New password
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function resetPassword(token, newPassword) {
  return apiPost('/auth/reset-password', { token, password: newPassword });
}

/**
 * Get current user profile
 * @returns {Promise<{success: boolean, user: Object}>}
 */
export async function getCurrentUser() {
  return apiGet('/auth/me');
}

/**
 * Update current user profile
 * @param {Object} updates - Profile updates
 * @returns {Promise<{success: boolean, user: Object}>}
 */
export async function updateProfile(updates) {
  return apiPatch('/auth/me', updates);
}

// ============================================
// OAuth API Functions
// ============================================

/**
 * Get the OAuth URL for a provider
 * @param {'google' | 'github'} provider - OAuth provider name
 * @returns {string} Full OAuth URL
 */
export function getOAuthUrl(provider) {
  return `${API_BASE_URL}/auth/${provider}`;
}

/**
 * Initiate OAuth login flow
 * Opens the OAuth provider's authentication page
 * @param {'google' | 'github'} provider - OAuth provider name
 */
export function initiateOAuthLogin(provider) {
  const authUrl = getOAuthUrl(provider);
  window.location.href = authUrl;
}

/**
 * Handle OAuth callback parameters
 * Processes token and user data from URL parameters after OAuth redirect
 * @returns {{success: boolean, token?: string, user?: Object, error?: string}}
 */
export function handleOAuthCallback() {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not in browser environment' };
  }

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const userBase64 = urlParams.get('user');
  const error = urlParams.get('error');

  // Clean up URL parameters
  if (token || userBase64 || error) {
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  if (error) {
    const errorMessages = {
      'oauth_denied': 'OAuth authorization was denied. Please try again.',
      'no_code': 'No authorization code received. Please try again.',
      'token_exchange_failed': 'Failed to complete authentication. Please try again.',
      'userinfo_failed': 'Failed to get user information. Please try again.',
      'token_error': 'Authentication token error. Please try again.',
      'oauth_failed': 'OAuth authentication failed. Please try again.',
    };
    return { 
      success: false, 
      error: errorMessages[error] || 'Authentication failed. Please try again.' 
    };
  }

  if (token && userBase64) {
    try {
      const user = JSON.parse(atob(userBase64));
      setAuthToken(token);
      return { success: true, token, user };
    } catch (err) {
      return { success: false, error: 'Failed to parse user data' };
    }
  }

  return { success: false };
}

/**
 * Check if user came from OAuth redirect
 * @returns {boolean}
 */
export function isOAuthCallback() {
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('token') || urlParams.has('error');
}

// ============================================
// Article API Functions
// ============================================

/**
 * Get articles for current user based on their interests
 * @param {Object} options - Query options
 * @param {number} [options.limit=20] - Maximum articles to return
 * @param {number} [options.skip=0] - Number of articles to skip
 * @param {string} [options.category] - Filter by category
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export async function getUserArticles(options = {}) {
  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit);
  if (options.skip) params.append('skip', options.skip);
  if (options.category) params.append('category', options.category);
  
  const queryString = params.toString();
  return apiGet(`/articles/user${queryString ? `?${queryString}` : ''}`);
}

/**
 * Search articles using text search (no AI ranking)
 * @param {string} query - Search query
 * @param {number} [limit=50] - Maximum articles to return
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export async function searchArticles(query, limit = 50) {
  const params = new URLSearchParams();
  params.append('search', query);
  params.append('limit', limit);
  return apiGet(`/articles?${params.toString()}`);
}

/**
 * Get AI-ranked articles for user based on their interests
 * Calls Python AI service for intelligent ranking with graceful fallback
 * @param {number} [limit=20] - Maximum articles to return
 * @returns {Promise<{success: boolean, data: Array, aiRanked: boolean, needsInterests?: boolean, needsFeeds?: boolean}>}
 */
export async function getRankedArticles(limit = 20) {
  return apiGet(`/articles/user/ranked?limit=${limit}`);
}

/**
 * Get a single article by ID
 * @param {string} articleId - Article ID
 * @returns {Promise<{success: boolean, data: Object}>}
 */
export async function getArticle(articleId) {
  return apiGet(`/articles/${articleId}`);
}

/**
 * Get AI-generated summary for an article
 * Proxies to Python AI service with caching and graceful fallback
 * @param {string} articleId - Article ID
 * @returns {Promise<{success: boolean, data: {summary: string, cached?: boolean, fallback?: boolean}}>}
 */
export async function summarizeArticle(articleId) {
  return apiPost(`/articles/${articleId}/summarize`, {});
}

/**
 * Rank articles by query using AI
 * @param {string} query - Search/ranking query
 * @param {number} [limit=20] - Maximum articles to return
 * @returns {Promise<{success: boolean, data: Array, fallback?: boolean}>}
 */
export async function rankArticles(query, limit = 20) {
  return apiPost('/articles/rank', { query, limit });
}

// ============================================
// Article Save/Favourite Functions
// ============================================

/**
 * Save an article for "Read Later"
 * @param {string} articleId - Article ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function saveArticle(articleId) {
  return apiPost(`/articles/${articleId}/save`, {});
}

/**
 * Remove an article from "Read Later"
 * @param {string} articleId - Article ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function unsaveArticle(articleId) {
  return apiDelete(`/articles/${articleId}/save`);
}

/**
 * Add an article to "Favourites"
 * @param {string} articleId - Article ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function favouriteArticle(articleId) {
  return apiPost(`/articles/${articleId}/favourite`, {});
}

/**
 * Remove an article from "Favourites"
 * @param {string} articleId - Article ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function unfavouriteArticle(articleId) {
  return apiDelete(`/articles/${articleId}/favourite`);
}

/**
 * Get user's saved articles (Read Later)
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export async function getSavedArticles() {
  return apiGet('/articles/saved');
}

/**
 * Get user's favourite articles
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export async function getFavouriteArticles() {
  return apiGet('/articles/favourites');
}

/**
 * Get all saved and favourite articles for user
 * @returns {Promise<{success: boolean, data: Array, savedIds: Array, favouriteIds: Array}>}
 */
export async function getCollectionArticles() {
  return apiGet('/articles/collection');
}

// ============================================
// News API Functions (External News Sources)
// ============================================

/**
 * Discover news based on user's interests from external News APIs
 * @param {Object} options - Query options
 * @param {number} [options.limit=20] - Maximum articles to return
 * @returns {Promise<{success: boolean, data: Array, source: string, totalResults: number, interests: Array}>}
 */
export async function discoverNews(options = {}) {
  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit);
  
  const queryString = params.toString();
  return apiGet(`/news/discover${queryString ? `?${queryString}` : ''}`);
}

/**
 * Search news by keyword from external News APIs
 * @param {string} query - Search query
 * @param {Object} options - Query options
 * @param {number} [options.limit=20] - Maximum articles to return
 * @param {string} [options.from] - Start date (YYYY-MM-DD)
 * @param {string} [options.sortBy='publishedAt'] - Sort order
 * @returns {Promise<{success: boolean, data: Array, source: string, query: string}>}
 */
export async function searchNews(query, options = {}) {
  const params = new URLSearchParams();
  params.append('q', query);
  if (options.limit) params.append('limit', options.limit);
  if (options.from) params.append('from', options.from);
  if (options.sortBy) params.append('sortBy', options.sortBy);
  
  return apiGet(`/news/search?${params.toString()}`);
}

/**
 * Get top headlines from News API
 * @param {Object} options - Query options
 * @param {string} [options.category='technology'] - News category
 * @param {number} [options.limit=20] - Maximum articles to return
 * @param {string} [options.country='us'] - Country code
 * @returns {Promise<{success: boolean, data: Array, source: string, category: string}>}
 */
export async function getTopHeadlines(options = {}) {
  const params = new URLSearchParams();
  if (options.category) params.append('category', options.category);
  if (options.limit) params.append('limit', options.limit);
  if (options.country) params.append('country', options.country);
  
  const queryString = params.toString();
  return apiGet(`/news/headlines${queryString ? `?${queryString}` : ''}`);
}

/**
 * Get news for a specific topic/interest
 * @param {string} topic - Topic name (e.g., 'AI & Machine Learning', 'Startups')
 * @param {Object} options - Query options
 * @param {number} [options.limit=20] - Maximum articles to return
 * @returns {Promise<{success: boolean, data: Array, source: string, topic: string}>}
 */
export async function getNewsByTopic(topic, options = {}) {
  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit);
  
  const queryString = params.toString();
  return apiGet(`/news/topic/${encodeURIComponent(topic)}${queryString ? `?${queryString}` : ''}`);
}

/**
 * Refresh news - fetch fresh articles from News API based on user interests
 * @returns {Promise<{success: boolean, message: string, articlesCount: number, source: string}>}
 */
export async function refreshNews() {
  return apiPost('/news/refresh', {});
}

/**
 * Get user's cached/stored news articles
 * @param {Object} options - Query options
 * @param {number} [options.limit=20] - Maximum articles to return
 * @param {number} [options.skip=0] - Number to skip (pagination)
 * @param {boolean} [options.ranked=false] - Whether to return AI-ranked order
 * @returns {Promise<{success: boolean, data: Array, total: number, hasMore: boolean}>}
 */
export async function getUserNews(options = {}) {
  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit);
  if (options.skip) params.append('skip', options.skip);
  if (options.ranked) params.append('ranked', 'true');
  
  const queryString = params.toString();
  return apiGet(`/news/user${queryString ? `?${queryString}` : ''}`);
}

/**
 * Get available interest categories for news discovery
 * @returns {Promise<{success: boolean, data: Array<string>}>}
 */
export async function getNewsCategories() {
  return apiGet('/news/categories');
}

/**
 * Store an external article in the database
 * Used before saving/favouriting/summarizing articles from search results
 * @param {Object} article - Article data
 * @param {string} article.url - Article URL (required)
 * @param {string} article.title - Article title (required)
 * @param {string} [article.description] - Article description
 * @param {string} [article.content] - Article content
 * @param {string} [article.urlToImage] - Image URL
 * @param {string} [article.publishedAt] - Publication date
 * @param {Object} [article.source] - Source info
 * @param {string} [article.author] - Author name
 * @returns {Promise<{success: boolean, data: {_id: string, isNew: boolean}}>}
 */
export async function storeArticle(article) {
  return apiPost('/news/store-article', article);
}

