-- Run once against the same Postgres database used by DATABASE_URL.
-- Existing stock/fund rows are kept. Their existing quantity/cost remain valid,
-- and new transactions are recorded from this point onward.
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('STOCK','MF')),
  asset_id NUMERIC NOT NULL,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('BUY','SELL')),
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  fees NUMERIC NOT NULL DEFAULT 0,
  trade_date DATE NOT NULL,
  notes TEXT,
  realized_pnl NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS transactions_asset_idx ON transactions(asset_type, asset_id, trade_date, created_at);


-- Backfill the current aggregate holdings as one opening BUY transaction.
-- The original row creation date is used as the transaction date.
INSERT INTO transactions (asset_type, asset_id, tx_type, quantity, price, trade_date)
SELECT 'STOCK', id, 'BUY', quantity, avg_price, (created_at AT TIME ZONE 'UTC')::date
FROM stocks s
WHERE NOT EXISTS (SELECT 1 FROM transactions t WHERE t.asset_type='STOCK' AND t.asset_id=s.id);

INSERT INTO transactions (asset_type, asset_id, tx_type, quantity, price, trade_date)
SELECT 'MF', id, 'BUY', units, CASE WHEN units <> 0 THEN invested / units ELSE 0 END, (created_at AT TIME ZONE 'UTC')::date
FROM mutual_funds f
WHERE units <> 0
  AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.asset_type='MF' AND t.asset_id=f.id);
