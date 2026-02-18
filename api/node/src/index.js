import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import sensible from '@fastify/sensible';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import { connectDB } from './plugins/mongodb.js';
import { registerSchemas } from './schemas/index.js';
import articleRoutes from './routes/articles.js';
import authRoutes from './routes/auth.js';
import oauthRoutes from './routes/oauth.js';
import healthRoutes from './routes/health.js';
import collectionRoutes from './routes/collections.js';
import newsRoutes from './routes/news.js';

const fastify = Fastify({
  logger: {
    level: config.logLevel,
    transport: config.nodeEnv === 'development' ? { target: 'pino-pretty' } : undefined
  }
});

async function start() {
  // CORS with configurable origins
  await fastify.register(cors, config.corsOptions);
  await fastify.register(sensible);
  await fastify.register(jwt, { secret: config.jwtSecret });
  
  // Global rate limiting
  await fastify.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
    errorResponseBuilder: (request, context) => ({
      success: false,
      message: `Too many requests. Please try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
      statusCode: 429,
    }),
  });
  
  await fastify.register(connectDB);

  // Auth decorator for protected routes
  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.unauthorized('Invalid or expired token');
    }
  });

  // Register JSON schemas for validation
  registerSchemas(fastify);

  fastify.register(healthRoutes, { prefix: '/api/health' });
  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(oauthRoutes, { prefix: '/api/auth' });
  fastify.register(articleRoutes, { prefix: '/api/articles' });
  fastify.register(collectionRoutes, { prefix: '/api/collections' });
  fastify.register(newsRoutes, { prefix: '/api/news' });

  await fastify.listen({
    port: config.port,
    host: "0.0.0.0"
  });
}

start();
