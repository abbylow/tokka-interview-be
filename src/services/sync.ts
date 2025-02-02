import fetch from 'node-fetch';
import { EtherscanResponse } from '../types/etherscan';
import transactionQueue, { recordTxJobName } from '../queues/transactionQueue';

// Number of items to fetch per batch from the Etherscan API (max: 10k)
const numOfItemsPerBatch = 10000;

/**
 * Interface defining the structure of a transaction
 * hash: transaction hash
 * block_number: block number where the transaction was mined
 * timestamp: Unix timestamp of the block
 * gas_used: gas used by the transaction
 * gas_price: gas price in wei
 * 
 */
interface TransactionData {
  hash: string;
  block_number: number;
  timestamp: number;
  gas_used: string;
  gas_price: string;
}

/**
 * Filters out duplicate transactions by hash.
 * @param transactions Array of transaction data
 * @returns An array of unique transactions
 */
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

/**
 * Fetches token transactions from the Etherscan API within a block range.
 * @param poolAddress Pool smart contract address
 * @param startBlock Starting block number
 * @param endBlock Ending block number
 * @returns Array of transaction data from Etherscan
 */
export async function fetchTokenTransactions(poolAddress: string, startBlock: number, endBlock: number) {

  const etherscanApi = process.env.ETHERSCAN_API_KEY;
  if (!etherscanApi) throw new Error('ETHERSCAN_API_KEY is not defined.');


  const url = `https://api.etherscan.io/api?module=account&action=tokentx&address=${poolAddress}&page=1&offset=${numOfItemsPerBatch}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${etherscanApi}`;
  console.log("Fetch txns from Etherscan: ", url);

  // Fetch data from the API
  const response = await fetch(url);
  const data = await response.json() as EtherscanResponse;

  // Handle API errors
  if (data.status !== '1') {
    throw new Error(`Etherscan API error: ${data.message}`);
  }

  return data.result;
}

/**
 * Synchronizes transactions within a specified block range.
 * @param poolAddress Pool smart contract address
 * @param startBlock Starting block number
 * @param endBlock Ending block number
 * @returns The total number of synchronized transactions
 */
export async function syncTransactions(poolAddress: string, startBlock: number, endBlock: number): Promise<number> {
  let currentStartBlock = startBlock;
  let totalSynced = 0;

  try {
    while (true) {
      console.log(`Fetching transactions from block ${currentStartBlock} to ${endBlock}...`);

      // Fetch transactions from Etherscan
      const transactions = await fetchTokenTransactions(poolAddress, currentStartBlock, endBlock);

      // Exit loop if no more transactions
      if (transactions.length === 0) {
        console.log('No more transactions found.');
        break;
      }

      // Map and filter transactions to remove duplicates
      const processedTxns = transactions.map(tx => ({
        hash: tx.hash,
        block_number: parseInt(tx.blockNumber, 10),
        timestamp: parseInt(tx.timeStamp, 10),
        gas_used: tx.gasUsed,
        gas_price: tx.gasPrice,
      }));
      const filteredTxns = filterUniqueTransactions(processedTxns);

      // Add each transaction to the queue
      for (const tx of filteredTxns) {
        await transactionQueue.add(recordTxJobName, tx, {
          attempts: 5,         // Retry up to 5 times on failure
          backoff: {
            type: 'exponential',  // Exponential backoff between retries
            delay: 5000,          // Initial delay of 5 seconds
          },
        });
      }

      totalSynced += transactions.length;

      // Stop fetching if fewer items than the batch size are returned
      if (transactions.length < numOfItemsPerBatch) break;

      // Update start block for the next batch
      currentStartBlock = parseInt(transactions[transactions.length - 1].blockNumber, 10) + 1;
    }
  } catch (error) {
    console.error('Error syncing transactions:', error);
  }

  console.log(`Sync complete. Total transactions synced: ${totalSynced} and ended at block: ${currentStartBlock}`);
  return totalSynced;
}
