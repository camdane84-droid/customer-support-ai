-- Support the hourly inbound-message counts in lib/ai/inbound-budget.ts,
-- which run on every inbound email and chat message.
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sender_created
  ON messages(conversation_id, sender_type, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_business_sender_created
  ON messages(business_id, sender_type, created_at);
