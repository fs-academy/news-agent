/**
 * Central schema registry for NewsAgent API.
 * Exports all JSON Schema definitions for Fastify validation.
 *
 * @see https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/
 */

// Common schemas
export {
  objectIdSchema,
  objectIdPattern,
  paginationSchema,
  responseSchema,
  errorResponseSchema
} from './common.js';

// User schemas
export {
  userSchema,
  userSettingsSchema,
  signupBodySchema,
  loginBodySchema,
  userResponseSchema,
  updateProfileBodySchema
} from './user.js';

// Article schemas
export {
  articleSchema,
  articleRankingSchema,
  articleMetadataSchema,
  articleQuerySchema,
  rankArticlesBodySchema,
  summarizeArticleBodySchema,
  articleResponseSchema,
  articleListResponseSchema,
  articleParamsSchema
} from './article.js';

// Collection schemas
export {
  collectionSchema,
  createCollectionBodySchema,
  updateCollectionBodySchema,
  collectionArticleBodySchema,
  bulkAddArticlesBodySchema,
  collectionQuerySchema,
  collectionResponseSchema,
  collectionListResponseSchema,
  collectionParamsSchema
} from './collection.js';

// Import schemas for registration
import { userSchema } from './user.js';
import { articleSchema } from './article.js';
import { collectionSchema } from './collection.js';

/**
 * Register all schemas with Fastify instance.
 * Call this during server initialization for $ref support.
 *
 * @param {import('fastify').FastifyInstance} fastify
 */
export function registerSchemas(fastify) {
  // Register entity schemas for $ref support
  const entitySchemas = [
    userSchema,
    articleSchema,
    collectionSchema
  ];

  entitySchemas.forEach((schema) => {
    if (schema.$id) {
      fastify.addSchema(schema);
    }
  });

  fastify.log.info(`Registered ${entitySchemas.length} JSON schemas`);
}
