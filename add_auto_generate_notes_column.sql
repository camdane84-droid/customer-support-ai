-- Add auto_generate_notes column to businesses table
-- This enables/disables AI-powered automatic note generation from conversations

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS auto_generate_notes BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column
COMMENT ON COLUMN businesses.auto_generate_notes IS 'When enabled, AI automatically generates bullet-point notes from customer conversations to help track important details like questions, preferences, and concerns.';
