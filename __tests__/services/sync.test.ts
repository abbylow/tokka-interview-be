import fetch, { Response } from 'node-fetch';
import transactionQueue from '../../src/queues/transactionQueue';
import { syncTransactions, fetchTokenTransactions } from '../../src/services/sync';
import { EtherscanResponse } from '../../src/types/etherscan';

jest.mock('node-fetch', () => jest.fn());
jest.mock('../../src/queues/transactionQueue', () => ({
  add: jest.fn(),
}));

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockTransactionQueue = transactionQueue;

describe('Transaction Synchronization Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment variables
    process.env.ETHERSCAN_API_KEY = 'mockEtherscanApiKey';
  });

  function createMockResponse(data: any): Response {
    return {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(data),
      text: jest.fn(),
      headers: new Headers(),
      redirected: false,
      statusText: 'OK',
      clone: jest.fn(),
      body: null,
      bodyUsed: false,
    } as unknown as Response;
  }

  test('should fetch token transactions from Etherscan', async () => {
    const mockPoolAddress = '0xPoolAddress';
    const mockStartBlock = 1000;
    const mockEndBlock = 2000;

    const mockResponse: EtherscanResponse = {
      status: '1',
      message: 'OK',
      result: [
        {
          blockNumber: '1001',
          timeStamp: '1672531199',
          hash: '0xabc123',
          gasUsed: '21000',
          gasPrice: '1000000000',
          nonce: '',
          blockHash: '',
          from: '',
          contractAddress: '',
          to: '',
          value: '',
          tokenName: '',
          tokenSymbol: '',
          tokenDecimal: '',
          transactionIndex: '',
          gas: '',
          cumulativeGasUsed: '',
          input: '',
          confirmations: '',
        },
      ],
    };

    mockFetch.mockResolvedValue(createMockResponse(mockResponse));

    const transactions = await fetchTokenTransactions(mockPoolAddress, mockStartBlock, mockEndBlock);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(mockPoolAddress));
    expect(transactions).toEqual(mockResponse.result);
  });

  test('should throw an error if Etherscan returns a failed response', async () => {
    mockFetch.mockResolvedValue(
      createMockResponse({
        status: '0',
        message: 'NOTOK',
      })
    );

    await expect(fetchTokenTransactions('0xPoolAddress', 1000, 2000)).rejects.toThrow('Etherscan API error: NOTOK');
  });

  test('should sync transactions and add them to the queue', async () => {
    const mockPoolAddress = '0xPoolAddress';
    const mockStartBlock = 1000;
    const mockEndBlock = 2000;

    const mockResponse: EtherscanResponse = {
      status: '1',
      message: 'OK',
      result: [
        {
          blockNumber: '1001',
          timeStamp: '1672531199',
          hash: '0xabc123',
          gasUsed: '21000',
          gasPrice: '1000000000',
          nonce: '',
          blockHash: '',
          from: '',
          contractAddress: '',
          to: '',
          value: '',
          tokenName: '',
          tokenSymbol: '',
          tokenDecimal: '',
          transactionIndex: '',
          gas: '',
          cumulativeGasUsed: '',
          input: '',
          confirmations: '',
        },
        {
          blockNumber: '1002',
          timeStamp: '1672531200',
          hash: '0xdef456',
          gasUsed: '22000',
          gasPrice: '900000000',
          nonce: '',
          blockHash: '',
          from: '',
          contractAddress: '',
          to: '',
          value: '',
          tokenName: '',
          tokenSymbol: '',
          tokenDecimal: '',
          transactionIndex: '',
          gas: '',
          cumulativeGasUsed: '',
          input: '',
          confirmations: '',
        },
      ],
    };

    mockFetch.mockResolvedValue(createMockResponse(mockResponse));

    const totalSynced = await syncTransactions(mockPoolAddress, mockStartBlock, mockEndBlock);

    expect(mockTransactionQueue.add).toHaveBeenCalledTimes(2);
    expect(totalSynced).toBe(2);
  });

  test('should filter out duplicate transactions', async () => {
    const mockPoolAddress = '0xPoolAddress';
    const mockStartBlock = 1000;
    const mockEndBlock = 2000;

    const mockResponse: EtherscanResponse = {
      status: '1',
      message: 'OK',
      result: [
        {
          blockNumber: '1001',
          timeStamp: '1672531199',
          hash: '0xabc123',
          gasUsed: '21000',
          gasPrice: '1000000000',
          nonce: '',
          blockHash: '',
          from: '',
          contractAddress: '',
          to: '',
          value: '',
          tokenName: '',
          tokenSymbol: '',
          tokenDecimal: '',
          transactionIndex: '',
          gas: '',
          cumulativeGasUsed: '',
          input: '',
          confirmations: '',
        },
        {
          blockNumber: '1001',
          timeStamp: '1672531199',
          hash: '0xabc123',
          gasUsed: '21000',
          gasPrice: '1000000000',
          nonce: '',
          blockHash: '',
          from: '',
          contractAddress: '',
          to: '',
          value: '',
          tokenName: '',
          tokenSymbol: '',
          tokenDecimal: '',
          transactionIndex: '',
          gas: '',
          cumulativeGasUsed: '',
          input: '',
          confirmations: '',
        },
      ],
    };

    mockFetch.mockResolvedValue(createMockResponse(mockResponse));

    const totalSynced = await syncTransactions(mockPoolAddress, mockStartBlock, mockEndBlock);

    expect(mockTransactionQueue.add).toHaveBeenCalledTimes(1); // Only one unique transaction should be added
    expect(totalSynced).toBe(2);
  });

  test('should stop syncing if no transactions are returned', async () => {
    const mockPoolAddress = '0xPoolAddress';
    const mockStartBlock = 1000;
    const mockEndBlock = 2000;

    const mockResponse: EtherscanResponse = {
      status: '1',
      message: 'OK',
      result: [],
    };

    mockFetch.mockResolvedValue(createMockResponse(mockResponse));

    const totalSynced = await syncTransactions(mockPoolAddress, mockStartBlock, mockEndBlock);

    expect(mockTransactionQueue.add).not.toHaveBeenCalled();
    expect(totalSynced).toBe(0);
  });
});
