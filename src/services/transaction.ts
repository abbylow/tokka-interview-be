import { pool } from '../db';

// Fetch transactions with optional filters, pagination, and total count
export async function getTransactions(
  startTimestamp?: string,
  endTimestamp?: string,
  txHash?: string,
  limit: number = 10,
  offset: number = 0
) {
  // Construct the main query to fetch transactions
  let query = `
    SELECT
      id,
      hash,
      block_number,
      timestamp,
      gas_used,
      gas_price,
      eth_price_at_tx,
      processed_at,
      eth_fee,                 -- Fetch stored eth_fee
      usdt_fee                 -- Fetch stored usdt_fee
    FROM transactions
    WHERE 1=1
  `;
  const params: any[] = [];

  // Apply filters to the query
  if (startTimestamp) {
    params.push(startTimestamp);
    query += ` AND timestamp >= $${params.length}`;
  }

  if (endTimestamp) {
    params.push(endTimestamp);
    query += ` AND timestamp <= $${params.length}`;
  }

  if (txHash) {
    params.push(txHash);
    query += ` AND hash = $${params.length}`;
  }

  // Add pagination to the query
  query += ' ORDER BY timestamp DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(limit, offset);

  // Execute the main query
  const { rows } = await pool.query(query, params);

  // Construct and execute the query to get the total count of filtered transactions
  let countQuery = 'SELECT COUNT(*) FROM transactions WHERE 1=1';
  if (startTimestamp || endTimestamp || txHash) {
    countQuery += query.substring(query.indexOf('AND'), query.indexOf('ORDER BY'));
  }
  const countParams = params.slice(0, params.length - 2); // Remove pagination parameters from the count query
  const { rows: countResult } = await pool.query(countQuery, countParams);
  const totalCount = parseInt(countResult[0].count, 10);

  return { rows, totalCount };
}
