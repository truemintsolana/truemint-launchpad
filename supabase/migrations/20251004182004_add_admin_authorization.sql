/*
  # Add Admin Authorization System

  1. New Tables
    - `admin_wallets`
      - Stores authorized admin wallet addresses
      - Only these wallets can modify platform configuration
      - Includes name/description for each admin

  2. Security
    - Enable RLS on `admin_wallets` table
    - Public read access to check if wallet is admin (for UI purposes)
    - Only existing admins can add/remove other admins
    - Update `platform_config` RLS to require admin authorization

  3. Initial Setup
    - Creates the admin_wallets table
    - You'll need to manually insert your first admin wallet address
*/

-- Create admin wallets table
CREATE TABLE IF NOT EXISTS admin_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  name text,
  description text,
  added_at timestamptz DEFAULT now(),
  added_by text
);

-- Enable RLS
ALTER TABLE admin_wallets ENABLE ROW LEVEL SECURITY;

-- Public read policy - anyone can check if a wallet is an admin
CREATE POLICY "Anyone can check admin status"
  ON admin_wallets
  FOR SELECT
  TO public
  USING (true);

-- Only admins can insert new admins
CREATE POLICY "Admins can add other admins"
  ON admin_wallets
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_wallets
      WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    )
  );

-- Only admins can delete admins
CREATE POLICY "Admins can remove admins"
  ON admin_wallets
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM admin_wallets
      WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    )
  );

-- Drop existing platform_config policies if they exist
DROP POLICY IF EXISTS "Anyone can view platform config" ON platform_config;
DROP POLICY IF EXISTS "Anyone can update platform config" ON platform_config;

-- Recreate platform_config policies with admin-only access
CREATE POLICY "Anyone can view platform config"
  ON platform_config
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can update platform config"
  ON platform_config
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM admin_wallets
      WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_wallets
      WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    )
  );

CREATE POLICY "Only admins can insert platform config"
  ON platform_config
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_wallets
      WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    )
  );

-- Create helper function to check if wallet is admin
CREATE OR REPLACE FUNCTION is_admin(wallet_addr text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_wallets
    WHERE wallet_address = wallet_addr
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;