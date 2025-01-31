import fetch from 'node-fetch';
import { EtherscanResponse } from '../types/etherscan';
import transactionQueue, { recordTxJobName } from '../queues/transactionQueue';

const numOfItemsPerBatch = 10000;

interface TransactionData {
  hash: string;           // Transaction hash
  block_number: number;   // Block number where the transaction was mined
  timestamp: number;      // Unix timestamp of the block
  gas_used: string;       // Gas used by the transaction (as string to handle large values)
  gas_price?: string;     // Gas price in wei (optional, as it may be undefined)
};

function filterUniqueTransactions(transactions: TransactionData[]) {
  const uniqueTransactions = [];
  const seenHashes = new Set();

  for (const txn of transactions) {
    if (!seenHashes.has(txn.hash)) {
      uniqueTransactions.push(txn);
      seenHashes.add(txn.hash);
    }
  }

  return uniqueTransactions;
}

// Fetch token transactions from Etherscan API
async function fetchTokenTransactions(startBlock: number, endBlock: number) {
  const poolAddress = process.env.UNISWAP_POOL_ADDRESS;
  if (!poolAddress) {
    throw ('UNISWAP_POOL_ADDRESS is not defined.');
  }

  const etherscanApi = process.env.ETHERSCAN_API_KEY;
  if (!etherscanApi) {
    throw ('ETHERSCAN_API_KEY is not defined.');
  }

  const url = `https://api.etherscan.io/api?module=account&action=tokentx&address=${poolAddress}&page=1&offset=${numOfItemsPerBatch}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${etherscanApi}`;
  console.log(url)
  const response = await fetch(url);
  const data = await response.json() as EtherscanResponse;

  if (data.status !== '1') {
    throw new Error(`Etherscan API error: ${data.message}`);
  }

  return data.result;
}

// Sync transactions between block range
export async function syncTransactions(startBlock: number, endBlock: number): Promise<number> {
  let currentStartBlock = startBlock;
  let totalSynced = 0;

  try {
    while (true) {
      console.log(`Fetching transactions from block ${currentStartBlock} to ${endBlock}...`);

      // Fetch transactions
      const transactions = await fetchTokenTransactions(currentStartBlock, endBlock);

      if (transactions.length === 0) {
        console.log('No more transactions found.');
        break;
      }

      // Process tx and filter if the same hash if the same
      const processedTxns = transactions.map(tx => {
        return {
          hash: tx.hash,
          block_number: parseInt(tx.blockNumber, 10),
          timestamp: parseInt(tx.timeStamp, 10),
          gas_used: tx.gasUsed,
          gas_price: tx.gasPrice
        }
      })
      const filteredTxns = filterUniqueTransactions(processedTxns);

      for (const tx of filteredTxns) {
        // console.log('Publishing transaction:', tx);

        // Publish message to the queue
        await transactionQueue.add(recordTxJobName, tx, {
          attempts: 5,         // Retry up to 5 times if the task fails
          backoff: {
            type: 'exponential',  // Use exponential backoff between retries
            delay: 5000,          // Start with a 5-second delay
          },
        });
      }

      totalSynced += transactions.length;

      // Check if more data might exist
      if (transactions.length < numOfItemsPerBatch) {
        break;  // No more data to fetch
      }

      // Update currentStartBlock to the last transaction's block number
      currentStartBlock = parseInt(transactions[transactions.length - 1].blockNumber, 10) + 1;
    }
  } catch (error) {
    console.error('Error fetch historical transactions:', error);
  }
  console.log(`Sync complete. Total transactions synced: ${totalSynced} and ended at block: ${currentStartBlock}`);
  return totalSynced;
}
