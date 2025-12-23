-- Add indexes to speed up analytics queries
-- These indexes will dramatically improve query performance

-- Index on conversations table for analytics queries
CREATE INDEX IF NOT EXISTS idx_conversations_business_created
ON conversations(business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_business_status
ON conversations(business_id, status);

-- Index on messages table for analytics queries
CREATE INDEX IF NOT EXISTS idx_messages_business_created
ON messages(business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_business_sender
ON messages(business_id, sender_type);

-- Analyze tables to update statistics
ANALYZE conversations;
ANALYZE messages;
