import { Worker } from 'bullmq';
import Redis from 'ioredis';
import fetch from 'node-fetch';
import { pool } from '../db';
import { redisQueueConfig, redisCacheConfig } from '../redis';
import { txQueueName } from '../queues/transactionQueue';

// Initialize Redis connection for caching
const redisCache = new Redis(redisCacheConfig);

// BullMQ connection configuration with retry strategy
const connection = {
  ...redisQueueConfig,
  retryStrategy: (times: number) => Math.min((Math.random() + 1) * 2 ** times * 100, 30000), // Exponential backoff with jitter (max 30s)
};

const symbol = "ETHUSDT";         // Symbol for fetching ETH/USDT price
const maxWeight = 1200;           // Binance API weight limit for 1-minute window

// Create a BullMQ worker to process transactions from the queue
export const transactionWorker = new Worker(
  txQueueName,
  async job => {
    try {
      const transaction = job.data;

      // SQL query to insert transaction data into the database
      const query = `
        INSERT INTO transactions (hash, block_number, timestamp, gas_used, gas_price, eth_price_at_tx)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (hash) DO NOTHING
      `;

      // Check if ETH price is cached in Redis
      let ethPrice = await redisCache.get(`${symbol}:price:${transaction.timestamp}`);
      if (!ethPrice) {
        console.log('Fetching ETH price from Binance API...');
        
        // Fetch price data from Binance API
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1s&limit=1`);

        // Handle API rate limit errors
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 30000;
          console.warn(`Rate limit exceeded. Retrying after ${delay} ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          throw new Error('Rate limit exceeded. Retry after delay.');
        }

        // Check for approaching API weight limit
        const usedWeight = response.headers.get('X-MBX-USED-WEIGHT-1M');
        if (usedWeight && parseInt(usedWeight) >= maxWeight - 50) {
          console.warn('Approaching API rate limit. Pausing requests...');
          await new Promise(resolve => setTimeout(resolve, 60000));  // Pause for 1 minute
        }

        const data = await response.json();

        // Extract the closing price from the API response
        const [, , , , closePrice] = data[0];
        ethPrice = closePrice;

        if (ethPrice) {
          // Cache the price in Redis with a TTL of 10 minutes
          await redisCache.set(`${symbol}:price:${transaction.timestamp}`, ethPrice, 'EX', 600);
        } else {
          throw new Error("Failed to fetch ETH/USDT price from Binance");
        }
      }

      const ethPriceFormatted = parseFloat(ethPrice).toFixed(6);

      // Insert transaction data into the database
      const params = [
        transaction.hash,
        transaction.block_number,
        transaction.timestamp,
        transaction.gas_used,
        transaction.gas_price,
        ethPriceFormatted,
      ];
      await pool.query(query, params);

      console.log(`Transaction processed: ${transaction.hash}`);
    } catch (error) {
      console.error('Job processing failed: ', error);
      throw error; // Re-throw error for BullMQ error handling
    }
  },
  {
    connection,
    concurrency: 5,               // Number of concurrent jobs the worker can process at the same time
    maxStalledCount: 3,           // Max number of times a job can stall before being marked as failed
    stalledInterval: 30000,       // Interval to check for stalled jobs (30 seconds)
  }
);

// Event listeners for worker events
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
