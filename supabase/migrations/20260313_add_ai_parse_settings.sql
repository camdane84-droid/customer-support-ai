-- AI Email Parsing settings on businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ai_parse_enabled BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ai_parse_urgent BOOLEAN DEFAULT true;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ai_parse_important BOOLEAN DEFAULT true;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ai_parse_urgent_keywords TEXT[] DEFAULT '{}';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ai_parse_important_keywords TEXT[] DEFAULT '{}';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ai_parse_notify_email TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ai_parse_notify_phone TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ai_parse_notify_urgent BOOLEAN DEFAULT true;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ai_parse_notify_important BOOLEAN DEFAULT true;

-- Priority fields on messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS priority_reason TEXT DEFAULT NULL;

-- Notifications table for in-app alerts
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('urgent', 'important')),
  title TEXT NOT NULL,
  summary TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(business_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_messages_priority ON messages(priority) WHERE priority != 'normal';

-- RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications for their businesses"
  ON notifications FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update notifications for their businesses"
  ON notifications FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM business_members WHERE user_id = auth.uid()
    )
  );

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
