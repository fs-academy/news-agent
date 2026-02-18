/**
 * Collection schema definitions for saved article organization.
 * @see ADR-002 for MongoDB schema design
 */

import { objectIdSchema, objectIdPattern, paginationSchema } from './common.js';

/**
 * Core collection entity schema (database representation)
 */
export const collectionSchema = {
  $id: 'collection',
  type: 'object',
  properties: {
    _id: objectIdSchema,
    userId: {
      ...objectIdSchema,
      description: 'Owner user ID'
    },
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Collection name'
    },
    description: {
      type: 'string',
      maxLength: 500,
      description: 'Collection description'
    },
    articleIds: {
      type: 'array',
      items: objectIdSchema,
      maxItems: 1000,
      description: 'Saved article IDs'
    },
    isDefault: {
      type: 'boolean',
      default: false,
      description: 'Whether this is the default "Saved" collection'
    },
    color: {
      type: 'string',
      pattern: '^#[0-9A-Fa-f]{6}$',
      description: 'Collection color (hex)'
    },
    icon: {
      type: 'string',
      maxLength: 50,
      description: 'Collection icon identifier'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Collection creation timestamp'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Last update timestamp'
    }
  },
  required: ['userId', 'name', 'createdAt']
};

/**
 * Create collection request body schema
 */
export const createCollectionBodySchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Collection name'
    },
    description: {
      type: 'string',
      maxLength: 500
    },
    color: {
      type: 'string',
      pattern: '^#[0-9A-Fa-f]{6}$',
      default: '#6366f1'
    },
    icon: {
      type: 'string',
      maxLength: 50
    }
  },
  required: ['name'],
  additionalProperties: false
};

/**
 * Update collection request body schema
 */
export const updateCollectionBodySchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100
    },
    description: {
      type: 'string',
      maxLength: 500
    },
    color: {
      type: 'string',
      pattern: '^#[0-9A-Fa-f]{6}$'
    },
    icon: {
      type: 'string',
      maxLength: 50
    }
  },
  additionalProperties: false
};

/**
 * Add/remove article from collection request body
 */
export const collectionArticleBodySchema = {
  type: 'object',
  properties: {
    articleId: {
      type: 'string',
      pattern: objectIdPattern,
      description: 'Article ID to add/remove'
    }
  },
  required: ['articleId'],
  additionalProperties: false
};

/**
 * Bulk add articles to collection request body
 */
export const bulkAddArticlesBodySchema = {
  type: 'object',
  properties: {
    articleIds: {
      type: 'array',
      items: { type: 'string', pattern: objectIdPattern },
      minItems: 1,
      maxItems: 100,
      description: 'Article IDs to add'
    }
  },
  required: ['articleIds'],
  additionalProperties: false
};

/**
 * Collection query parameters schema
 */
export const collectionQuerySchema = {
  type: 'object',
  properties: {
    userId: {
      type: 'string',
      pattern: objectIdPattern,
      description: 'Filter by user ID'
    },
    includeArticles: {
      type: 'boolean',
      default: false,
      description: 'Include full article data'
    },
    ...paginationSchema.properties
  }
};

/**
 * Collection response schema
 */
export const collectionResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: collectionSchema
  }
};

/**
 * Collection list response schema
 */
export const collectionListResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: collectionSchema
    }
  }
};

/**
 * Collection ID parameter schema
 */
export const collectionParamsSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      pattern: objectIdPattern,
      description: 'Collection ID'
    }
  },
  required: ['id']
};

export default {
  collectionSchema,
  createCollectionBodySchema,
  updateCollectionBodySchema,
  collectionArticleBodySchema,
  bulkAddArticlesBodySchema,
  collectionQuerySchema,
  collectionResponseSchema,
  collectionListResponseSchema,
  collectionParamsSchema
};
