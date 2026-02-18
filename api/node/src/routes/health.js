export default async function healthRoutes(fastify) {
  fastify.get('/', async () => ({
    status: 'healthy',
    timestamp: new Date().toISOString()
  }));

  fastify.get('/ready', async () => ({ ready: true }));
  fastify.get('/live', async () => ({ alive: true }));
}
