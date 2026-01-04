-- Add profile category settings to businesses table
-- This allows businesses to toggle which profile categories are displayed

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS profile_settings JSONB DEFAULT '{
  "show_allergies": true,
  "show_favorite_category": true,
  "show_past_orders": true,
  "show_issues": true,
  "show_sizes_dimensions": true,
  "show_preferences": true,
  "show_best_times": true
}'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN businesses.profile_settings IS 'Controls which customer profile categories are visible';
