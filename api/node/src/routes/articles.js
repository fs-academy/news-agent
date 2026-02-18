import { ObjectId } from 'mongodb';
import { config } from '../config.js';
import { summarizeArticle } from '../services/huggingface.js';
import {
  articleQuerySchema,
  articleParamsSchema,
  rankArticlesBodySchema,
  articleResponseSchema,
  articleListResponseSchema
} from '../schemas/index.js';

export default async function articleRoutes(fastify) {
  fastify.get('/', {
    schema: {
      querystring: articleQuerySchema,
      response: { 200: articleListResponseSchema }
    }
  }, async (request) => {
    const { feedId, limit = 20, skip = 0, search } = request.query;

    const filter = {};
    if (feedId) filter.feedId = new ObjectId(feedId);
    if (search) filter.$text = { $search: search };

    const articles = await fastify.collections.articles
      .find(filter)
      .sort({ publishedAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .toArray();

    return { success: true, data: articles };
  });

  /**
   * Get articles for current user based on their feeds
   * This aggregates articles from all feeds the user has subscribed to
   */
  fastify.get('/user', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          skip: { type: 'integer', minimum: 0, default: 0 },
          category: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    const userId = new ObjectId(request.user.id);
    const { limit = 20, skip = 0, category } = request.query;

    // Get user's active feeds
    const feedFilter = { userId, 'health.status': { $ne: 'disabled' } };
    if (category && category !== 'all') {
      feedFilter.category = category;
    }
    const userFeeds = await fastify.collections.feeds.find(feedFilter).toArray();
    const feedIds = userFeeds.map(f => f._id);

    if (feedIds.length === 0) {
      return { success: true, data: [], totalFeeds: 0, message: 'No feeds subscribed' };
    }

    // Get articles from user's feeds
    const articles = await fastify.collections.articles
      .find({ feedId: { $in: feedIds } })
      .sort({ publishedAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .toArray();

    // Enrich articles with feed info
    const feedMap = new Map(userFeeds.map(f => [f._id.toString(), f]));
    const enrichedArticles = articles.map(article => ({
      ...article,
      feed: feedMap.get(article.feedId.toString()) || null
    }));

    return { 
      success: true, 
      data: enrichedArticles,
      totalFeeds: feedIds.length,
      categories: [...new Set(userFeeds.map(f => f.category))]
    };
  });

  /**
   * Get ranked articles for user based on their interests
   * Uses Python AI service for intelligent ranking
   */
  fastify.get('/user/ranked', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 }
        }
      }
    }
  }, async (request) => {
    const userId = new ObjectId(request.user.id);
    const { limit = 20 } = request.query;

    // Get user profile for interests
    const user = await fastify.collections.users.findOne({ _id: userId });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const interests = user.interests || [];
    if (interests.length === 0) {
      return { 
        success: true, 
        data: [], 
        needsInterests: true,
        message: 'Please set your interests to see personalized news' 
      };
    }

    // Get user's feeds
    const userFeeds = await fastify.collections.feeds.find({ 
      userId, 
      'health.status': { $ne: 'disabled' } 
    }).toArray();
    const feedIds = userFeeds.map(f => f._id);

    if (feedIds.length === 0) {
      return { 
        success: true, 
        data: [], 
        needsFeeds: true,
        message: 'No feeds found. Add feeds based on your interests.' 
      };
    }

    // Get recent articles from user's feeds
    const articles = await fastify.collections.articles
      .find({ feedId: { $in: feedIds } })
      .sort({ publishedAt: -1 })
      .limit(50) // Get more articles for ranking
      .toArray();

    if (articles.length === 0) {
      return { 
        success: true, 
        data: [], 
        message: 'No articles yet. Try refreshing your feeds.' 
      };
    }

    // Create ranking query from user interests
    const rankingQuery = interests.join(', ');

    try {
      // Call Python AI service for ranking
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(`${config.aiServiceUrl}/api/ai/rank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: rankingQuery, 
          articles: articles.map(a => ({
            id: a._id.toString(),
            title: a.title,
            content: a.content?.substring(0, 500) || ''
          }))
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`AI service responded with ${response.status}`);
      }

      const rankedIds = await response.json();
      
      // Reorder articles based on AI ranking
      const articleMap = new Map(articles.map(a => [a._id.toString(), a]));
      const feedMap = new Map(userFeeds.map(f => [f._id.toString(), f]));
      
      let rankedArticles;
      if (Array.isArray(rankedIds)) {
        rankedArticles = rankedIds
          .map(id => articleMap.get(id))
          .filter(Boolean)
          .slice(0, limit);
      } else {
        // Fallback if response format is different
        rankedArticles = articles.slice(0, limit);
      }

      // Enrich with feed info and relevance score
      const enrichedArticles = rankedArticles.map((article, index) => ({
        ...article,
        feed: feedMap.get(article.feedId.toString()) || null,
        relevanceScore: Math.max(50, 100 - (index * 3)) // Decreasing score based on rank
      }));

      return { 
        success: true, 
        data: enrichedArticles,
        totalFeeds: feedIds.length,
        aiRanked: true
      };
    } catch (err) {
      // Graceful degradation: return chronologically sorted articles
      const feedMap = new Map(userFeeds.map(f => [f._id.toString(), f]));
      const fallbackArticles = articles.slice(0, limit).map(article => ({
        ...article,
        feed: feedMap.get(article.feedId.toString()) || null,
        relevanceScore: null
      }));

      return { 
        success: true, 
        data: fallbackArticles,
        totalFeeds: feedIds.length,
        aiRanked: false,
        fallback: true,
        fallbackReason: err.message
      };
    }
  });

  fastify.get('/:id', {
    schema: {
      params: articleParamsSchema,
      response: { 200: articleResponseSchema }
    }
  }, async (request, reply) => {
    const article = await fastify.collections.articles.findOne({ _id: new ObjectId(request.params.id) });
    if (!article) return reply.notFound('Article not found');
    return { success: true, data: article };
  });

  /**
   * Get AI-generated summary for an article
   * Proxies to Python AI service with graceful fallback
   */
  fastify.post('/:id/summarize', {
    preHandler: [fastify.authenticate],
    schema: {
      params: articleParamsSchema
    }
  }, async (request, reply) => {
    const article = await fastify.collections.articles.findOne({ 
      _id: new ObjectId(request.params.id) 
    });
    
    if (!article) {
      return reply.notFound('Article not found');
    }

    // Check if we already have a cached summary
    if (article.aiSummary && article.aiSummaryGeneratedAt) {
      const cacheAge = Date.now() - new Date(article.aiSummaryGeneratedAt).getTime();
      const ONE_DAY = 24 * 60 * 60 * 1000;
      if (cacheAge < ONE_DAY) {
        return { 
          success: true, 
          data: { 
            summary: article.aiSummary, 
            cached: true,
            generatedAt: article.aiSummaryGeneratedAt 
          } 
        };
      }
    }

    try {
      // Use Hugging Face summarization service (replaced Python/Ollama backend)
      const result = await summarizeArticle(
        article.content || '',
        article.title || '',
        { timeout: config.huggingface?.timeout || 15000 }
      );

      // Check for errors from the HF service
      if (result.error) {
        throw new Error(result.error);
      }

      const summary = result.summary || '';

      // Cache the summary
      if (summary) {
        await fastify.collections.articles.updateOne(
          { _id: article._id },
          { 
            $set: { 
              aiSummary: summary, 
              aiSummaryGeneratedAt: new Date() 
            } 
          }
        );
      }

      return { 
        success: true, 
        data: { 
          summary, 
          cached: false,
          generatedAt: new Date() 
        } 
      };
    } catch (err) {
      fastify.log.error('Summary generation error:', err);
      
      // Parse error message to provide user-friendly feedback
      const errorMessage = err.message || 'Unknown error';
      let userMessage = 'Unable to generate summary. Please try again later.';
      let fallbackReason = errorMessage;

      // Handle Hugging Face specific errors
      if (errorMessage.includes('TIMEOUT')) {
        userMessage = 'Summary generation is taking too long. Please try again.';
      } else if (errorMessage.includes('RATE_LIMITED')) {
        userMessage = 'AI service is busy. Please try again in a moment.';
      } else if (errorMessage.includes('MODEL_LOADING')) {
        userMessage = 'AI model is warming up. Please try again in a few seconds.';
      } else if (errorMessage.includes('API_ERROR') || errorMessage.includes('UNREACHABLE') || errorMessage.includes('UNAVAILABLE')) {
        userMessage = 'AI service is temporarily unavailable. Please try again later.';
      } else if (errorMessage.includes('too short')) {
        userMessage = 'Article content is too short for AI summarization.';
      }

      // Return success: true with error info so frontend can display properly
      // This ensures the UI updates and shows the error message to the user
      return { 
        success: true, 
        data: { 
          summary: null, 
          error: true,
          fallback: true,
          userMessage,
          fallbackReason,
          retryable: !errorMessage.includes('too short')
        } 
      };
    }
  });

  fastify.post('/rank', {
    schema: {
      body: rankArticlesBodySchema,
      response: { 200: articleListResponseSchema }
    }
  }, async (request, reply) => {
    const { query, limit = 20 } = request.body;
    
    // Validate input
    if (!query || query.trim().length === 0) {
      return reply.badRequest('Search query cannot be empty');
    }

    const articles = await fastify.collections.articles.find({}).limit(limit).toArray();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      let response;
      try {
        response = await fetch(`${config.aiServiceUrl}/api/ai/rank`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, articles }),
          signal: controller.signal
        });
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          fastify.log.warn('Ranking timeout, returning unranked articles');
          return { success: true, data: articles, fallback: true, reason: 'TIMEOUT' };
        }
        fastify.log.warn('AI service unreachable, returning unranked articles');
        return { success: true, data: articles, fallback: true, reason: 'SERVICE_UNREACHABLE' };
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        fastify.log.warn(`Ranking failed with status ${response.status}, returning unranked articles`);
        return { success: true, data: articles, fallback: true, reason: 'AI_ERROR' };
      }
      
      const rankedData = await response.json();
      return { success: true, data: rankedData };
    } catch (err) {
      fastify.log.error('Ranking error:', err);
      return { success: true, data: articles, fallback: true, reason: 'ERROR' };
    }
  });

  /**
   * Save article for "Read Later"
   */
  fastify.post('/:id/save', {
    preHandler: [fastify.authenticate],
    schema: {
      params: articleParamsSchema
    }
  }, async (request, reply) => {
    const userId = new ObjectId(request.user.id);
    const articleId = new ObjectId(request.params.id);

    // Verify article exists
    const article = await fastify.collections.articles.findOne({ _id: articleId });
    if (!article) {
      return reply.notFound('Article not found');
    }

    // Add to user's savedArticles
    await fastify.collections.users.updateOne(
      { _id: userId },
      { $addToSet: { savedArticles: articleId } }
    );

    return { success: true, message: 'Article saved for later' };
  });

  /**
   * Remove article from "Read Later"
   */
  fastify.delete('/:id/save', {
    preHandler: [fastify.authenticate],
    schema: {
      params: articleParamsSchema
    }
  }, async (request, reply) => {
    const userId = new ObjectId(request.user.id);
    const articleId = request.params.id;
    const articleObjectId = new ObjectId(articleId);

    fastify.log.info(`Attempting to unsave article ${articleId} for user ${userId}`);

    // Pull the ObjectId from savedArticles array
    const result = await fastify.collections.users.updateOne(
      { _id: userId },
      { $pull: { savedArticles: articleObjectId } }
    );

    fastify.log.info(`Unsave result: matchedCount=${result.matchedCount}, modifiedCount=${result.modifiedCount}`);

    return { success: true, message: 'Article removed from saved', modified: result.modifiedCount > 0 };
  });

  /**
   * Add article to "Favourites"
   */
  fastify.post('/:id/favourite', {
    preHandler: [fastify.authenticate],
    schema: {
      params: articleParamsSchema
    }
  }, async (request, reply) => {
    const userId = new ObjectId(request.user.id);
    const articleId = new ObjectId(request.params.id);

    // Verify article exists
    const article = await fastify.collections.articles.findOne({ _id: articleId });
    if (!article) {
      return reply.notFound('Article not found');
    }

    // Add to user's favouriteArticles
    await fastify.collections.users.updateOne(
      { _id: userId },
      { $addToSet: { favouriteArticles: articleId } }
    );

    return { success: true, message: 'Article added to favourites' };
  });

  /**
   * Remove article from "Favourites"
   */
  fastify.delete('/:id/favourite', {
    preHandler: [fastify.authenticate],
    schema: {
      params: articleParamsSchema
    }
  }, async (request, reply) => {
    const userId = new ObjectId(request.user.id);
    const articleId = request.params.id;
    const articleObjectId = new ObjectId(articleId);

    fastify.log.info(`Attempting to unfavourite article ${articleId} for user ${userId}`);

    // Pull the ObjectId from favouriteArticles array
    const result = await fastify.collections.users.updateOne(
      { _id: userId },
      { $pull: { favouriteArticles: articleObjectId } }
    );

    fastify.log.info(`Unfavourite result: matchedCount=${result.matchedCount}, modifiedCount=${result.modifiedCount}`);

    return { success: true, message: 'Article removed from favourites', modified: result.modifiedCount > 0 };
  });

  /**
   * Get user's saved articles (Read Later)
   */
  fastify.get('/saved', {
    preHandler: [fastify.authenticate]
  }, async (request) => {
    const userId = new ObjectId(request.user.id);
    const user = await fastify.collections.users.findOne({ _id: userId });
    
    if (!user?.savedArticles?.length) {
      return { success: true, data: [] };
    }

    const articles = await fastify.collections.articles
      .find({ _id: { $in: user.savedArticles } })
      .sort({ publishedAt: -1 })
      .toArray();

    // Enrich with feed info
    const feedIds = [...new Set(articles.map(a => a.feedId))];
    const feeds = await fastify.collections.feeds.find({ _id: { $in: feedIds } }).toArray();
    const feedMap = new Map(feeds.map(f => [f._id.toString(), f]));

    const enrichedArticles = articles.map(article => ({
      ...article,
      feed: feedMap.get(article.feedId?.toString()) || null,
      savedAt: user.savedArticles.find(id => id.toString() === article._id.toString()) ? new Date() : null
    }));

    return { success: true, data: enrichedArticles };
  });

  /**
   * Get user's favourite articles
   */
  fastify.get('/favourites', {
    preHandler: [fastify.authenticate]
  }, async (request) => {
    const userId = new ObjectId(request.user.id);
    const user = await fastify.collections.users.findOne({ _id: userId });
    
    if (!user?.favouriteArticles?.length) {
      return { success: true, data: [] };
    }

    const articles = await fastify.collections.articles
      .find({ _id: { $in: user.favouriteArticles } })
      .sort({ publishedAt: -1 })
      .toArray();

    // Enrich with feed info
    const feedIds = [...new Set(articles.map(a => a.feedId))];
    const feeds = await fastify.collections.feeds.find({ _id: { $in: feedIds } }).toArray();
    const feedMap = new Map(feeds.map(f => [f._id.toString(), f]));

    const enrichedArticles = articles.map(article => ({
      ...article,
      feed: feedMap.get(article.feedId?.toString()) || null
    }));

    return { success: true, data: enrichedArticles };
  });

  /**
   * Get all saved and favourite articles for user
   */
  fastify.get('/collection', {
    preHandler: [fastify.authenticate]
  }, async (request) => {
    const userId = new ObjectId(request.user.id);
    const user = await fastify.collections.users.findOne({ _id: userId });
    
    const savedIds = user?.savedArticles || [];
    const favouriteIds = user?.favouriteArticles || [];
    const allIds = [...new Set([...savedIds, ...favouriteIds].map(id => id.toString()))];

    if (allIds.length === 0) {
      return { success: true, data: [], savedIds: [], favouriteIds: [] };
    }

    const articles = await fastify.collections.articles
      .find({ _id: { $in: allIds.map(id => new ObjectId(id)) } })
      .sort({ publishedAt: -1 })
      .toArray();

    // Enrich with feed info
    const feedIds = [...new Set(articles.map(a => a.feedId))];
    const feeds = await fastify.collections.feeds.find({ _id: { $in: feedIds } }).toArray();
    const feedMap = new Map(feeds.map(f => [f._id.toString(), f]));

    const enrichedArticles = articles.map(article => ({
      ...article,
      feed: feedMap.get(article.feedId?.toString()) || null,
      isSaved: savedIds.some(id => id.toString() === article._id.toString()),
      isFavourite: favouriteIds.some(id => id.toString() === article._id.toString())
    }));

    return { 
      success: true, 
      data: enrichedArticles,
      savedIds: savedIds.map(id => id.toString()),
      favouriteIds: favouriteIds.map(id => id.toString())
    };
  });
}
