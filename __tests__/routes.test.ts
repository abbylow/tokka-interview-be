import request from 'supertest';
import * as ethers from 'ethers';
import { app } from '../src/app';
import * as transactionServices from '../src/services/transactions';
import * as syncService from '../src/services/sync';

jest.mock('../src/services/transactions');
jest.mock('../src/services/sync');

describe('API Routes', () => {

  // Health Check Endpoint
  test('GET /api/health - should return a health check message', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Server is running!' });
  });

  // Transactions Endpoint
  test('POST /api/transactions - should return paginated transactions', async () => {
    const mockTransactions = {
      rows: [
        { hash: '0x123', block_number: 1, timestamp: 1620000000, gas_used: '21000', gas_price: '1000000000' },
      ],
      totalCount: 1,
    };
    (transactionServices.getTransactions as jest.Mock).mockResolvedValue(mockTransactions);

    const response = await request(app).post('/api/transactions').send({
      startTimestamp: '1619999999',
      endTimestamp: '1620009999',
      page: 1,
      limit: 10,
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      currentPage: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
      transactions: mockTransactions.rows,
    });
    expect(transactionServices.getTransactions).toHaveBeenCalledWith('1619999999', '1620009999', undefined, 10, 0);
  });

  // Transactions Summary Endpoint
  test('POST /api/transactions-summary - should return transaction fee summary', async () => {
    (transactionServices.getTransactionSummary as jest.Mock).mockResolvedValue({
      total_eth_fee: 0.5,
      total_usdt_fee: 1000,
    });

    const response = await request(app).post('/api/transactions-summary');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      totalEthFee: 0.5,
      totalUsdtFee: 1000,
    });
    expect(transactionServices.getTransactionSummary).toHaveBeenCalled();
  });

  // Sync Endpoint
  test('POST /api/sync - should sync transactions and return total synced', async () => {
    (syncService.syncTransactions as jest.Mock).mockResolvedValue(10);

    const mockProvider = {
      getBlockNumber: jest.fn().mockResolvedValue(100),
    };
    jest.spyOn(ethers, 'JsonRpcProvider').mockImplementation(() => mockProvider as any);

    process.env.INFURA_API_KEY = 'mock-infura-key';
    process.env.UNISWAP_POOL_ADDRESS = '0xmockpooladdress';

    const response = await request(app).post('/api/sync').send({
      startBlock: 1,
      endBlock: 100,
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      message: 'Transactions synced successfully',
      total: 10,
    });
    expect(syncService.syncTransactions).toHaveBeenCalledWith('0xmockpooladdress', 1, 100);
  });

});
