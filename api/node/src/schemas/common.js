/**
 * Common schema definitions shared across entities.
 * Uses JSON Schema format for Fastify validation.
 */

/**
 * MongoDB ObjectId pattern (24 hex characters)
 */
export const objectIdPattern = '^[0-9a-fA-F]{24}$';

/**
 * Reusable ObjectId schema
 */
export const objectIdSchema = {
  type: 'string',
  pattern: objectIdPattern,
  description: 'MongoDB ObjectId'
};

/**
 * Pagination query parameters
 */
export const paginationSchema = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 20,
      description: 'Number of items to return'
    },
    skip: {
      type: 'integer',
      minimum: 0,
      default: 0,
      description: 'Number of items to skip'
    }
  }
};

/**
 * Standard API response wrapper
 */
export const responseSchema = {
  success: { type: 'boolean' },
  message: { type: 'string' }
};

/**
 * Error response schema
 */
export const errorResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', const: false },
    error: { type: 'string' },
    statusCode: { type: 'integer' }
  },
  required: ['success', 'error']
};
