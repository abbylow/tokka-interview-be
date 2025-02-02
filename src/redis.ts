// Configuration for Redis queue
export const redisQueueConfig = {
  host: process.env.REDIS_QUEUE_HOST || 'redis-queue',
  port: parseInt(process.env.REDIS_QUEUE_PORT || '6379'),
};

// Configuration for Redis cache
export const redisCacheConfig = {
  host: process.env.REDIS_CACHE_HOST || 'redis-cache',
  port: parseInt(process.env.REDIS_CACHE_PORT || '6379'),
};
