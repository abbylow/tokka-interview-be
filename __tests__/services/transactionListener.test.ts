import { ethers } from 'ethers';
import transactionQueue, { recordTxJobName } from '../../src/queues/transactionQueue';
import { startTransactionListener } from '../../src/services/transactionListener';

jest.mock('ethers');
jest.mock('../../src/queues/transactionQueue', () => ({
  add: jest.fn(),
  recordTxJobName: 'record-transaction',
}));

describe('startTransactionListener', () => {
  let mockProvider: any;
  let mockContract: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment variables
    process.env.INFURA_API_KEY = 'mockInfuraApiKey';
    process.env.UNISWAP_POOL_ADDRESS = '0xMockPoolAddress';

    // Mock provider and contract
    mockProvider = {
      getTransactionReceipt: jest.fn(),
      getBlock: jest.fn(),
    };
    (ethers.JsonRpcProvider as jest.Mock).mockImplementation(() => mockProvider);

    mockContract = {
      on: jest.fn(),
    };
    (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);
  });

  test('should initialize the event listener with the correct provider and contract', () => {
    startTransactionListener();

    expect(ethers.JsonRpcProvider).toHaveBeenCalledWith(
      'https://mainnet.infura.io/v3/mockInfuraApiKey'
    );
    expect(ethers.Contract).toHaveBeenCalledWith(
      '0xMockPoolAddress',
      expect.any(Array),
      mockProvider
    );
    expect(mockContract.on).toHaveBeenCalledWith('Swap', expect.any(Function));
  });

  test('should exit if INFURA_API_KEY is missing', () => {
    delete process.env.INFURA_API_KEY;

    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('Process exited');
    });

    expect(() => startTransactionListener()).toThrow('Process exited');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('should exit if UNISWAP_POOL_ADDRESS is missing', () => {
    delete process.env.UNISWAP_POOL_ADDRESS;

    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('Process exited');
    });

    expect(() => startTransactionListener()).toThrow('Process exited');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('should process a valid Swap event and add transaction data to the queue', async () => {
    startTransactionListener();

    const mockEvent = {
      log: { transactionHash: '0xMockTxHash' },
    };

    const swapListener = mockContract.on.mock.calls[0][1];
    mockProvider.getTransactionReceipt.mockResolvedValueOnce({
      hash: '0xMockTxHash',
      blockNumber: 12345,
      gasUsed: BigInt('21000'),
      gasPrice: BigInt('1000000000'),
    });
    mockProvider.getBlock.mockResolvedValueOnce({
      timestamp: 1672531199,
    });

    await swapListener('0xSender', '0xRecipient', '100', '200', '300', '400', '500', mockEvent);

    expect(mockProvider.getTransactionReceipt).toHaveBeenCalledWith('0xMockTxHash');
    expect(mockProvider.getBlock).toHaveBeenCalledWith(12345);
    expect(transactionQueue.add).toHaveBeenCalledWith(
      recordTxJobName,
      {
        hash: '0xMockTxHash',
        block_number: 12345,
        timestamp: 1672531199,
        gas_used: '21000',
        gas_price: '1000000000',
      },
      { attempts: 5, backoff: { type: 'exponential', delay: 5000 } }
    );
  });

  test('should log an error if the transaction hash is undefined', async () => {
    console.error = jest.fn();

    startTransactionListener();

    const swapListener = mockContract.on.mock.calls[0][1];
    await swapListener('0xSender', '0xRecipient', '100', '200', '300', '400', '500', {});

    expect(console.error).toHaveBeenCalledWith('Transaction hash is undefined.');
    expect(mockProvider.getTransactionReceipt).not.toHaveBeenCalled();
  });

  test('should log an error if fetching transaction receipt fails', async () => {
    console.error = jest.fn();

    startTransactionListener();

    const mockEvent = {
      log: { transactionHash: '0xMockTxHash' },
    };

    mockProvider.getTransactionReceipt.mockResolvedValueOnce(null);

    const swapListener = mockContract.on.mock.calls[0][1];
    await swapListener('0xSender', '0xRecipient', '100', '200', '300', '400', '500', mockEvent);

    expect(console.error).toHaveBeenCalledWith('Failed to get transaction receipt for hash: 0xMockTxHash');
    expect(transactionQueue.add).not.toHaveBeenCalled();
  });
});
