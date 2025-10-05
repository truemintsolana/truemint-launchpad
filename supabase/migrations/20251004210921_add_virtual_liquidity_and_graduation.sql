/*
  # Add Virtual Liquidity and Graduation Mechanism

  1. Changes to Tokens Table
    - Add `virtual_sol_reserves` to track SOL in virtual pool
    - Add `virtual_token_reserves` to track tokens in virtual pool
    - Add `is_graduated` flag to indicate if token has moved to DEX
    - Add `graduated_at` timestamp for when token graduated
    - Add `dex_pool_address` for the real DEX pool address
    - Remove `initial_liquidity` as it's no longer needed

  2. New Table: Bundle Events
    - Track when tokens graduate to DEX
    - Record market cap at bundle time
    - Track SOL moved to DEX
    - Record platform fee collected ($100)
    - Store bundle transaction signature

  3. Security
    - Enable RLS on bundle_events table
    - Add policies for authenticated users to view bundle events
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tokens' AND column_name = 'virtual_sol_reserves'
  ) THEN
    ALTER TABLE tokens ADD COLUMN virtual_sol_reserves numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tokens' AND column_name = 'virtual_token_reserves'
  ) THEN
    ALTER TABLE tokens ADD COLUMN virtual_token_reserves numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tokens' AND column_name = 'is_graduated'
  ) THEN
    ALTER TABLE tokens ADD COLUMN is_graduated boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tokens' AND column_name = 'graduated_at'
  ) THEN
    ALTER TABLE tokens ADD COLUMN graduated_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tokens' AND column_name = 'dex_pool_address'
  ) THEN
    ALTER TABLE tokens ADD COLUMN dex_pool_address text;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS bundle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES tokens(id) NOT NULL,
  market_cap_at_bundle numeric NOT NULL,
  sol_to_dex numeric NOT NULL,
  platform_fee_collected numeric NOT NULL,
  bundle_transaction text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bundle_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bundle_events' AND policyname = 'Users can view all bundle events'
  ) THEN
    CREATE POLICY "Users can view all bundle events"
      ON bundle_events
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;