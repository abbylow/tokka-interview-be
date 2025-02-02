import { getTransactions, getTransactionSummary } from '../../src/services/transactions';
import { pool } from '../../src/db';

// Mock the pool object
jest.mock('../../src/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('Transaction Services', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTransactions', () => {
    test('should fetch transactions with filters and pagination', async () => {
      // Mock data
      const mockRows = [
        {
          id: 1,
          hash: '0x123',
          block_number: 1000,
          timestamp: 1672425600,
          gas_used: '21000',
          gas_price: '1000000000',
          eth_price_at_tx: '3000.00',
          processed_at: 1672425600,
          eth_fee: '0.000021',
          usdt_fee: '0.063',
        },
      ];

      const mockCountResult = [{ count: mockRows.length }];

      // Mock the pool.query calls
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockRows })   // First call to fetch transactions
        .mockResolvedValueOnce({ rows: mockCountResult });  // Second call to fetch count

      // Call the function
      const result = await getTransactions('1672425600', '1672500000', '0x123', 10, 0);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ rows: mockRows, totalCount: mockRows.length });
    });

    test('should return empty results if no transactions match', async () => {
      // Mock the pool.query calls
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })  // No transactions found
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      // Call the function
      const result = await getTransactions();

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ rows: [], totalCount: 0 });
    });

    test('should handle errors from the database', async () => {
      // Mock the pool.query to throw an error
      (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Expect the function to throw an error
      await expect(getTransactions()).rejects.toThrow('Database error');
    });
  });

  describe('getTransactionSummary', () => {
    test('should return the total ETH and USDT fees', async () => {
      // Mock data
      const mockSummary = {
        total_eth_fee: '0.1',
        total_usdt_fee: '300.00',
      };

      // Mock the pool.query call
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockSummary] });

      // Call the function
      const result = await getTransactionSummary();

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSummary);
    });

    test('should return zero fees if no transactions exist', async () => {
      // Mock the pool.query call
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total_eth_fee: '0', total_usdt_fee: '0' }],
      });

      // Call the function
      const result = await getTransactionSummary();

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ total_eth_fee: '0', total_usdt_fee: '0' });
    });

    test('should handle errors from the database', async () => {
      // Mock the pool.query to throw an error
      (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Expect the function to throw an error
      await expect(getTransactionSummary()).rejects.toThrow('Failed to fetch transaction summary');
    });
  });
});
