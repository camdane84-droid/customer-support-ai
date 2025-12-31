-- Update all RLS policies to support team collaboration
-- Changes from checking businesses.user_id to checking business_members table

-- ====================
-- BUSINESSES TABLE
-- ====================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can update own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can insert own businesses" ON businesses;

-- New policies
CREATE POLICY "Team members can view their businesses"
  ON businesses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = businesses.id
      AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can update businesses"
  ON businesses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = businesses.id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin')
    )
  );

-- Allow authenticated users to create businesses (they'll become owner via trigger or application logic)
CREATE POLICY "Authenticated users can create businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ====================
-- CONVERSATIONS TABLE
-- ====================

DROP POLICY IF EXISTS "Users can view conversations for own businesses" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations for own businesses" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations for own businesses" ON conversations;
DROP POLICY IF EXISTS "Users can delete conversations for own businesses" ON conversations;

CREATE POLICY "Team members can view conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = conversations.business_id
      AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update conversations"
  ON conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = conversations.business_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin', 'agent')
    )
  );

CREATE POLICY "Team members can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = conversations.business_id
      AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can delete conversations"
  ON conversations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = conversations.business_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin')
    )
  );

-- ====================
-- MESSAGES TABLE
-- ====================

DROP POLICY IF EXISTS "Users can view messages for own conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages for own conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages for own conversations" ON messages;
DROP POLICY IF EXISTS "Users can delete messages for own conversations" ON messages;

CREATE POLICY "Team members can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN business_members bm ON bm.business_id = c.business_id
      WHERE c.id = messages.conversation_id
      AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create messages"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN business_members bm ON bm.business_id = c.business_id
      WHERE c.id = messages.conversation_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin', 'agent')
    )
  );

CREATE POLICY "Team members can update messages"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN business_members bm ON bm.business_id = c.business_id
      WHERE c.id = messages.conversation_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin', 'agent')
    )
  );

CREATE POLICY "Owners and admins can delete messages"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN business_members bm ON bm.business_id = c.business_id
      WHERE c.id = messages.conversation_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin')
    )
  );

-- ====================
-- SOCIAL CONNECTIONS TABLE
-- ====================

DROP POLICY IF EXISTS "Users can view social connections for own businesses" ON social_connections;
DROP POLICY IF EXISTS "Users can update social connections for own businesses" ON social_connections;
DROP POLICY IF EXISTS "Users can insert social connections for own businesses" ON social_connections;
DROP POLICY IF EXISTS "Users can delete social connections for own businesses" ON social_connections;

CREATE POLICY "Team members can view social connections"
  ON social_connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = social_connections.business_id
      AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage social connections"
  ON social_connections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = social_connections.business_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = social_connections.business_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin')
    )
  );

-- ====================
-- CANNED RESPONSES TABLE
-- ====================

DROP POLICY IF EXISTS "Users can view canned responses for own businesses" ON canned_responses;
DROP POLICY IF EXISTS "Users can update canned responses for own businesses" ON canned_responses;
DROP POLICY IF EXISTS "Users can insert canned responses for own businesses" ON canned_responses;
DROP POLICY IF EXISTS "Users can delete canned responses for own businesses" ON canned_responses;

CREATE POLICY "Team members can view canned responses"
  ON canned_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = canned_responses.business_id
      AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage canned responses"
  ON canned_responses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = canned_responses.business_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = canned_responses.business_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin')
    )
  );

-- ====================
-- CUSTOMERS TABLE
-- ====================

DROP POLICY IF EXISTS "Users can view customers for own businesses" ON customers;
DROP POLICY IF EXISTS "Users can update customers for own businesses" ON customers;
DROP POLICY IF EXISTS "Users can insert customers for own businesses" ON customers;
DROP POLICY IF EXISTS "Users can delete customers for own businesses" ON customers;

CREATE POLICY "Team members can view customers"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = customers.business_id
      AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can manage customers"
  ON customers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = customers.business_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin', 'agent')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = customers.business_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin', 'agent')
    )
  );

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'RLS policies updated successfully for team collaboration';
  RAISE NOTICE 'All tables now check business_members table instead of businesses.user_id';
END $$;
