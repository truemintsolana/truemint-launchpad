/*
  # Add Token Creation Fee Tracking

  1. Changes
    - Add `creation_fee_paid` column to tokens table to track if $1 fee was paid
    - Add `creation_fee_transaction` column to store transaction signature
    - Add `creation_fees` table to track all creation fee payments

  2. New Table
    - `creation_fees`
      - Tracks all $1 token creation fee payments
      - Links to token and creator wallet
      - Stores transaction signature and amount

  3. Security
    - Enable RLS on creation_fees table
    - Public read access for transparency
*/

-- Add creation fee tracking to tokens table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tokens' AND column_name = 'creation_fee_paid'
  ) THEN
    ALTER TABLE tokens ADD COLUMN creation_fee_paid boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tokens' AND column_name = 'creation_fee_transaction'
  ) THEN
    ALTER TABLE tokens ADD COLUMN creation_fee_transaction text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tokens' AND column_name = 'creation_fee_amount'
  ) THEN
    ALTER TABLE tokens ADD COLUMN creation_fee_amount bigint DEFAULT 0;
  END IF;
END $$;

-- Create creation fees tracking table
CREATE TABLE IF NOT EXISTS creation_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES tokens(id) ON DELETE CASCADE,
  creator_wallet text NOT NULL,
  transaction_signature text UNIQUE NOT NULL,
  fee_amount_lamports bigint NOT NULL,
  fee_amount_usd numeric DEFAULT 1.00,
  paid_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_creation_fees_token ON creation_fees(token_id);
CREATE INDEX IF NOT EXISTS idx_creation_fees_creator ON creation_fees(creator_wallet);

-- Enable Row Level Security
ALTER TABLE creation_fees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creation_fees
CREATE POLICY "Creation fees are viewable by everyone"
  ON creation_fees FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Creation fees can be created by authenticated users"
  ON creation_fees FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update platform config to include creation fee wallet
INSERT INTO platform_config (config_key, config_value) VALUES
  ('creation_fee_settings', '{"fee_amount_usd": 1.00, "fee_wallet": null}'::jsonb)
ON CONFLICT (config_key) DO NOTHING;