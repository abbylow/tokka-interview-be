// Interface representing the response structure from the Etherscan API
export interface EtherscanResponse {
  status: string;                  // Status code of the API response (e.g., '1' for success)
  message: string;                 // Message associated with the response (e.g., 'OK')
  result: TokenTransaction[];      // Array of token transactions
}

// Interface defining the structure of a single token transaction
interface TokenTransaction {
  blockNumber: string;             // Block number where the transaction was mined
  timeStamp: string;               // Unix timestamp of the transaction
  hash: string;                    // Transaction hash
  nonce: string;                   // Transaction nonce
  blockHash: string;               // Hash of the block that contains this transaction
  from: string;                    // Address that initiated the transaction
  contractAddress: string;         // Address of the token contract
  to: string;                      // Destination address of the transaction
  value: string;                   // Value transferred in the transaction (as string)
  tokenName: string;               // Name of the token
  tokenSymbol: string;             // Symbol of the token (e.g., "ETH")
  tokenDecimal: string;            // Number of decimals the token uses
  transactionIndex: string;        // Index of the transaction in the block
  gas: string;                     // Gas limit for the transaction
  gasPrice: string;                // Gas price in wei
  gasUsed: string;                 // Actual gas used for the transaction
  cumulativeGasUsed: string;       // Cumulative gas used in the block up to this transaction
  input: string;                   // Input data (if applicable)
  confirmations: string;           // Number of confirmations the transaction has received
}
