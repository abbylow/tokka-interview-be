import { Queue } from 'bullmq';

const transactionQueue = new Queue('transaction-queue', {
  connection: {
    host: 'redis',
    port: 6379,
  },
});

export default transactionQueue;
