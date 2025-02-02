import { Pool } from 'pg';

// Initialize PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Handle unexpected errors on idle database clients
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});
