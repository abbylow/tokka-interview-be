import { ethers } from 'ethers';
import transactionQueue, { recordTxJobName } from '../queues/transactionQueue';

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

  const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${infuraApiKey}`);

  const poolABI = [
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "address", "name": "sender", "type": "address" },
        { "indexed": true, "internalType": "address", "name": "recipient", "type": "address" },
        { "indexed": false, "internalType": "int256", "name": "amount0", "type": "int256" },
        { "indexed": false, "internalType": "int256", "name": "amount1", "type": "int256" },
        { "indexed": false, "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160" },
        { "indexed": false, "internalType": "uint128", "name": "liquidity", "type": "uint128" },
        { "indexed": false, "internalType": "int24", "name": "tick", "type": "int24" }
      ],
      "name": "Swap",
      "type": "event"
    }
  ];

  const contract = new ethers.Contract(poolAddress, poolABI, provider);

  contract.on('Swap', async (sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick, event) => {

    try {
      console.log(`Swap event detected! Event tx hash: ${event.log}`);
      // Fetch transaction details
      const txHash = event.log.transactionHash;

      if (!txHash) {
        console.error('Transaction hash is undefined.');
        return;
      }

      console.log(`Fetching transaction details for hash: ${txHash}`);
      const txReceipt = await provider.getTransactionReceipt(txHash);

      if (!txReceipt) {
        console.error(`Failed to get transaction receipt for hash: ${txHash}`);
        return;
      }

      // Get block details
      const block = await provider.getBlock(txReceipt.blockNumber);
      if (!block) {
        console.error(`Failed to get block details for block number: ${txReceipt.blockNumber}`);
        return;
      }

      // Prepare transaction data
      const transactionData = {
        hash: txReceipt.hash,
        block_number: txReceipt.blockNumber,
        timestamp: block.timestamp,                 // Unix timestamp of the block
        gas_used: txReceipt.gasUsed.toString(),      // Gas used
        gas_price: txReceipt.gasPrice?.toString()  //  Gas price in wei
      };

      console.log('Transaction Data:', transactionData);

      // Add transaction data to BullMQ
      await transactionQueue.add(recordTxJobName, transactionData);

    } catch (error) {
      console.error('Error processing swap event:', error);
    }

  });

  console.log('Listening for swap events...');

}