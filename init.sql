CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    timestamp BIGINT NOT NULL,
    gas_used NUMERIC(32, 0) NOT NULL,
    gas_price NUMERIC(32, 0) NOT NULL,
    eth_price_at_tx NUMERIC(32, 6) NOT NULL,
    processed_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_hash ON transactions (hash);
CREATE INDEX IF NOT EXISTS idx_timestamp ON transactions (timestamp);
CREATE INDEX IF NOT EXISTS idx_block_number ON transactions (block_number);
