import { Queue } from 'bullmq';

export const txQueueName = 'transaction-queue';

const transactionQueue = new Queue(txQueueName, {
  connection: {
    host: process.env.REDIS_QUEUE_HOST || 'redis-queue',
    port: parseInt(process.env.REDIS_QUEUE_PORT || '6379', 10),
  },
});

export default transactionQueue;
