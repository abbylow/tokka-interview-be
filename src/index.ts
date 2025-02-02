import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import routes from './routes';
import { startTransactionListener } from './services/transactionListener';
import { transactionWorker } from './workers/transactionWorker';

// Load environment variables from .env file
dotenv.config();

const app = express();

const PORT = process.env.PORT || 4242;
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

// Enable CORS with specified options
app.use(cors({
  origin: allowedOrigin,  // Allow requests only from the defined origin
}));

// Middleware to parse JSON request bodies
app.use(express.json());

// Register API routes under the /api prefix
app.use('/api', routes);

// Start the transaction listener (for blockchain events)
startTransactionListener();

// Start the transaction worker process
transactionWorker;

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
