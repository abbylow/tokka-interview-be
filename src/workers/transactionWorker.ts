import { Worker } from 'bullmq';
import { pool } from '../db';

const connection = {
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  // Add retry strategy
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

export const transactionWorker = new Worker(
  'transaction-queue',
  async job => {
    try {
      const transaction = job.data;

      const query = `
          INSERT INTO transactions (hash, block_number, timestamp, gas_used, gas_price, eth_price_at_tx)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (hash) DO NOTHING
        `;

      const params = [
        transaction.hash,
        transaction.block_number,
        transaction.timestamp,
        transaction.gas_used,
        transaction.gas_price,
        999
      ];

      console.log("in worker", params);
      // await pool.query(query, params);

      console.log(`Transaction processed: ${transaction.hash}`);
    } catch (error) {
      console.error('Job processing failed: ', error);
      throw error; // Re-throw to let BullMQ handle the error
    }
  },
  {
    connection,
    // Add some worker options for better reliability
    concurrency: 1,
    maxStalledCount: 3,
    stalledInterval: 30000,
  }
);

// Listen for worker events
transactionWorker.on('completed', job => {
  console.log(`Job ${job.id} completed`);
});

transactionWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

transactionWorker.on('error', err => {
  console.error('Worker error:', err);
});

console.log('Worker started and processing jobs...');
