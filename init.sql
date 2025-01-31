CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    timestamp BIGINT NOT NULL,
    gas_used NUMERIC(32, 0) NOT NULL,
    gas_price NUMERIC(32, 0) NOT NULL,
    eth_price_at_tx NUMERIC(32, 6) NOT NULL,
    eth_fee NUMERIC(32, 18) GENERATED ALWAYS AS (gas_used * gas_price / 1e18) STORED,  -- ETH fee stored value
    usdt_fee NUMERIC(32, 6) GENERATED ALWAYS AS ((gas_used * gas_price / 1e18) * eth_price_at_tx) STORED, -- USDT fee stored value
    processed_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_hash ON transactions (hash);
CREATE INDEX IF NOT EXISTS idx_timestamp ON transactions (timestamp);
CREATE INDEX IF NOT EXISTS idx_block_number ON transactions (block_number);
