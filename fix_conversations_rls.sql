-- Fix RLS policies for conversations and messages tables
-- This will allow authenticated users to access their business conversations

-- Enable RLS on conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on conversations
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON conversations;
DROP POLICY IF EXISTS "Enable read access for own business" ON conversations;
DROP POLICY IF EXISTS "Enable update for own business" ON conversations;
DROP POLICY IF EXISTS "Enable delete for own business" ON conversations;

-- Policy for INSERT - authenticated users can create conversations for their business
CREATE POLICY "Enable insert for authenticated users" ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- Policy for SELECT - users can see conversations for their business
CREATE POLICY "Enable read access for own business" ON conversations
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- Policy for UPDATE - users can update conversations for their business
CREATE POLICY "Enable update for own business" ON conversations
  FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE email = (auth.jwt() ->> 'email')
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- Policy for DELETE - users can delete conversations for their business
CREATE POLICY "Enable delete for own business" ON conversations
  FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on messages
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON messages;
DROP POLICY IF EXISTS "Enable read access for own business" ON messages;
DROP POLICY IF EXISTS "Enable update for own business" ON messages;
DROP POLICY IF EXISTS "Enable delete for own business" ON messages;

-- Policy for INSERT - authenticated users can create messages for their business
CREATE POLICY "Enable insert for authenticated users" ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- Policy for SELECT - users can see messages for their business
CREATE POLICY "Enable read access for own business" ON messages
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- Policy for UPDATE - users can update messages for their business
CREATE POLICY "Enable update for own business" ON messages
  FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE email = (auth.jwt() ->> 'email')
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- Policy for DELETE - users can delete messages for their business
CREATE POLICY "Enable delete for own business" ON messages
  FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- Grant necessary permissions
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversations TO service_role;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON messages TO service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_business_id ON conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_business_id ON messages(business_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
