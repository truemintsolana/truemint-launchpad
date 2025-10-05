/*
  # Add Social Links to Tokens Table

  1. Changes
    - Add `twitter_url` column to tokens table for Twitter/X profile links
    - Add `telegram_url` column to tokens table for Telegram group/channel links

  2. Notes
    - Both fields are optional (nullable) to maintain backward compatibility
    - Uses text type for flexible URL storage
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tokens' AND column_name = 'twitter_url'
  ) THEN
    ALTER TABLE tokens ADD COLUMN twitter_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tokens' AND column_name = 'telegram_url'
  ) THEN
    ALTER TABLE tokens ADD COLUMN telegram_url text;
  END IF;
END $$;