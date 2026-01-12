-- Add auto_generate_notes column to businesses table
-- This controls whether AI customer insights are enabled

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS auto_generate_notes BOOLEAN DEFAULT FALSE;

-- Set existing businesses to FALSE by default (opt-in feature)
UPDATE businesses
SET auto_generate_notes = FALSE
WHERE auto_generate_notes IS NULL;

-- Add index for performance when checking this setting
CREATE INDEX IF NOT EXISTS idx_businesses_auto_generate_notes
ON businesses(auto_generate_notes)
WHERE auto_generate_notes = TRUE;

COMMENT ON COLUMN businesses.auto_generate_notes IS
  'When enabled, AI automatically generates customer profiles and conversation notes';
