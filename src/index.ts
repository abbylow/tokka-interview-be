import cors from 'cors';
import express from 'express';
import routes from './routes';
// import { startTransactionListener } from './worker';

const app = express();

// enable CORS with specific options (optional)
app.use(cors({
  origin: process.env.ALLOWED_FRONTEND_URL,  // Allow requests only from this origin
  methods: 'GET,POST,PUT,DELETE',   // Allowed HTTP methods
  allowedHeaders: 'Content-Type,Authorization'  // Allowed request headers
}));

const PORT = process.env.PORT || 4242;

// Middleware
app.use(express.json());

// Routes
app.use('/api', routes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
