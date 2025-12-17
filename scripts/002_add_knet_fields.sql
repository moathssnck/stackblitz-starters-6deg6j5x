-- Add KNET-specific fields to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS payment_gateway_response JSONB,
ADD COLUMN IF NOT EXISTS recharge_data JSONB;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_status ON transactions(user_id, status);

-- Create a table for payment gateway configurations (optional, for future use)
CREATE TABLE IF NOT EXISTS payment_gateways (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  gateway_type TEXT NOT NULL CHECK (gateway_type IN ('knet', 'credit_card', 'wallet')),
  is_active BOOLEAN DEFAULT true,
  configuration JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert KNET configuration
INSERT INTO payment_gateways (name, gateway_type, configuration)
VALUES (
  'KNET',
  'knet',
  '{"currency": "KWD", "merchant_id": "YOUR_MERCHANT_ID", "terminal_id": "YOUR_TERMINAL_ID"}'::JSONB
)
ON CONFLICT DO NOTHING;
