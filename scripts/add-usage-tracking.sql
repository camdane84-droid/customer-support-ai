-- Add usage tracking columns to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS ai_suggestions_used_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_suggestions_reset_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS conversations_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversations_reset_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_tier ON businesses(subscription_tier);
