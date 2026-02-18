import { MongoClient, ServerApiVersion } from 'mongodb';
import fp from 'fastify-plugin';
import { config } from '../config.js';

async function mongodbPlugin(fastify) {
  const clientOptions = {
    // MongoDB Atlas recommended settings for Node.js 22+
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false, // Disabled to allow text indexes
      deprecationErrors: true,
    },
    // Connection pool settings
    maxPoolSize: 10,
    minPoolSize: 1,
    // Timeout settings
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    // Retry settings
    retryWrites: true,
    retryReads: true,
  };

  const client = new MongoClient(config.mongoUri, clientOptions);
  
  try {
    await client.connect();
    // Verify connection with a ping
    await client.db('admin').command({ ping: 1 });
    fastify.log.info('MongoDB connection established and verified');
  } catch (err) {
    fastify.log.error(`MongoDB connection failed: ${err.message}`);
    fastify.log.error('Ensure your IP is whitelisted in MongoDB Atlas Network Access');
    throw err;
  }
  
  const db = client.db(config.mongoDbName || 'newsagent');

  fastify.decorate('mongo', { client, db });
  fastify.decorate('collections', {
    users: db.collection('users'),
    feeds: db.collection('feeds'),
    articles: db.collection('articles'),
    collections: db.collection('collections')
  });

  await createIndexes(db);
  fastify.log.info(`MongoDB connected -> DB: ${config.mongoDbName}`);

  fastify.addHook('onClose', async () => await client.close());
}

async function createIndexes(db) {
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('feeds').createIndex({ url: 1 }, { unique: true });
  await db.collection('feeds').createIndex({ userId: 1 });
  // Unique index on url - each article URL stored once globally
  await db.collection('articles').createIndex({ url: 1 }, { unique: true });
  await db.collection('articles').createIndex({ userIds: 1 }); // Index for user article queries
  await db.collection('articles').createIndex({ matchedInterests: 1 }); // Index for topic filtering
  await db.collection('articles').createIndex({ publishedAt: -1 });
  await db.collection('articles').createIndex({ title: 'text', content: 'text' }, { weights: { title: 10, content: 1 } });
  await db.collection('collections').createIndex({ userId: 1 });
  await db.collection('collections').createIndex({ userId: 1, name: 1 }, { unique: true });
}

// Export wrapped plugin to expose decorators to parent scope
export const connectDB = fp(mongodbPlugin, { name: 'mongodb' });