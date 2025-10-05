import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export type Token = {
  id: string;
  mint_address: string;
  name: string;
  symbol: string;
  description: string | null;
  image_url: string | null;
  twitter_url?: string | null;
  telegram_url?: string | null;
  creator_wallet: string;
  total_supply: number;
  virtual_sol_reserves?: number;
  virtual_token_reserves?: number;
  is_graduated?: boolean;
  graduated_at?: string | null;
  dex_pool_address?: string | null;
  bonding_curve_progress: number;
  market_cap: number;
  current_price: number;
  volume_24h: number;
  is_listed: boolean;
  listed_on_dex: boolean;
  dex_name: string | null;
  dev_allocation_percent: number;
  dev_allocation_locked: boolean;
  dev_unlock_rate: number;
  sealed_lp: boolean;
  lp_burn_threshold: number;
  launch_delay_minutes: number;
  scheduled_launch_at: string | null;
  actual_launch_at: string | null;
  is_tradeable: boolean;
  creation_fee_paid: boolean;
  creation_fee_transaction: string | null;
  creation_fee_amount: number;
  created_at: string;
  updated_at: string;
};

export type WalletAnalytics = {
  id: string;
  wallet_address: string;
  age_days: number;
  transaction_count: number;
  tier: number;
  max_buy_percent: number;
  last_updated: string;
  created_at: string;
};

export type Transaction = {
  id: string;
  token_id: string;
  transaction_signature: string;
  wallet_address: string;
  transaction_type: 'buy' | 'sell';
  token_amount: number;
  sol_amount: number;
  price_per_token: number;
  total_fee: number;
  platform_fee: number;
  creator_fee: number;
  staker_fee: number;
  created_at: string;
};

export type WalletCluster = {
  id: string;
  cluster_id: string;
  wallet_addresses: string[];
  token_id: string;
  total_holdings: number;
  risk_score: number;
  detection_method: string | null;
  created_at: string;
};

export type StakingPool = {
  id: string;
  token_id: string;
  total_staked: number;
  total_rewards_accumulated: number;
  reward_per_token_stored: number;
  last_update_time: string;
  created_at: string;
};

export type StakerPosition = {
  id: string;
  pool_id: string;
  wallet_address: string;
  staked_amount: number;
  rewards_earned: number;
  reward_per_token_paid: number;
  last_claim_time: string;
  created_at: string;
};

export type CreationFee = {
  id: string;
  token_id: string;
  creator_wallet: string;
  transaction_signature: string;
  fee_amount_lamports: number;
  fee_amount_usd: number;
  paid_at: string;
  created_at: string;
};

export type AdminWallet = {
  id: string;
  wallet_address: string;
  name: string | null;
  description: string | null;
  added_at: string;
  added_by: string | null;
};

export type BundleEvent = {
  id: string;
  token_id: string;
  market_cap_at_bundle: number;
  sol_to_dex: number;
  platform_fee_collected: number;
  bundle_transaction: string;
  created_at: string;
};
