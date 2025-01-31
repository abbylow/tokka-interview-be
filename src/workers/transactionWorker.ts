import { Worker } from 'bullmq';
import Redis from 'ioredis';
import fetch from 'node-fetch';
import { pool } from '../db';
import { redisQueueConfig, redisCacheConfig } from '../redis';

const redisCache = new Redis(redisCacheConfig);

const connection = {
  ...redisQueueConfig,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
};

const symbol = "ETHUSDT"

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

      // Check Redis cache for ETH/USDT price with the timestamp
      let ethPrice = await redisCache.get(`${symbol}:price:${transaction.timestamp}`);
      console.log("Found cached ethPrice ", ethPrice)
      // If not in cache, fetch from Binance API and store in Redis
      if (!ethPrice) {
        console.log('Fetching ETH price from Binance API...');
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1s&limit=1`
        );
        const data = await response.json();
        console.log("data from Binance api, ", data)
        // Extract the closing price from the API response
        const [, , , , closePrice] = data[0]
        ethPrice = closePrice;

        if (ethPrice) {
          console.log(`ETH price at ${transaction.timestamp}: ${ethPrice}`);
          // Store the price in Redis with the current timestamp key and a TTL (e.g., 5 mins)
          await redisCache.set(`${symbol}:price:${transaction.timestamp}`, ethPrice, 'EX', 300);
        } else {
          throw new Error("Fail to fetch ETHUSDT price from Binance")
        }
      }

      const ethPriceFormatted = parseFloat(ethPrice).toFixed(6); 

      const params = [
        transaction.hash,
        transaction.block_number,
        transaction.timestamp,
        transaction.gas_used,
        transaction.gas_price,
        ethPriceFormatted
      ];

      console.log("in worker", params);
      await pool.query(query, params);

      console.log(`Transaction processed: ${transaction.hash}`);
    } catch (error) {
      console.error('Job processing failed: ', error);
      throw error; // Re-throw to let BullMQ handle the error
    }
  },
  {
    connection,
    // Add some worker options for better reliability
    concurrency: 1,               // Number of concurrent jobs the worker can process at the same time
    maxStalledCount: 3,           // Maximum number of times a job can stall before being marked as failed
    stalledInterval: 30000,       // Interval (in ms) to check for stalled jobs (30 seconds)
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
