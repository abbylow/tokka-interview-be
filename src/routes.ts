import express from 'express';
import { ethers } from 'ethers';
import { syncTransactions } from './services/sync';
import { getTransactions, getTransactionSummary } from './services/transactions';

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check server health
 *     description: Returns a message indicating that the server is running.
 *     responses:
 *       200:
 *         description: Server is healthy.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Get filtered transactions with pagination
 *     description: Fetch transactions based on filters and return paginated results.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startTimestamp:
 *                 type: string
 *                 description: The start of the timestamp range (UNIX format).
 *               endTimestamp:
 *                 type: string
 *                 description: The end of the timestamp range (UNIX format).
 *               txHash:
 *                 type: string
 *                 description: The transaction hash to filter by.
 *               page:
 *                 type: integer
 *                 description: The page number for pagination.
 *               limit:
 *                 type: integer
 *                 description: The number of results per page.
 *     responses:
 *       200:
 *         description: List of transactions with pagination info.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentPage:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 totalCount:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.post('/transactions', async (req, res) => {
  try {
    const { startTimestamp, endTimestamp, txHash, page = 1, limit = 50 } = req.body;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(Math.min(parseInt(limit, 10) || 50, 100), 1); // Max limit = 100

    const offset = (pageNumber - 1) * pageSize;

    // Fetch transactions and total count
    const { rows: transactions, totalCount } = await getTransactions(startTimestamp, endTimestamp, txHash, pageSize, offset);
    const totalPages = Math.ceil(totalCount / pageSize);

    res.json({
      currentPage: pageNumber,
      pageSize,
      totalCount,
      totalPages,
      transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /api/transactions-summary:
 *   post:
 *     summary: Get a summary of transaction fees
 *     description: Fetches the total transaction fees in ETH and USDT.
 *     responses:
 *       200:
 *         description: Transaction summary with total fees.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEthFee:
 *                   type: number
 *                   description: Total transaction fee in ETH.
 *                 totalUsdtFee:
 *                   type: number
 *                   description: Total transaction fee in USDT.
 */
router.post('/transactions-summary', async (req, res) => {
  try {
    const { total_eth_fee, total_usdt_fee } = await getTransactionSummary();
    res.json({
      totalEthFee: total_eth_fee,
      totalUsdtFee: total_usdt_fee,
    });
  } catch (error) {
    console.error('Error fetching transactions summary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /api/sync:
 *   post:
 *     summary: Sync transactions by block range
 *     description: Sync transactions from the blockchain within a specified block range.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startBlock:
 *                 type: integer
 *                 description: The starting block number.
 *               endBlock:
 *                 type: integer
 *                 description: The ending block number.
 *     responses:
 *       200:
 *         description: Sync completed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 total:
 *                   type: integer
 *                   description: The total number of synced transactions.
 */
router.post('/sync', async (req, res) => {
  try {
    const { startBlock, endBlock } = req.body;

    const infuraApiKey = process.env.INFURA_API_KEY;
    if (!infuraApiKey) {
      throw new Error('INFURA_API_KEY is not defined.');
    }

    const poolAddress = process.env.UNISWAP_POOL_ADDRESS;
    if (!poolAddress) throw new Error('UNISWAP_POOL_ADDRESS is not defined.');

    const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${infuraApiKey}`);
    const startBlockParam = startBlock ? parseInt(startBlock, 10) : 0;
    const endBlockParam = endBlock ? parseInt(endBlock, 10) : await provider.getBlockNumber();

    const totalTransactions = await syncTransactions(poolAddress, startBlockParam, endBlockParam);
    res.json({ message: 'Transactions synced successfully', total: totalTransactions });
  } catch (error) {
    console.error('Error syncing transactions:', error);
    res.status(500).json({ error: error });
  }
});

export default router;
