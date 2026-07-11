-- Live Chat Widget: embeddable website chat as a second channel
-- Conversations use channel = 'chat'; delivery to the visitor is the widget
-- polling the messages table, so no external send is needed.

-- 1. Widget settings on businesses.
-- widget_key is the public embed identifier (safe to expose in page source);
-- regenerating it revokes existing embeds.
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS widget_key UUID UNIQUE DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS widget_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS widget_color TEXT DEFAULT '#7c3aed',
ADD COLUMN IF NOT EXISTS widget_greeting TEXT;

-- Belt-and-braces: make sure every existing business has a key
UPDATE businesses SET widget_key = gen_random_uuid() WHERE widget_key IS NULL;

-- 2. Chat sessions: binds an anonymous visitor's bearer token to a conversation.
-- The token itself is only ever held by the visitor's browser; we store a
-- SHA-256 hash so a database leak doesn't let anyone read chat transcripts.
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL UNIQUE REFERENCES conversations(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  visitor_name TEXT,
  visitor_email TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_business ON chat_sessions(business_id);

-- Service-role only: RLS enabled with no policies. Visitors are anonymous, so
-- all reads/writes go through the /api/widget routes using the server client.
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
