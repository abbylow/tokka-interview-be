import { startTransactionListener } from './transactionListener';
import { transactionWorker } from '../workers/transactionWorker';

// Function to start the transaction-related services
export function initServices() {
  console.log('Starting transaction services...');
  startTransactionListener();
  transactionWorker;  // Ensure the worker is initialized
}
