// src/app.ts
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import routes from './routes';

// Load environment variables from .env file
dotenv.config();

export const app = express();

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

// Enable CORS with specified options
app.use(cors({
  origin: allowedOrigin,  // Allow requests only from the defined origin
}));

// Middleware to parse JSON request bodies
app.use(express.json());

// Register API routes under the /api prefix
app.use('/api', routes);
