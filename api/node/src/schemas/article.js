/**
 * Article schema definitions for news article management.
 * @see ADR-002 for MongoDB schema design
 */

import { objectIdSchema, objectIdPattern, paginationSchema } from './common.js';

/**
 * Article ranking sub-schema (AI-generated)
 */
export const articleRankingSchema = {
  type: 'object',
  properties: {
    score: {
      type: 'number',
      minimum: 0,
      maximum: 100,
      description: 'Relevance score (0-100)'
    },
    reason: {
      type: 'string',
      maxLength: 500,
      description: 'AI-generated ranking explanation'
    },
    cachedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Ranking cache timestamp (24h TTL)'
    }
  }
};

/**
 * Article metadata sub-schema
 */
export const articleMetadataSchema = {
  type: 'object',
  properties: {
    author: {
      type: 'string',
      maxLength: 255,
      description: 'Article author'
    },
    tags: {
      type: 'array',
      items: { type: 'string', maxLength: 50 },
      maxItems: 20,
      description: 'Article tags/categories'
    },
    imageUrl: {
      type: 'string',
      format: 'uri',
      maxLength: 2048,
      description: 'Article thumbnail/hero image'
    },
    readingTime: {
      type: 'integer',
      minimum: 0,
      description: 'Estimated reading time in minutes'
    },
    wordCount: {
      type: 'integer',
      minimum: 0,
      description: 'Article word count'
    }
  }
};

/**
 * Core article entity schema (database representation)
 */
export const articleSchema = {
  $id: 'article',
  type: 'object',
  properties: {
    _id: objectIdSchema,
    feedId: {
      ...objectIdSchema,
      description: 'Source feed ID'
    },
    title: {
      type: 'string',
      maxLength: 500,
      description: 'Article title'
    },
    url: {
      type: 'string',
      format: 'uri',
      maxLength: 2048,
      description: 'Article URL (unique)'
    },
    content: {
      type: 'string',
      description: 'Full article content (full-text indexed)'
    },
    summary: {
      type: 'string',
      maxLength: 1000,
      description: 'Ollama-generated summary'
    },
    publishedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Original publish date'
    },
    ingestedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Ingestion timestamp'
    },
    ranking: articleRankingSchema,
    metadata: articleMetadataSchema
  },
  required: ['feedId', 'title', 'url', 'ingestedAt']
};

/**
 * Article query parameters schema
 */
export const articleQuerySchema = {
  type: 'object',
  properties: {
    feedId: {
      type: 'string',
      pattern: objectIdPattern,
      description: 'Filter by feed ID'
    },
    search: {
      type: 'string',
      maxLength: 500,
      description: 'Full-text search query'
    },
    startDate: {
      type: 'string',
      format: 'date-time',
      description: 'Filter articles after this date'
    },
    endDate: {
      type: 'string',
      format: 'date-time',
      description: 'Filter articles before this date'
    },
    tags: {
      type: 'string',
      description: 'Comma-separated tag filter'
    },
    hasRanking: {
      type: 'boolean',
      description: 'Filter by ranking availability'
    },
    minScore: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
      description: 'Minimum ranking score filter'
    },
    ...paginationSchema.properties
  }
};

/**
 * Rank articles request body schema
 */
export const rankArticlesBodySchema = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      minLength: 1,
      maxLength: 500,
      description: 'User query for relevance ranking'
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 20,
      description: 'Max articles to rank'
    },
    feedIds: {
      type: 'array',
      items: { type: 'string', pattern: objectIdPattern },
      maxItems: 50,
      description: 'Optional feed ID filter'
    }
  },
  required: ['query'],
  additionalProperties: false
};

/**
 * Summarize article request body schema
 */
export const summarizeArticleBodySchema = {
  type: 'object',
  properties: {
    articleId: {
      type: 'string',
      pattern: objectIdPattern,
      description: 'Article ID to summarize'
    },
    maxLength: {
      type: 'integer',
      minimum: 50,
      maximum: 1000,
      default: 200,
      description: 'Max summary length'
    }
  },
  required: ['articleId'],
  additionalProperties: false
};

/**
 * Article response schema
 */
export const articleResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: articleSchema
  }
};

/**
 * Article list response schema
 */
export const articleListResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: articleSchema
    },
    fallback: {
      type: 'boolean',
      description: 'True if AI ranking failed and returned unranked results'
    }
  }
};

/**
 * Article ID parameter schema
 */
export const articleParamsSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      pattern: objectIdPattern,
      description: 'Article ID'
    }
  },
  required: ['id']
};

export default {
  articleSchema,
  articleRankingSchema,
  articleMetadataSchema,
  articleQuerySchema,
  rankArticlesBodySchema,
  summarizeArticleBodySchema,
  articleResponseSchema,
  articleListResponseSchema,
  articleParamsSchema
};
