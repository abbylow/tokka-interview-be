import express from 'express';
import { ethers } from 'ethers';
import { syncTransactions } from './services/sync';
import { getTransactions, getTransactionSummary } from './services/transactions';

const router = express.Router();

// GET /health
router.get('/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// POST /transactions 
router.post('/transactions', async (req, res) => {
  try {
    // Destructure query and pagination parameters from the request body
    const { startTimestamp, endTimestamp, txHash, page = 1, limit = 50 } = req.body;

    // Ensure valid numbers for page and limit
    const pageNumber = Number.isNaN(parseInt(page)) ? 1 : Math.max(parseInt(page, 10), 1);
    const pageSize = Number.isNaN(parseInt(limit)) ? 50 : Math.max(Math.min(parseInt(limit, 10), 100), 1); // Max limit = 100

    // Pagination calculation
    const offset = (pageNumber - 1) * pageSize;

    // Fetch transactions with the provided parameters
    const { rows: transactions, totalCount } = await getTransactions(startTimestamp, endTimestamp, txHash, pageSize, offset);

    // Calculate total pages
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

// POST /transactions-summary
router.post('/transactions-summary', async (req, res) => {
  try {
    // Call the service function to get the transaction summary
    const { total_eth_fee, total_usdt_fee } = await getTransactionSummary();

    // Send the response
    res.json({
      totalEthFee: total_eth_fee,
      totalUsdtFee: total_usdt_fee,
    });
  } catch (error) {
    console.error('Error fetching transactions summary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /sync
router.post('/sync', async (req, res) => {
  try {
    const { startBlock, endBlock } = req.body;

    const infuraApiKey = process.env.INFURA_API_KEY;
    if (!infuraApiKey) {
      throw('INFURA_API_KEY is not defined.');
    }
    const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`);

    const startBlockParam = startBlock ? parseInt(startBlock, 10) : 0;
    const endBlockParam = endBlock ? parseInt(endBlock, 10) : await provider.getBlockNumber();;

    // Call the sync service
    const totalTransactions = await syncTransactions(startBlockParam, endBlockParam);

    res.json({ message: 'Transactions synced successfully', total: totalTransactions });
  } catch (error) {
    console.error('Error syncing transactions:', error);
    res.status(500).json({ error });
  }
});

export default router;
