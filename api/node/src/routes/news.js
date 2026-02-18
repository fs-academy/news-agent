/**
 * News API Routes
 * Endpoints for fetching news from external News APIs
 */

import { ObjectId } from 'mongodb';
import { fetchNews, fetchNewsForInterests, fetchNewsForCustomTopic, fetchTopHeadlines, INTEREST_KEYWORDS, matchArticleToInterests } from '../services/newsapi.js';

export default async function newsRoutes(fastify) {
  /**
   * Discover news based on user's interests
   * GET /api/news/discover
   * Uses smart fallback system - GUARANTEED to return articles
   */
  fastify.get('/discover', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      },
    },
  }, async (request, reply) => {
    const userId = new ObjectId(request.user.id);
    const { limit = 20 } = request.query;

    try {
      // Get user profile for interests
      const user = await fastify.collections.users.findOne({ _id: userId });
      if (!user) {
        return reply.notFound('User not found');
      }

      const interests = user.interests || [];
      
      // Even if no interests, still return general tech news
      let result;
      if (interests.length === 0) {
        // Fetch general tech news instead of returning empty
        result = await fetchNewsForCustomTopic('technology innovation', { pageSize: limit });
        result.needsInterests = true;
      } else {
        // Fetch news for user's interests (with built-in fallback)
        result = await fetchNewsForInterests(interests, { pageSize: limit });
      }

      // Store articles in database for caching and ranking
      // Use upsert with url as unique key, silently skip duplicates
      if (result.articles.length > 0) {
        const bulkOps = result.articles.map(article => ({
          updateOne: {
            filter: { url: article.url },
            update: {
              $setOnInsert: {
                _id: new ObjectId(),
                title: article.title,
                description: article.description,
                content: article.content,
                url: article.url,
                urlToImage: article.urlToImage,
                publishedAt: article.publishedAt,
                source: article.source,
                author: article.author,
                ranking: null,
              },
              $set: {
                fetchedAt: new Date(),
                tags: article.tags || [],
                isFallbackResult: article.isFallbackResult || false,
              },
              $addToSet: {
                userIds: userId,
                matchedInterests: { $each: article.matchedInterests || [] },
              },
            },
            upsert: true,
          },
        }));
        try {
          await fastify.collections.articles.bulkWrite(bulkOps, { ordered: false });
        } catch (bulkError) {
          // Log duplicate key errors at debug level, they're expected
          if (bulkError.code === 11000) {
            fastify.log.debug('Some articles already exist, skipped duplicates');
          } else {
            throw bulkError;
          }
        }
      }

      // Fetch stored articles from database (with proper _id) for the user
      const storedArticles = await fastify.collections.articles
        .find({ userIds: userId })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .toArray();

      // If stored articles are empty but result has articles, return result directly
      const finalArticles = storedArticles.length > 0 ? storedArticles : result.articles.slice(0, limit);

      return {
        success: true,
        data: finalArticles,
        source: result.source,
        totalResults: result.totalResults,
        interests,
        needsInterests: result.needsInterests || false,
        fallbackLevel: result.fallbackLevel,
        fallbackSource: result.fallbackSource,
        hasDirectMatches: result.hasDirectMatches,
        message: result.needsInterests ? 'Showing general tech news. Set your interests for personalized content.' : undefined,
      };
    } catch (error) {
      fastify.log.error('News discovery failed:', error);
      
      // Try to return cached articles on error
      try {
        const cachedArticles = await fastify.collections.articles
          .find({ userIds: userId })
          .sort({ publishedAt: -1 })
          .limit(limit)
          .toArray();
        
        if (cachedArticles.length > 0) {
          return {
            success: true,
            data: cachedArticles,
            source: 'cache',
            isCached: true,
            fallbackLevel: 6,
            fallbackSource: 'database_cache',
          };
        }
        
        // If no cached articles for user, get any recent articles
        const anyArticles = await fastify.collections.articles
          .find({})
          .sort({ publishedAt: -1 })
          .limit(limit)
          .toArray();
        
        if (anyArticles.length > 0) {
          return {
            success: true,
            data: anyArticles,
            source: 'cache',
            isCached: true,
            fallbackLevel: 7,
            fallbackSource: 'global_cache',
          };
        }
      } catch (cacheError) {
        fastify.log.error('Cache fallback also failed:', cacheError);
      }
      
      return reply.internalServerError(`Failed to fetch news: ${error.message}`);
    }
  });

  /**
   * Search news by keyword
   * GET /api/news/search
   */
  fastify.get('/search', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', minLength: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          from: { type: 'string', format: 'date' },
          sortBy: { type: 'string', enum: ['publishedAt', 'relevancy', 'popularity'], default: 'publishedAt' },
        },
      },
    },
  }, async (request, reply) => {
    const { q, limit = 20, from, sortBy = 'publishedAt' } = request.query;

    try {
      const result = await fetchNews(q, { pageSize: limit, from, sortBy });

      return {
        success: true,
        data: result.articles,
        source: result.source,
        totalResults: result.totalResults,
        query: q,
      };
    } catch (error) {
      fastify.log.error('News search failed:', error);
      return reply.internalServerError(`Failed to search news: ${error.message}`);
    }
  });

  /**
   * Get top headlines
   * GET /api/news/headlines
   */
  fastify.get('/headlines', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          category: { 
            type: 'string', 
            enum: ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'],
            default: 'technology' 
          },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          country: { type: 'string', default: 'us' },
        },
      },
    },
  }, async (request, reply) => {
    const { category = 'technology', limit = 20, country = 'us' } = request.query;

    try {
      const result = await fetchTopHeadlines(category, { pageSize: limit, country });

      return {
        success: true,
        data: result.articles,
        source: result.source,
        totalResults: result.totalResults,
        category,
      };
    } catch (error) {
      fastify.log.error('Headlines fetch failed:', error);
      return reply.internalServerError(`Failed to fetch headlines: ${error.message}`);
    }
  });

  /**
   * Get news for a specific interest/topic
   * GET /api/news/topic/:topic
   * Uses smart fallback system - GUARANTEED to return articles
   */
  fastify.get('/topic/:topic', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['topic'],
        properties: {
          topic: { type: 'string' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      },
    },
  }, async (request, reply) => {
    const userId = new ObjectId(request.user.id);
    const { topic } = request.params;
    const { limit = 20 } = request.query;

    try {
      // Use the new fetchNewsForCustomTopic with built-in fallback system
      // This GUARANTEES articles will be returned
      const result = await fetchNewsForCustomTopic(topic, { pageSize: limit });

      // Store articles in database
      if (result.articles.length > 0) {
        const bulkOps = result.articles.map(article => ({
          updateOne: {
            filter: { url: article.url },
            update: {
              $setOnInsert: {
                _id: new ObjectId(),
                title: article.title,
                description: article.description,
                content: article.content,
                url: article.url,
                urlToImage: article.urlToImage,
                publishedAt: article.publishedAt,
                source: article.source,
                author: article.author,
                ranking: null,
              },
              $set: {
                fetchedAt: new Date(),
                tags: article.tags || [topic],
                isFallbackResult: article.isFallbackResult || false,
                relevanceScore: article.relevanceScore || 0,
              },
              $addToSet: {
                userIds: userId,
                matchedInterests: { $each: article.matchedInterests || [topic] },
              },
            },
            upsert: true,
          },
        }));
        try {
          await fastify.collections.articles.bulkWrite(bulkOps, { ordered: false });
        } catch (bulkError) {
          if (bulkError.code === 11000) {
            fastify.log.debug('Some articles already exist, skipped duplicates');
          } else {
            throw bulkError;
          }
        }
      }

      // Return the articles directly from the API result (already sorted by relevance)
      return {
        success: true,
        data: result.articles.slice(0, limit),
        source: result.source,
        totalResults: result.totalResults,
        topic,
        fallbackLevel: result.fallbackLevel,
        fallbackSource: result.fallbackSource,
        hasDirectMatches: result.hasDirectMatches,
        relatedInterests: result.relatedInterests,
      };
    } catch (error) {
      fastify.log.error('Topic news fetch failed:', error);
      
      // Last resort: try to return cached articles from database
      try {
        const cachedArticles = await fastify.collections.articles
          .find({ 
            $or: [
              { matchedInterests: topic },
              { tags: topic },
              { tags: 'General' },
            ]
          })
          .sort({ publishedAt: -1 })
          .limit(limit)
          .toArray();
        
        if (cachedArticles.length > 0) {
          return {
            success: true,
            data: cachedArticles,
            source: 'cache',
            totalResults: cachedArticles.length,
            topic,
            fallbackLevel: 6,
            fallbackSource: 'database_cache',
            isCached: true,
          };
        }
      } catch (cacheError) {
        fastify.log.error('Cache fallback also failed:', cacheError);
      }
      
      return reply.internalServerError(`Failed to fetch news for topic: ${error.message}`);
    }
  });

  /**
   * Get cached/stored articles for user with optional AI ranking
   * GET /api/news/user
   */
  fastify.get('/user', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          skip: { type: 'integer', minimum: 0, default: 0 },
          ranked: { type: 'boolean', default: false },
        },
      },
    },
  }, async (request, reply) => {
    const userId = new ObjectId(request.user.id);
    const { limit = 20, skip = 0, ranked = false } = request.query;

    try {
      // Get user's stored articles
      const sortField = ranked ? { 'ranking.score': -1, publishedAt: -1 } : { publishedAt: -1 };
      
      const articles = await fastify.collections.articles
        .find({ userIds: userId })
        .sort(sortField)
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .toArray();

      const total = await fastify.collections.articles.countDocuments({ userIds: userId });

      return {
        success: true,
        data: articles,
        total,
        hasMore: skip + articles.length < total,
      };
    } catch (error) {
      fastify.log.error('User articles fetch failed:', error);
      return reply.internalServerError(`Failed to fetch user articles: ${error.message}`);
    }
  });

  /**
   * Refresh news - fetch fresh articles from News API
   * POST /api/news/refresh
   */
  fastify.post('/refresh', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const userId = new ObjectId(request.user.id);

    try {
      // Get user profile for interests
      const user = await fastify.collections.users.findOne({ _id: userId });
      if (!user) {
        return reply.notFound('User not found');
      }

      const interests = user.interests || [];
      if (interests.length === 0) {
        return {
          success: false,
          message: 'Please set your interests first',
        };
      }

      // Fetch fresh news for user's interests
      const result = await fetchNewsForInterests(interests, { pageSize: 50 });

      // Store articles in database
      // Use upsert with url as unique key, silently skip duplicates
      if (result.articles.length > 0) {
        const bulkOps = result.articles.map(article => ({
          updateOne: {
            filter: { url: article.url },
            update: {
              $setOnInsert: {
                _id: new ObjectId(),
                title: article.title,
                description: article.description,
                content: article.content,
                url: article.url,
                urlToImage: article.urlToImage,
                publishedAt: article.publishedAt,
                source: article.source,
                author: article.author,
                tags: article.tags || [],
                ranking: null,
              },
              $set: {
                fetchedAt: new Date(),
              },
              $addToSet: {
                userIds: userId,
                matchedInterests: { $each: article.matchedInterests || [] },
              },
            },
            upsert: true,
          },
        }));
        try {
          await fastify.collections.articles.bulkWrite(bulkOps, { ordered: false });
        } catch (bulkError) {
          if (bulkError.code === 11000) {
            fastify.log.debug('Some articles already exist, skipped duplicates');
          } else {
            throw bulkError;
          }
        }
      }

      return {
        success: true,
        message: `Refreshed ${result.articles.length} articles`,
        articlesCount: result.articles.length,
        source: result.source,
      };
    } catch (error) {
      fastify.log.error('News refresh failed:', error);
      return reply.internalServerError(`Failed to refresh news: ${error.message}`);
    }
  });

  /**
   * Store an external article in the database
   * POST /api/news/store-article
   * Used when users want to save/favourite/summarize articles from search results
   */
  fastify.post('/store-article', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['url', 'title'],
        properties: {
          url: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          content: { type: 'string' },
          urlToImage: { type: 'string' },
          publishedAt: { type: 'string' },
          source: { 
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' }
            }
          },
          author: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const userId = new ObjectId(request.user.id);
    const { url, title, description, content, urlToImage, publishedAt, source, author } = request.body;

    // Validate article data
    if (!url || url.trim().length === 0) {
      return reply.badRequest('Article URL is required');
    }
    if (!title || title.trim().length === 0) {
      return reply.badRequest('Article title is required');
    }

    try {
      // Check if article already exists by URL
      let article = await fastify.collections.articles.findOne({ url });
      
      if (article) {
        // Article exists, add user to userIds if not already there
        await fastify.collections.articles.updateOne(
          { _id: article._id },
          { $addToSet: { userIds: userId } }
        );
        fastify.log.info(`Article ${article._id} already exists, added user ${userId}`);
        return {
          success: true,
          data: {
            _id: article._id.toString(),
            isNew: false
          }
        };
      }

      // Create new article
      const newArticle = {
        _id: new ObjectId(),
        title: title.trim(),
        description: (description || '').trim(),
        content: ((content || description || '')).trim(),
        url,
        urlToImage: urlToImage || null,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        source: source || { name: 'Unknown' },
        author: author || null,
        tags: [],
        matchedInterests: [],
        userIds: [userId],
        fetchedAt: new Date(),
        ranking: null
      };

      await fastify.collections.articles.insertOne(newArticle);
      fastify.log.info(`Stored new article ${newArticle._id} for user ${userId}`);

      return {
        success: true,
        data: {
          _id: newArticle._id.toString(),
          isNew: true
        }
      };
    } catch (error) {
      fastify.log.error('Failed to store article:', error);
      
      // Provide specific error messages based on error type
      if (error.code === 11000) { // Duplicate key error
        return reply.internalServerError('Article already exists with this URL');
      }
      
      return reply.internalServerError(`Failed to store article: ${error.message}`);
    }
  });

  /**
   * Get available interest categories
   * GET /api/news/categories
   */
  fastify.get('/categories', async () => {
    return {
      success: true,
      data: Object.keys(INTEREST_KEYWORDS),
    };
  });
}
