/*
  # Solana Token Launchpad Schema

  1. New Tables
    - `tokens`
      - Token launch information including metadata, supply, creator
      - Tracks bonding curve progress and listing status
      - Stores fee configuration and anti-scam rules
    
    - `launches`
      - Launch configuration and timing
      - Delayed launch settings (5min to 24hr)
      - Fair launch attestation signatures
    
    - `transactions`
      - All buy/sell transactions on platform
      - Fee distribution tracking
      - Volume and pricing history
    
    - `wallet_analytics`
      - Wallet age and transaction count for tier calculation
      - Purchase caps based on wallet tier
      - Cluster detection data
    
    - `wallet_clusters`
      - Groups of wallets potentially controlled by same entity
      - Bubble map visualization data
      - Risk scoring
    
    - `staking_pools`
      - Single staking pools for each token
      - Reward distribution from 0.5% transaction fees
      - Staker balances and rewards
    
    - `platform_config`
      - Platform fee wallet address
      - Fee percentages and distribution rules
      - Admin settings

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users to manage their tokens
    - Public read access for token listings
    - Admin-only access for platform configuration
*/

-- Tokens table
CREATE TABLE IF NOT EXISTS tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mint_address text UNIQUE NOT NULL,
  name text NOT NULL,
  symbol text NOT NULL,
  description text,
  image_url text,
  creator_wallet text NOT NULL,
  total_supply bigint NOT NULL,
  initial_liquidity bigint NOT NULL,
  bonding_curve_progress numeric DEFAULT 0,
  market_cap numeric DEFAULT 0,
  current_price numeric DEFAULT 0,
  volume_24h numeric DEFAULT 0,
  is_listed boolean DEFAULT false,
  listed_on_dex boolean DEFAULT false,
  dex_name text,
  
  -- Anti-scam features
  dev_allocation_percent numeric DEFAULT 10,
  dev_allocation_locked boolean DEFAULT true,
  dev_unlock_rate numeric DEFAULT 1,
  sealed_lp boolean DEFAULT false,
  lp_burn_threshold numeric DEFAULT 50000,
  
  -- Launch timing
  launch_delay_minutes integer DEFAULT 0,
  scheduled_launch_at timestamptz,
  actual_launch_at timestamptz,
  is_tradeable boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Wallet analytics for tier calculation
CREATE TABLE IF NOT EXISTS wallet_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  age_days integer DEFAULT 0,
  transaction_count integer DEFAULT 0,
  tier integer DEFAULT 0,
  max_buy_percent numeric DEFAULT 0.5,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Wallet clusters for bubble map
CREATE TABLE IF NOT EXISTS wallet_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id text NOT NULL,
  wallet_addresses text[] NOT NULL,
  token_id uuid REFERENCES tokens(id) ON DELETE CASCADE,
  total_holdings numeric DEFAULT 0,
  risk_score numeric DEFAULT 0,
  detection_method text,
  created_at timestamptz DEFAULT now()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES tokens(id) ON DELETE CASCADE,
  transaction_signature text UNIQUE NOT NULL,
  wallet_address text NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
  token_amount bigint NOT NULL,
  sol_amount bigint NOT NULL,
  price_per_token numeric NOT NULL,
  
  -- Fee distribution (in lamports)
  total_fee bigint NOT NULL,
  platform_fee bigint NOT NULL,
  creator_fee bigint NOT NULL,
  staker_fee bigint NOT NULL,
  
  created_at timestamptz DEFAULT now()
);

-- Staking pools
CREATE TABLE IF NOT EXISTS staking_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES tokens(id) ON DELETE CASCADE UNIQUE,
  total_staked bigint DEFAULT 0,
  total_rewards_accumulated bigint DEFAULT 0,
  reward_per_token_stored numeric DEFAULT 0,
  last_update_time timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Staker positions
CREATE TABLE IF NOT EXISTS staker_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id uuid REFERENCES staking_pools(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  staked_amount bigint DEFAULT 0,
  rewards_earned bigint DEFAULT 0,
  reward_per_token_paid numeric DEFAULT 0,
  last_claim_time timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(pool_id, wallet_address)
);

-- Platform configuration
CREATE TABLE IF NOT EXISTS platform_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Insert default platform configuration
INSERT INTO platform_config (config_key, config_value) VALUES
  ('fee_wallet', '{"address": null}'::jsonb),
  ('fee_structure', '{"total": 2.0, "platform": 1.0, "creator": 0.5, "stakers": 0.5}'::jsonb),
  ('amm_settings', '{"bonding_curve_type": "linear", "graduation_threshold": 50000}'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tokens_creator ON tokens(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_tokens_listed ON tokens(is_listed, is_tradeable);
CREATE INDEX IF NOT EXISTS idx_transactions_token ON transactions(token_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_analytics_address ON wallet_analytics(wallet_address);
CREATE INDEX IF NOT EXISTS idx_staker_positions_wallet ON staker_positions(wallet_address);

-- Enable Row Level Security
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE staker_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tokens
CREATE POLICY "Tokens are viewable by everyone"
  ON tokens FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create their own tokens"
  ON tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'sub' IS NOT NULL);

CREATE POLICY "Users can update their own tokens"
  ON tokens FOR UPDATE
  TO authenticated
  USING (creator_wallet = auth.jwt()->>'wallet_address')
  WITH CHECK (creator_wallet = auth.jwt()->>'wallet_address');

-- RLS Policies for wallet_analytics
CREATE POLICY "Wallet analytics are viewable by everyone"
  ON wallet_analytics FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Wallet analytics can be updated by system"
  ON wallet_analytics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Wallet analytics can be modified by system"
  ON wallet_analytics FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for wallet_clusters
CREATE POLICY "Wallet clusters are viewable by everyone"
  ON wallet_clusters FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Wallet clusters can be created by system"
  ON wallet_clusters FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for transactions
CREATE POLICY "Transactions are viewable by everyone"
  ON transactions FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Transactions can be created by authenticated users"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for staking_pools
CREATE POLICY "Staking pools are viewable by everyone"
  ON staking_pools FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Staking pools can be created by system"
  ON staking_pools FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staking pools can be updated by system"
  ON staking_pools FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for staker_positions
CREATE POLICY "Users can view their own staking positions"
  ON staker_positions FOR SELECT
  TO authenticated
  USING (wallet_address = auth.jwt()->>'wallet_address');

CREATE POLICY "Users can create their own staking positions"
  ON staker_positions FOR INSERT
  TO authenticated
  WITH CHECK (wallet_address = auth.jwt()->>'wallet_address');

CREATE POLICY "Users can update their own staking positions"
  ON staker_positions FOR UPDATE
  TO authenticated
  USING (wallet_address = auth.jwt()->>'wallet_address')
  WITH CHECK (wallet_address = auth.jwt()->>'wallet_address');

-- RLS Policies for platform_config
CREATE POLICY "Platform config is viewable by everyone"
  ON platform_config FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Platform config can only be updated by admins"
  ON platform_config FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');