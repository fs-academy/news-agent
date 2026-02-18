/**
 * News API Service
 * Fetches news from NewsAPI.org (primary) and GNews.io (fallback)
 */

import { config } from '../config.js';

/**
 * Map user interests to search keywords
 */
export const INTEREST_KEYWORDS = {
  'AI & ML': 'artificial intelligence OR machine learning OR AI OR deep learning OR LLM',
  'Startups': 'startup OR venture capital OR funding OR entrepreneurship',
  'Security': 'cybersecurity OR hacking OR data breach OR security',
  'Tech News': 'technology OR software OR tech',
  'Fintech': 'fintech OR digital banking OR payments OR neobank',
  'Biotech': 'biotech OR biotechnology OR pharma OR healthcare',
  'Design': 'design OR UX OR user experience OR UI',
  'Markets': 'stock market OR investing OR trading OR finance',
  'Politics': 'politics OR government OR policy OR election',
  'Science': 'science OR research OR space OR climate',
  'Gaming': 'gaming OR video games OR esports',
  'Web3': 'cryptocurrency OR blockchain OR web3 OR bitcoin OR ethereum',
};

/**
 * Common stop words to filter out from custom topics
 */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'about', 'above', 'after',
  'before', 'between', 'into', 'through', 'during', 'under', 'again', 'further',
  'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'new', 'current',
  'latest', 'recent', 'trending', 'popular', 'top', 'best', 'today', 'this', 'that',
]);

/**
 * Synonym/related terms expansion dictionary
 * Maps common words to expanded search terms
 */
const KEYWORD_EXPANSIONS = {
  // Technology terms
  'ai': ['artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'chatgpt', 'openai'],
  'artificial intelligence': ['AI', 'machine learning', 'deep learning', 'neural network', 'LLM'],
  'ml': ['machine learning', 'AI', 'deep learning'],
  'tech': ['technology', 'software', 'digital', 'innovation'],
  'technology': ['tech', 'software', 'digital', 'innovation', 'gadgets'],
  'technologies': ['technology', 'tech', 'software', 'digital', 'innovation'],
  'software': ['technology', 'application', 'program', 'development'],
  'trend': ['trending', 'popular', 'emerging', 'growth', 'rise'],
  'trends': ['trending', 'popular', 'emerging', 'growth', 'developments'],
  
  // Business terms
  'startup': ['startups', 'venture', 'funding', 'entrepreneurship', 'founder'],
  'business': ['company', 'enterprise', 'corporate', 'industry'],
  'finance': ['financial', 'banking', 'investment', 'fintech', 'money'],
  'market': ['markets', 'trading', 'stock', 'investing', 'economy'],
  
  // Security terms
  'security': ['cybersecurity', 'hacking', 'breach', 'privacy', 'protection'],
  'cyber': ['cybersecurity', 'hacking', 'digital security', 'online threats'],
  'hack': ['hacking', 'cyber attack', 'breach', 'vulnerability'],
  
  // Science terms
  'science': ['scientific', 'research', 'discovery', 'study'],
  'research': ['study', 'discovery', 'scientific', 'innovation'],
  'space': ['NASA', 'SpaceX', 'astronomy', 'satellite', 'rocket'],
  'climate': ['climate change', 'global warming', 'environment', 'sustainability'],
  
  // Crypto/Web3 terms
  'crypto': ['cryptocurrency', 'bitcoin', 'ethereum', 'blockchain'],
  'blockchain': ['crypto', 'decentralized', 'web3', 'smart contract'],
  'nft': ['NFTs', 'digital art', 'collectibles', 'blockchain'],
  
  // Gaming terms
  'gaming': ['video games', 'esports', 'game', 'playstation', 'xbox'],
  'game': ['gaming', 'video game', 'esports'],
  'games': ['gaming', 'video games', 'esports'],
  
  // Health terms
  'health': ['healthcare', 'medical', 'medicine', 'wellness'],
  'medical': ['healthcare', 'medicine', 'health', 'clinical'],
  'biotech': ['biotechnology', 'pharmaceutical', 'drug', 'clinical trial'],
  
  // Design terms
  'design': ['UX', 'UI', 'user experience', 'creative', 'visual'],
  'ux': ['user experience', 'design', 'usability', 'interface'],
  'ui': ['user interface', 'design', 'frontend', 'visual'],
};

/**
 * Map keywords to related predefined interests
 */
const KEYWORD_TO_INTEREST = {
  'ai': 'AI & ML',
  'artificial intelligence': 'AI & ML',
  'machine learning': 'AI & ML',
  'ml': 'AI & ML',
  'deep learning': 'AI & ML',
  'neural': 'AI & ML',
  'llm': 'AI & ML',
  'chatgpt': 'AI & ML',
  'openai': 'AI & ML',
  
  'tech': 'Tech News',
  'technology': 'Tech News',
  'technologies': 'Tech News',
  'software': 'Tech News',
  'digital': 'Tech News',
  
  'startup': 'Startups',
  'startups': 'Startups',
  'venture': 'Startups',
  'funding': 'Startups',
  'entrepreneur': 'Startups',
  
  'security': 'Security',
  'cyber': 'Security',
  'hack': 'Security',
  'breach': 'Security',
  
  'finance': 'Fintech',
  'fintech': 'Fintech',
  'banking': 'Fintech',
  'payment': 'Fintech',
  
  'stock': 'Markets',
  'market': 'Markets',
  'trading': 'Markets',
  'investing': 'Markets',
  'investment': 'Markets',
  
  'biotech': 'Biotech',
  'pharma': 'Biotech',
  'drug': 'Biotech',
  'medical': 'Biotech',
  'healthcare': 'Biotech',
  
  'science': 'Science',
  'research': 'Science',
  'space': 'Science',
  'climate': 'Science',
  'nasa': 'Science',
  
  'politics': 'Politics',
  'government': 'Politics',
  'election': 'Politics',
  'policy': 'Politics',
  
  'gaming': 'Gaming',
  'game': 'Gaming',
  'games': 'Gaming',
  'esports': 'Gaming',
  'playstation': 'Gaming',
  'xbox': 'Gaming',
  'nintendo': 'Gaming',
  
  'crypto': 'Web3',
  'bitcoin': 'Web3',
  'ethereum': 'Web3',
  'blockchain': 'Web3',
  'nft': 'Web3',
  'web3': 'Web3',
  
  'design': 'Design',
  'ux': 'Design',
  'ui': 'Design',
};

/**
 * Extract meaningful keywords from a topic string
 * @param {string} topic - Raw topic string
 * @returns {string[]} Array of meaningful keywords
 */
export function extractKeywords(topic) {
  if (!topic) return [];
  
  // Normalize: lowercase, remove special chars except spaces
  const normalized = topic.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  
  // Split into words and filter
  const words = normalized.split(/\s+/).filter(word => {
    return word.length > 1 && !STOP_WORDS.has(word);
  });
  
  return [...new Set(words)]; // Remove duplicates
}

/**
 * Expand keywords with synonyms and related terms
 * @param {string[]} keywords - Array of keywords
 * @returns {string[]} Expanded array of keywords
 */
export function expandKeywords(keywords) {
  const expanded = new Set(keywords);
  
  for (const keyword of keywords) {
    const expansions = KEYWORD_EXPANSIONS[keyword];
    if (expansions) {
      expansions.forEach(term => expanded.add(term));
    }
  }
  
  return [...expanded];
}

/**
 * Find related predefined interests based on keywords
 * @param {string[]} keywords - Array of keywords
 * @returns {string[]} Array of related predefined interest names
 */
export function findRelatedInterests(keywords) {
  const relatedInterests = new Set();
  
  for (const keyword of keywords) {
    const interest = KEYWORD_TO_INTEREST[keyword];
    if (interest) {
      relatedInterests.add(interest);
    }
  }
  
  return [...relatedInterests];
}

/**
 * Fetch news from NewsAPI.org (primary)
 * @param {string} query - Search query
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} News articles
 */
async function fetchFromNewsAPI(query, options = {}) {
  const { apiKey, baseUrl } = config.newsApi.primary;
  
  // Calculate date range (default: last 7 days)
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);
  const from = fromDate.toISOString().split('T')[0];
  
  const params = new URLSearchParams({
    q: query,
    from: options.from || from,
    sortBy: options.sortBy || 'publishedAt',
    language: options.language || 'en',
    pageSize: options.pageSize || 20,
    apiKey,
  });
  
  const url = `${baseUrl}/everything?${params.toString()}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status !== 'ok') {
    throw new Error(data.message || 'NewsAPI request failed');
  }
  
  return {
    source: 'newsapi',
    articles: data.articles.map(article => ({
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: new Date(article.publishedAt),
      source: {
        id: article.source?.id || null,
        name: article.source?.name || 'Unknown',
      },
      author: article.author,
    })),
    totalResults: data.totalResults,
  };
}

/**
 * Fetch news from GNews.io (fallback)
 * @param {string} query - Search query
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} News articles
 */
async function fetchFromGNews(query, options = {}) {
  const { apiKey, baseUrl } = config.newsApi.fallback;
  
  if (!apiKey) {
    throw new Error('GNews API key not configured');
  }
  
  const params = new URLSearchParams({
    q: query,
    lang: options.language || 'en',
    country: options.country || 'us',
    max: options.pageSize || 20,
    token: apiKey,
  });
  
  const url = `${baseUrl}/search?${params.toString()}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.errors) {
    throw new Error(data.errors[0] || 'GNews request failed');
  }
  
  return {
    source: 'gnews',
    articles: data.articles.map(article => ({
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url,
      urlToImage: article.image,
      publishedAt: new Date(article.publishedAt),
      source: {
        id: null,
        name: article.source?.name || 'Unknown',
      },
      author: null,
    })),
    totalResults: data.totalArticles,
  };
}

/**
 * Fetch news with automatic fallback
 * Tries NewsAPI.org first, falls back to GNews.io on error
 * @param {string} query - Search query
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} News articles
 */
export async function fetchNews(query, options = {}) {
  try {
    // Try primary source (NewsAPI.org)
    return await fetchFromNewsAPI(query, options);
  } catch (primaryError) {
    console.warn(`NewsAPI.org failed: ${primaryError.message}, trying GNews.io fallback...`);
    
    try {
      // Try fallback source (GNews.io)
      return await fetchFromGNews(query, options);
    } catch (fallbackError) {
      console.error(`Both news sources failed. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
      throw new Error(`Failed to fetch news: ${primaryError.message}`);
    }
  }
}

/**
 * More precise keyword patterns for matching articles to interests
 * Uses word boundaries to prevent false matches
 */
export const INTEREST_MATCH_PATTERNS = {
  'AI & ML': /\b(artificial intelligence|machine learning|deep learning|neural network|chatgpt|gpt-4|llm|large language model|openai|anthropic|ai model|ai system|generative ai)\b/i,
  'Startups': /\b(startup|start-up|venture capital|vc funding|seed round|series [a-e]|entrepreneurship|founder|unicorn company|accelerator|incubator)\b/i,
  'Security': /\b(cybersecurity|cyber security|data breach|hacking|ransomware|malware|vulnerability|zero-day|infosec|threat actor|security flaw|cyber attack|phishing)\b/i,
  'Tech News': /\b(technology|software|tech industry|silicon valley|big tech|apple|google|microsoft|amazon|meta|tech company)\b/i,
  'Fintech': /\b(fintech|digital banking|neobank|payment platform|cryptocurrency exchange|digital wallet|mobile payment|stripe|paypal|square|financial technology)\b/i,
  'Biotech': /\b(biotech|biotechnology|pharmaceutical|pharma|drug development|clinical trial|fda approval|gene therapy|crispr|medical research|biopharmaceutical)\b/i,
  'Design': /\b(design|ux design|ui design|user experience|user interface|figma|sketch|product design|web design|graphic design|designer)\b/i,
  'Markets': /\b(stock market|investing|trading|nasdaq|dow jones|s&p 500|wall street|equity|bond market|stock price|market rally|bull market|bear market)\b/i,
  'Politics': /\b(politics|political|government|congress|senate|election|policy|legislation|democrat|republican|white house|parliament|political party)\b/i,
  'Science': /\b(science|scientific|research|discovery|nasa|space exploration|climate change|physics|biology|chemistry|scientist|laboratory)\b/i,
  'Gaming': /\b(gaming|video game|esports|playstation|xbox|nintendo|steam|game developer|gamer|twitch|game release)\b/i,
  'Web3': /\b(cryptocurrency|crypto|blockchain|bitcoin|ethereum|nft|defi|decentralized|web3|smart contract|token|dao)\b/i,
};

/**
 * Match an article to interests using regex patterns for better accuracy
 * @param {Object} article - Article object with title and description
 * @param {string[]} interests - Array of interests to match against (predefined or custom)
 * @returns {string[]} Array of matched interest names
 */
export function matchArticleToInterests(article, interests) {
  const articleText = `${article.title || ''} ${article.description || ''} ${article.content || ''}`;
  
  return interests.filter(interest => {
    // Use predefined pattern if available
    const pattern = INTEREST_MATCH_PATTERNS[interest];
    if (pattern) {
      return pattern.test(articleText);
    }
    
    // For custom topics, use the improved pattern builder
    const customPattern = buildCustomTopicPattern(interest);
    return customPattern.test(articleText);
  });
}

/**
 * Fetch news for multiple interests and combine results
 * GUARANTEED to return articles - uses multi-level fallback
 * @param {string[]} interests - Array of user interests
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Combined news articles
 */
export async function fetchNewsForInterests(interests, options = {}) {
  if (!interests || interests.length === 0) {
    // Fallback to general tech news if no interests provided
    console.log('[Fallback] No interests provided, fetching general tech news');
    return fetchNewsForCustomTopic('technology', options);
  }
  
  // Convert interests to search keywords
  const keywords = interests.map(interest => {
    return INTEREST_KEYWORDS[interest] || buildSearchKeywords(interest);
  });
  
  // Combine keywords with OR for a single query
  const combinedQuery = keywords.join(' OR ');
  
  let result;
  let fallbackLevel = 0;
  let fallbackSource = null;
  
  try {
    result = await fetchNews(combinedQuery, {
      ...options,
      pageSize: options.pageSize || Math.min(interests.length * 10, 100),
    });
    
    // Level 1: If no results, try interests one by one
    if (result.articles.length === 0) {
      fallbackLevel = 1;
      fallbackSource = 'individual_interests';
      console.log('[Fallback L1] Combined query returned no results, trying individual interests');
      
      for (const interest of interests) {
        const singleKeyword = INTEREST_KEYWORDS[interest] || interest;
        try {
          const singleResult = await fetchNews(singleKeyword, {
            ...options,
            pageSize: 10,
          });
          if (singleResult.articles.length > 0) {
            result.articles.push(...singleResult.articles);
          }
        } catch {
          // Continue to next interest
        }
        
        // Stop if we have enough articles
        if (result.articles.length >= 10) break;
      }
    }
    
    // Level 2: If still no results, try broader tech terms
    if (result.articles.length === 0) {
      fallbackLevel = 2;
      fallbackSource = 'broad_tech';
      console.log('[Fallback L2] Trying broad technology search');
      
      result = await fetchNews('technology OR innovation OR business OR science', {
        ...options,
        pageSize: options.pageSize || 20,
      });
    }
    
    // Level 3: Top headlines as last resort
    if (result.articles.length === 0) {
      fallbackLevel = 3;
      fallbackSource = 'top_headlines';
      console.log('[Fallback L3] Fetching top headlines');
      
      result = await fetchTopHeadlines('technology', options);
    }
    
    // Tag articles with matched interests using improved pattern matching
    const taggedArticles = result.articles.map(article => {
      const matchedInterests = matchArticleToInterests(article, interests);
      
      return {
        ...article,
        matchedInterests: matchedInterests.length > 0 ? matchedInterests : interests.slice(0, 1),
        tags: matchedInterests.length > 0 ? matchedInterests : ['Related'],
        isFallbackResult: fallbackLevel > 0 || matchedInterests.length === 0,
        fallbackLevel,
      };
    });
    
    return {
      ...result,
      articles: taggedArticles,
      interests,
      fallbackLevel,
      fallbackSource,
      hasDirectMatches: taggedArticles.some(a => a.matchedInterests && a.matchedInterests.length > 0),
    };
  } catch (error) {
    // Emergency fallback
    console.error(`[Emergency Fallback] Interest search failed: ${error.message}`);
    
    try {
      const emergencyResult = await fetchTopHeadlines('general', { pageSize: 10 });
      return {
        ...emergencyResult,
        articles: emergencyResult.articles.map(a => ({
          ...a,
          tags: ['General News'],
          matchedInterests: [],
          isFallbackResult: true,
          fallbackLevel: 4,
        })),
        interests,
        fallbackLevel: 4,
        fallbackSource: 'emergency_headlines',
      };
    } catch {
      throw error;
    }
  }
}

/**
 * Get top headlines by category
 * @param {string} category - News category
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} News articles
 */
export async function fetchTopHeadlines(category = 'technology', options = {}) {
  const { apiKey, baseUrl } = config.newsApi.primary;
  
  const params = new URLSearchParams({
    category,
    language: options.language || 'en',
    country: options.country || 'us',
    pageSize: options.pageSize || 20,
    apiKey,
  });
  
  const url = `${baseUrl}/top-headlines?${params.toString()}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'ok') {
      throw new Error(data.message || 'NewsAPI headlines request failed');
    }
    
    return {
      source: 'newsapi',
      articles: data.articles.map(article => ({
        title: article.title,
        description: article.description,
        content: article.content,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: new Date(article.publishedAt),
        source: {
          id: article.source?.id || null,
          name: article.source?.name || 'Unknown',
        },
        author: article.author,
        category,
      })),
      totalResults: data.totalResults,
    };
  } catch (error) {
    console.error('Top headlines fetch failed:', error.message);
    throw error;
  }
}

/**
 * Check if a topic is a predefined interest or a custom topic
 * @param {string} topic - Topic to check
 * @returns {boolean} True if custom topic
 */
export function isCustomTopic(topic) {
  return !INTEREST_KEYWORDS.hasOwnProperty(topic);
}

/**
 * Build search keywords for a topic (predefined or custom)
 * Uses keyword extraction, expansion, and related interest fallback
 * @param {string} topic - Topic name
 * @returns {string} Search keywords
 */
export function buildSearchKeywords(topic) {
  // Use predefined keywords if available
  if (INTEREST_KEYWORDS[topic]) {
    return INTEREST_KEYWORDS[topic];
  }
  
  // For custom topics, use smart keyword extraction and expansion
  const trimmedTopic = topic.trim();
  
  // Extract meaningful keywords
  const keywords = extractKeywords(trimmedTopic);
  
  if (keywords.length === 0) {
    // No meaningful keywords, use the original topic
    return trimmedTopic;
  }
  
  // Expand keywords with synonyms
  const expandedKeywords = expandKeywords(keywords);
  
  // Find related predefined interests
  const relatedInterests = findRelatedInterests(keywords);
  
  // Build search query
  const searchTerms = new Set();
  
  // Add expanded keywords
  expandedKeywords.forEach(term => searchTerms.add(term));
  
  // Add keywords from related predefined interests for broader coverage
  relatedInterests.forEach(interest => {
    const interestKeywords = INTEREST_KEYWORDS[interest];
    if (interestKeywords) {
      // Extract just a few key terms from the interest, not the full OR query
      const keyTerms = interestKeywords.split(' OR ').slice(0, 3);
      keyTerms.forEach(term => searchTerms.add(term.trim()));
    }
  });
  
  // Build final query with OR joins
  const finalTerms = [...searchTerms].map(term => {
    // Wrap multi-word terms in quotes
    return term.includes(' ') ? `"${term}"` : term;
  });
  
  return finalTerms.join(' OR ');
}

/**
 * Create a regex pattern for matching custom topics in article text
 * @param {string} topic - Custom topic name
 * @returns {RegExp} Regex pattern for matching
 */
export function buildCustomTopicPattern(topic) {
  const trimmedTopic = topic.trim();
  
  if (trimmedTopic.includes(' ')) {
    // Multi-word: match the full phrase or significant individual words
    const words = trimmedTopic.split(/\s+/).filter(w => w.length > 2);
    const escapedPhrase = trimmedTopic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedWords = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    
    // Match full phrase OR at least 2 significant words appearing
    const pattern = `(${escapedPhrase}|(?=.*\\b${escapedWords.join('\\b)(?=.*\\b')}\\b))`;
    return new RegExp(pattern, 'i');
  }
  
  // Single word: simple word boundary match
  const escapedTopic = trimmedTopic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escapedTopic}\\b`, 'i');
}

/**
 * Fetch news for a single custom topic
 * Uses smart keyword extraction, expansion, and fallback to related interests
 * GUARANTEED to return articles - uses multi-level fallback
 * @param {string} topic - Custom topic keyword(s)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} News articles tagged with the custom topic
 */
export async function fetchNewsForCustomTopic(topic, options = {}) {
  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    throw new Error('A valid topic string is required');
  }
  
  const trimmedTopic = topic.trim();
  const keywords = extractKeywords(trimmedTopic);
  const relatedInterests = findRelatedInterests(keywords);
  const searchKeywords = buildSearchKeywords(trimmedTopic);
  
  let result;
  let fallbackLevel = 0;
  let fallbackSource = null;
  
  try {
    // Level 0: Try the smart search keywords
    result = await fetchNews(searchKeywords, {
      ...options,
      pageSize: options.pageSize || 20,
    });
    
    // Level 1: If no results, try with expanded keywords only
    if (result.articles.length === 0 && keywords.length > 0) {
      fallbackLevel = 1;
      fallbackSource = 'expanded_keywords';
      console.log(`[Fallback L1] No results for "${trimmedTopic}", trying expanded keywords`);
      
      const expandedKeywords = expandKeywords(keywords);
      const simpleQuery = expandedKeywords.slice(0, 5).join(' OR ');
      
      result = await fetchNews(simpleQuery, {
        ...options,
        pageSize: options.pageSize || 20,
      });
    }
    
    // Level 2: If still no results, try related interests
    if (result.articles.length === 0 && relatedInterests.length > 0) {
      fallbackLevel = 2;
      fallbackSource = 'related_interests';
      console.log(`[Fallback L2] Trying related interests: ${relatedInterests.join(', ')}`);
      
      const fallbackKeywords = relatedInterests
        .map(interest => INTEREST_KEYWORDS[interest])
        .join(' OR ');
      
      result = await fetchNews(fallbackKeywords, {
        ...options,
        pageSize: options.pageSize || 20,
      });
    }
    
    // Level 3: If still no results, try general tech news
    if (result.articles.length === 0) {
      fallbackLevel = 3;
      fallbackSource = 'general_tech';
      console.log(`[Fallback L3] Trying general tech news`);
      
      result = await fetchNews('technology OR innovation OR digital', {
        ...options,
        pageSize: options.pageSize || 20,
      });
    }
    
    // Level 4: Last resort - top headlines
    if (result.articles.length === 0) {
      fallbackLevel = 4;
      fallbackSource = 'top_headlines';
      console.log(`[Fallback L4] Fetching top headlines as last resort`);
      
      try {
        result = await fetchTopHeadlines('technology', options);
      } catch {
        // If headlines fail, try general news
        result = await fetchNews('news today', {
          ...options,
          pageSize: options.pageSize || 20,
        });
      }
    }
    
    // Create patterns for matching
    const expandedKeywords = expandKeywords(keywords);
    
    // Tag articles based on keyword matches
    const taggedArticles = result.articles.map(article => {
      const articleText = `${article.title || ''} ${article.description || ''} ${article.content || ''}`.toLowerCase();
      
      // Check if any expanded keyword appears in the article
      const matchedKeywords = expandedKeywords.filter(kw => 
        articleText.includes(kw.toLowerCase())
      );
      
      // Calculate relevance score based on keyword matches
      const relevanceScore = matchedKeywords.length / Math.max(expandedKeywords.length, 1);
      
      // Determine if this is a direct match or fallback result
      const isDirectMatch = matchedKeywords.length > 0;
      
      return {
        ...article,
        matchedInterests: isDirectMatch ? [trimmedTopic] : relatedInterests,
        tags: isDirectMatch ? [trimmedTopic, ...relatedInterests] : relatedInterests.length > 0 ? relatedInterests : ['General'],
        isCustomTopic: isCustomTopic(trimmedTopic),
        matchedKeywords,
        relevanceScore,
        relatedInterests,
        isFallbackResult: fallbackLevel > 0,
        fallbackLevel,
      };
    });
    
    // Sort by relevance score (highest first)
    taggedArticles.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return {
      ...result,
      articles: taggedArticles,
      topic: trimmedTopic,
      isCustomTopic: isCustomTopic(trimmedTopic),
      searchKeywords,
      extractedKeywords: keywords,
      expandedKeywords,
      relatedInterests,
      fallbackLevel,
      fallbackSource,
      hasDirectMatches: taggedArticles.some(a => a.relevanceScore > 0),
    };
  } catch (error) {
    // Emergency fallback: try to get ANY news
    console.error(`[Emergency Fallback] All searches failed for "${trimmedTopic}": ${error.message}`);
    
    try {
      const emergencyResult = await fetchTopHeadlines('general', { pageSize: 10 });
      return {
        ...emergencyResult,
        articles: emergencyResult.articles.map(a => ({
          ...a,
          tags: ['General News'],
          isFallbackResult: true,
          fallbackLevel: 5,
          relevanceScore: 0,
        })),
        topic: trimmedTopic,
        fallbackLevel: 5,
        fallbackSource: 'emergency_headlines',
        error: error.message,
      };
    } catch (emergencyError) {
      throw error; // If even emergency fails, throw original error
    }
  }
}

/**
 * Fetch news for mixed interests (predefined + custom topics)
 * GUARANTEED to return articles - uses multi-level fallback
 * @param {string[]} interests - Array of predefined interests
 * @param {string[]} customTopics - Array of custom topic strings
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Combined news articles
 */
export async function fetchNewsForMixedTopics(interests = [], customTopics = [], options = {}) {
  const allTopics = [...interests, ...customTopics].filter(t => t && t.trim());
  
  if (allTopics.length === 0) {
    // Fallback to general news if no topics provided
    console.log('[Fallback] No topics provided, fetching general news');
    return fetchNewsForCustomTopic('technology news', options);
  }
  
  // Build keywords for all topics
  const keywords = allTopics.map(topic => buildSearchKeywords(topic));
  const combinedQuery = keywords.join(' OR ');
  
  let result;
  let fallbackLevel = 0;
  let fallbackSource = null;
  
  try {
    result = await fetchNews(combinedQuery, {
      ...options,
      pageSize: options.pageSize || Math.min(allTopics.length * 10, 100),
    });
    
    // Level 1: If no results, try predefined interests only
    if (result.articles.length === 0 && interests.length > 0) {
      fallbackLevel = 1;
      fallbackSource = 'predefined_only';
      console.log('[Fallback L1] Trying predefined interests only');
      
      const interestKeywords = interests
        .filter(i => INTEREST_KEYWORDS[i])
        .map(i => INTEREST_KEYWORDS[i])
        .join(' OR ');
      
      if (interestKeywords) {
        result = await fetchNews(interestKeywords, {
          ...options,
          pageSize: options.pageSize || 20,
        });
      }
    }
    
    // Level 2: Broader search
    if (result.articles.length === 0) {
      fallbackLevel = 2;
      fallbackSource = 'broad_search';
      console.log('[Fallback L2] Trying broad search');
      
      result = await fetchNews('technology OR business OR science OR innovation', {
        ...options,
        pageSize: options.pageSize || 20,
      });
    }
    
    // Level 3: Top headlines
    if (result.articles.length === 0) {
      fallbackLevel = 3;
      fallbackSource = 'top_headlines';
      console.log('[Fallback L3] Fetching top headlines');
      
      result = await fetchTopHeadlines('technology', options);
    }
    
    // Tag articles with matched topics (both predefined and custom)
    const taggedArticles = result.articles.map(article => {
      const articleText = `${article.title || ''} ${article.description || ''} ${article.content || ''}`;
      const matchedTopics = [];
      
      for (const topic of allTopics) {
        const pattern = INTEREST_MATCH_PATTERNS[topic] || buildCustomTopicPattern(topic);
        if (pattern.test(articleText)) {
          matchedTopics.push(topic);
        }
      }
      
      return {
        ...article,
        matchedInterests: matchedTopics.length > 0 ? matchedTopics : allTopics.slice(0, 1),
        tags: matchedTopics.length > 0 ? matchedTopics : ['Related'],
        customTopics: matchedTopics.filter(t => isCustomTopic(t)),
        predefinedInterests: matchedTopics.filter(t => !isCustomTopic(t)),
        isFallbackResult: fallbackLevel > 0 || matchedTopics.length === 0,
        fallbackLevel,
      };
    });
    
    return {
      ...result,
      articles: taggedArticles,
      interests,
      customTopics,
      allTopics,
      fallbackLevel,
      fallbackSource,
      hasDirectMatches: taggedArticles.some(a => !a.isFallbackResult),
    };
  } catch (error) {
    // Emergency fallback
    console.error(`[Emergency Fallback] Mixed topics search failed: ${error.message}`);
    
    try {
      const emergencyResult = await fetchTopHeadlines('general', { pageSize: 10 });
      return {
        ...emergencyResult,
        articles: emergencyResult.articles.map(a => ({
          ...a,
          tags: ['General News'],
          matchedInterests: [],
          isFallbackResult: true,
          fallbackLevel: 4,
        })),
        interests,
        customTopics,
        allTopics,
        fallbackLevel: 4,
        fallbackSource: 'emergency_headlines',
      };
    } catch {
      throw error;
    }
  }
}
