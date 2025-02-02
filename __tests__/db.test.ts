import { Pool } from 'pg';

jest.mock('pg', () => {
  const actualPg = jest.requireActual('pg');
  return {
    ...actualPg,
    Pool: jest.fn().mockImplementation(() => ({
      query: jest.fn(),
      on: jest.fn(),
    })),
  };
});

describe('PostgreSQL Connection Pool', () => {
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    // Set environment variable before initializing the pool
    process.env.DATABASE_URL = 'postgres://user:password@localhost:5432/testdb';

    // Import and initialize pool here to apply the mock
    const { pool } = require('../src/db');
    mockPool = pool as jest.Mocked<Pool>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize the pool with the correct connection string', () => {
    expect(Pool).toHaveBeenCalledWith({
      connectionString: process.env.DATABASE_URL,
    });
  });
});
