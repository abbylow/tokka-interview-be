import { ethers } from 'ethers';
import transactionQueue, { recordTxJobName } from '../queues/transactionQueue';

/**
 * Starts the transaction event listener.
 * Listens for Swap events on the Uniswap pool and publishes transactions to the queue.
 */
export function startTransactionListener() {
  console.log('Event listener is running...');

  const infuraApiKey = process.env.INFURA_API_KEY;
  if (!infuraApiKey) {
    console.error('INFURA_API_KEY is not defined. Exiting.');
    process.exit(1);
  }
  const poolAddress = process.env.UNISWAP_POOL_ADDRESS;
  if (!poolAddress) {
    console.error('UNISWAP_POOL_ADDRESS is not defined. Exiting.');
    process.exit(1);
  }

  // Initialize Ethereum provider and contract instance
  const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${infuraApiKey}`);
  const poolABI = [
    {
      name: "Swap",
      type: "event",
      inputs: [
        { indexed: true, name: "sender", type: "address" },
        { indexed: true, name: "recipient", type: "address" },
        { indexed: false, name: "amount0", type: "int256" },
        { indexed: false, name: "amount1", type: "int256" },
        { indexed: false, name: "sqrtPriceX96", type: "uint160" },
        { indexed: false, name: "liquidity", type: "uint128" },
        { indexed: false, name: "tick", type: "int24" },
      ],
    },
  ];

  const contract = new ethers.Contract(poolAddress, poolABI, provider);

  // Listen for Swap events and process each transaction
  contract.on('Swap', async (sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick, event) => {
    try {
      const txHash = event?.log?.transactionHash;

      if (!txHash) {
        console.error('Transaction hash is undefined.');
        return;
      }
      
      console.log(`Swap event detected! Event tx hash: ${txHash}`);

      // Fetch transaction details from the blockchain
      const txReceipt = await provider.getTransactionReceipt(txHash);
      if (!txReceipt) {
        console.error(`Failed to get transaction receipt for hash: ${txHash}`);
        return;
      }

      const block = await provider.getBlock(txReceipt.blockNumber);
      if (!block) {
        console.error(`Failed to get block details for block number: ${txReceipt.blockNumber}`);
        return;
      }

      // Prepare transaction data and add to the queue
      const transactionData = {
        hash: txReceipt.hash,
        block_number: txReceipt.blockNumber,
        timestamp: block.timestamp,
        gas_used: txReceipt.gasUsed.toString(),
        gas_price: txReceipt.gasPrice?.toString(),
      };

      console.log('Transaction Data:', transactionData);
      await transactionQueue.add(recordTxJobName, transactionData, {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
      });
    } catch (error) {
      console.error('Error processing swap event:', error);
    }
  });

  console.log('Listening for swap events...');
}
