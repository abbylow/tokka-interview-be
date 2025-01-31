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

// enable CORS with specific options (optional)
app.use(cors({
  origin: allowedOrigin,  // Allow requests only from this origin
}));

// Middleware
app.use(express.json());

// Routes
app.use('/api', routes);

// Start the event listener
startTransactionListener();

// Start the worker within the Express app process
transactionWorker;  

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
