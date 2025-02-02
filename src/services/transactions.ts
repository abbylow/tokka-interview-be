import { pool } from '../db';

/**
 * Fetch transactions with optional filters, pagination, and total count.
 * @param startTimestamp - The start of the timestamp range (optional).
 * @param endTimestamp - The end of the timestamp range (optional).
 * @param txHash - The transaction hash to filter by (optional).
 * @param limit - The maximum number of transactions to return per page (default: 10).
 * @param offset - The offset for pagination, indicating where to start (default: 0).
 * @returns An object containing the filtered transaction rows and the total count of matching transactions.
 */
export async function getTransactions(
  startTimestamp?: string,
  endTimestamp?: string,
  txHash?: string,
  limit: number = 10,
  offset: number = 0
) {
  // Construct the main query to fetch transaction data
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
      eth_fee,                 -- Pre-calculated stored value for the ETH fee
      usdt_fee                 -- Pre-calculated stored value for the USDT fee
    FROM transactions
    WHERE 1=1
  `;
  const params: any[] = [];

  // Apply optional timestamp and hash filters
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

  // Execute the main query to fetch transaction rows
  const { rows } = await pool.query(query, params);

  // Construct the count query to get the total number of matching transactions
  let countQuery = 'SELECT COUNT(*) FROM transactions WHERE 1=1 ';
  if (startTimestamp || endTimestamp || txHash) {
    countQuery += query.substring(query.indexOf('AND'), query.indexOf('ORDER BY')); // Include filters from the main query
  }

  // Remove pagination parameters from the count query
  const countParams = params.slice(0, params.length - 2);
  
  // Execute the count query to get the total number of transactions
  const { rows: countResult } = await pool.query(countQuery, countParams);
  const totalCount = parseInt(countResult[0].count, 10);

  // Return the fetched transactions and total count
  return { rows, totalCount };
}

/**
 * Retrieve the summary of transaction fees, including the total ETH and USDT fees.
 * @returns An object containing the total ETH and USDT transaction fees.
 */
export async function getTransactionSummary() {
  const query = `
    SELECT
      COALESCE(SUM(eth_fee), 0) AS total_eth_fee,    -- Ensure a zero value is returned if there are no transactions
      COALESCE(SUM(usdt_fee), 0) AS total_usdt_fee   -- Ensure a zero value is returned if there are no transactions
    FROM transactions;
  `;

  try {
    // Execute the query to fetch the total fee summary
    const { rows } = await pool.query(query);
    return rows[0]; // Return the result containing the total fees
  } catch (error) {
    console.error('Error fetching transaction summary:', error);
    throw new Error('Failed to fetch transaction summary');
  }
}
