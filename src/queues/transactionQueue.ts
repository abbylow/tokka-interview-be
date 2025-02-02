import { Queue } from 'bullmq';

// Define the job name for recording transactions
export const recordTxJobName = 'record-transaction';

// Define the queue name for transaction-related tasks
export const txQueueName = 'transaction-queue';

/**
 * Initialize the transaction queue using BullMQ.
 * The queue is configured to connect to the Redis instance for managing job tasks.
 */
const transactionQueue = new Queue(txQueueName, {
  connection: {
    // Use the Redis host and port from environment variables, with defaults for Docker setup
    host: process.env.REDIS_QUEUE_HOST || 'redis-queue',  // Default: 'redis-queue' (Docker container name)
    port: parseInt(process.env.REDIS_QUEUE_PORT || '6379', 10),  // Default: 6379
  },
});

export default transactionQueue;
