-- Enable Row Level Security on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Businesses: Users can only access their own businesses
CREATE POLICY "Users can view own businesses"
  ON businesses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own businesses"
  ON businesses
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own businesses"
  ON businesses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Conversations: Users can access conversations for their businesses
CREATE POLICY "Users can view conversations for own businesses"
  ON conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = conversations.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update conversations for own businesses"
  ON conversations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = conversations.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert conversations for own businesses"
  ON conversations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = conversations.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Messages: Users can access messages for their conversations
CREATE POLICY "Users can view messages for own conversations"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN businesses ON businesses.id = conversations.business_id
      WHERE conversations.id = messages.conversation_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages for own conversations"
  ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN businesses ON businesses.id = conversations.business_id
      WHERE conversations.id = messages.conversation_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages for own conversations"
  ON messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN businesses ON businesses.id = conversations.business_id
      WHERE conversations.id = messages.conversation_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Social Connections: Users can access connections for their businesses
CREATE POLICY "Users can view social connections for own businesses"
  ON social_connections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = social_connections.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update social connections for own businesses"
  ON social_connections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = social_connections.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert social connections for own businesses"
  ON social_connections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = social_connections.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Canned Responses: Users can access responses for their businesses
CREATE POLICY "Users can view canned responses for own businesses"
  ON canned_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = canned_responses.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update canned responses for own businesses"
  ON canned_responses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = canned_responses.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert canned responses for own businesses"
  ON canned_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = canned_responses.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete canned responses for own businesses"
  ON canned_responses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = canned_responses.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Customers: Users can view customers for their businesses
CREATE POLICY "Users can view customers for own businesses"
  ON customers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = customers.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update customers for own businesses"
  ON customers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = customers.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert customers for own businesses"
  ON customers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = customers.business_id
      AND businesses.user_id = auth.uid()
    )
  );
