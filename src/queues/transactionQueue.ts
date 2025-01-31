import { Queue } from 'bullmq';

const transactionQueue = new Queue('transaction-queue', {
  connection: {
    host: process.env.REDIS_QUEUE_HOST || 'redis-queue',
    port: parseInt(process.env.REDIS_QUEUE_PORT || '6379', 10),
  },
});

export default transactionQueue;
