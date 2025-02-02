import { Queue } from 'bullmq';
import { recordTxJobName, txQueueName } from '../../src/queues/transactionQueue';

jest.mock('bullmq', () => ({
  Queue: jest.fn(),
}));

describe('Transaction Queue', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize the queue with the correct name and Redis configuration', () => {
    // Check if Queue was instantiated with the correct parameters
    expect(Queue).toHaveBeenCalledWith(txQueueName, {
      connection: {
        host: process.env.REDIS_QUEUE_HOST || 'redis-queue',
        port: parseInt(process.env.REDIS_QUEUE_PORT || '6379', 10),
      },
    });
  });

});
