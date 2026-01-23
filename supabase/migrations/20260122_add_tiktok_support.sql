-- Migration: Add TikTok support
-- This adds TikTok as a supported platform for social connections and conversations

-- Step 1: Drop the existing CHECK constraint on social_connections.platform
ALTER TABLE social_connections DROP CONSTRAINT IF EXISTS social_connections_platform_check;

-- Step 2: Add new CHECK constraint including 'tiktok'
ALTER TABLE social_connections ADD CONSTRAINT social_connections_platform_check
  CHECK (platform IN ('instagram', 'facebook', 'whatsapp', 'tiktok'));

-- Step 3: Add customer_tiktok_id column to conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_tiktok_id TEXT;

-- Step 4: Create index for TikTok customer lookups
CREATE INDEX IF NOT EXISTS idx_conversations_customer_tiktok_id
  ON conversations(customer_tiktok_id)
  WHERE customer_tiktok_id IS NOT NULL;

-- Step 5: Add comment for documentation
COMMENT ON COLUMN conversations.customer_tiktok_id IS 'TikTok user ID for conversations coming from TikTok DMs';
