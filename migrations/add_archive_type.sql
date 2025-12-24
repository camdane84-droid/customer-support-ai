-- Migration: Add archive_type column to conversations table
-- This column tracks whether a conversation was archived or resolved
-- Default value is 'archived' for backward compatibility

-- Add the archive_type column
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS archive_type TEXT DEFAULT 'archived';

-- Add a check constraint to ensure only valid values
ALTER TABLE conversations
ADD CONSTRAINT archive_type_check
CHECK (archive_type IN ('archived', 'resolved'));

-- Create an index for faster filtering by archive_type
CREATE INDEX IF NOT EXISTS idx_conversations_archive_type
ON conversations(archive_type)
WHERE status = 'archived';

-- Update existing archived conversations to have archive_type = 'archived'
UPDATE conversations
SET archive_type = 'archived'
WHERE status = 'archived' AND archive_type IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN conversations.archive_type IS 'Type of archive: archived (stored for reference) or resolved (marked as completed)';
