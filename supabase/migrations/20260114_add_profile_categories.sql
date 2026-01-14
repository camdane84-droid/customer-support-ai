-- Add profile_categories column to businesses table
-- This allows businesses to customize which customer profile categories are visible

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS profile_categories JSONB DEFAULT '{
  "allergies": true,
  "favorite_category": true,
  "past_orders": true,
  "issues": true,
  "sizes_dimensions": true,
  "preferences": true,
  "best_times": true
}'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN businesses.profile_categories IS 'Controls which customer profile categories are visible in the UI. Each key corresponds to a profile section that can be toggled on/off.';

-- Set default for existing businesses (all categories enabled)
UPDATE businesses
SET profile_categories = '{
  "allergies": true,
  "favorite_category": true,
  "past_orders": true,
  "issues": true,
  "sizes_dimensions": true,
  "preferences": true,
  "best_times": true
}'::jsonb
WHERE profile_categories IS NULL;
