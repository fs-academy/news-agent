/**
 * Collection routes for saved article management.
 * @module routes/collections
 */

import { ObjectId } from 'mongodb';
import {
  createCollectionBodySchema,
  updateCollectionBodySchema,
  collectionArticleBodySchema,
  bulkAddArticlesBodySchema,
  collectionQuerySchema,
  collectionParamsSchema,
  collectionResponseSchema,
  collectionListResponseSchema
} from '../schemas/index.js';

export default async function collectionRoutes(fastify) {
  /**
   * Get all collections for a user
   */
  fastify.get('/', {
    schema: {
      querystring: collectionQuerySchema,
      response: { 200: collectionListResponseSchema }
    }
  }, async (request) => {
    const { userId, includeArticles, limit = 50, skip = 0 } = request.query;

    const filter = userId ? { userId: new ObjectId(userId) } : {};
    const collections = await fastify.collections.collections
      .find(filter)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .toArray();

    // Optionally populate articles
    if (includeArticles) {
      for (const collection of collections) {
        if (collection.articleIds?.length > 0) {
          collection.articles = await fastify.collections.articles
            .find({ _id: { $in: collection.articleIds } })
            .toArray();
        }
      }
    }

    return { success: true, data: collections };
  });

  /**
   * Get a single collection by ID
   */
  fastify.get('/:id', {
    schema: {
      params: collectionParamsSchema,
      response: { 200: collectionResponseSchema }
    }
  }, async (request, reply) => {
    const collection = await fastify.collections.collections.findOne({
      _id: new ObjectId(request.params.id)
    });

    if (!collection) {
      return reply.notFound('Collection not found');
    }

    // Populate articles
    if (collection.articleIds?.length > 0) {
      collection.articles = await fastify.collections.articles
        .find({ _id: { $in: collection.articleIds } })
        .toArray();
    }

    return { success: true, data: collection };
  });

  /**
   * Create a new collection
   */
  fastify.post('/', {
    schema: {
      body: createCollectionBodySchema,
      response: { 200: collectionResponseSchema }
    }
  }, async (request) => {
    const { name, description, color, icon } = request.body;
    // TODO: Get userId from auth middleware
    const userId = request.body.userId || null;

    const collection = {
      _id: new ObjectId(),
      userId: userId ? new ObjectId(userId) : null,
      name,
      description: description || '',
      articleIds: [],
      isDefault: false,
      color: color || '#6366f1',
      icon: icon || 'folder',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await fastify.collections.collections.insertOne(collection);
    return { success: true, data: collection };
  });

  /**
   * Update a collection
   */
  fastify.patch('/:id', {
    schema: {
      params: collectionParamsSchema,
      body: updateCollectionBodySchema,
      response: { 200: collectionResponseSchema }
    }
  }, async (request, reply) => {
    const { name, description, color, icon } = request.body;

    const updateFields = { updatedAt: new Date() };
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (color !== undefined) updateFields.color = color;
    if (icon !== undefined) updateFields.icon = icon;

    const result = await fastify.collections.collections.findOneAndUpdate(
      { _id: new ObjectId(request.params.id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return reply.notFound('Collection not found');
    }

    return { success: true, data: result };
  });

  /**
   * Delete a collection
   */
  fastify.delete('/:id', {
    schema: {
      params: collectionParamsSchema
    }
  }, async (request, reply) => {
    const collection = await fastify.collections.collections.findOne({
      _id: new ObjectId(request.params.id)
    });

    if (!collection) {
      return reply.notFound('Collection not found');
    }

    if (collection.isDefault) {
      return reply.badRequest('Cannot delete default collection');
    }

    await fastify.collections.collections.deleteOne({
      _id: new ObjectId(request.params.id)
    });

    return { success: true };
  });

  /**
   * Add an article to a collection
   */
  fastify.post('/:id/articles', {
    schema: {
      params: collectionParamsSchema,
      body: collectionArticleBodySchema
    }
  }, async (request, reply) => {
    const { articleId } = request.body;

    // Verify article exists
    const article = await fastify.collections.articles.findOne({
      _id: new ObjectId(articleId)
    });

    if (!article) {
      return reply.notFound('Article not found');
    }

    const result = await fastify.collections.collections.findOneAndUpdate(
      { _id: new ObjectId(request.params.id) },
      {
        $addToSet: { articleIds: new ObjectId(articleId) },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return reply.notFound('Collection not found');
    }

    return { success: true, data: result };
  });

  /**
   * Bulk add articles to a collection
   */
  fastify.post('/:id/articles/bulk', {
    schema: {
      params: collectionParamsSchema,
      body: bulkAddArticlesBodySchema
    }
  }, async (request, reply) => {
    const { articleIds } = request.body;
    const objectIds = articleIds.map((id) => new ObjectId(id));

    const result = await fastify.collections.collections.findOneAndUpdate(
      { _id: new ObjectId(request.params.id) },
      {
        $addToSet: { articleIds: { $each: objectIds } },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return reply.notFound('Collection not found');
    }

    return { success: true, data: result };
  });

  /**
   * Remove an article from a collection
   */
  fastify.delete('/:id/articles/:articleId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: collectionParamsSchema.properties.id,
          articleId: collectionParamsSchema.properties.id
        },
        required: ['id', 'articleId']
      }
    }
  }, async (request, reply) => {
    const { id, articleId } = request.params;

    const result = await fastify.collections.collections.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $pull: { articleIds: new ObjectId(articleId) },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return reply.notFound('Collection not found');
    }

    return { success: true, data: result };
  });
}
