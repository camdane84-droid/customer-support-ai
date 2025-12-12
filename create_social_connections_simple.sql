-- Step 1: Create the table
CREATE TABLE social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'whatsapp')),
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, platform, platform_user_id)
);

-- Step 2: Enable RLS
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies
CREATE POLICY social_connections_select ON social_connections
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE email = (auth.jwt() ->> 'email')));

CREATE POLICY social_connections_insert ON social_connections
  FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE email = (auth.jwt() ->> 'email')));

CREATE POLICY social_connections_update ON social_connections
  FOR UPDATE TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE email = (auth.jwt() ->> 'email')));

CREATE POLICY social_connections_delete ON social_connections
  FOR DELETE TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE email = (auth.jwt() ->> 'email')));

-- Step 4: Create indexes
CREATE INDEX idx_social_connections_business_id ON social_connections(business_id);
CREATE INDEX idx_social_connections_platform ON social_connections(platform);
CREATE INDEX idx_social_connections_active ON social_connections(is_active);

-- Step 5: Grant permissions
GRANT ALL ON social_connections TO authenticated;
GRANT ALL ON social_connections TO service_role;
