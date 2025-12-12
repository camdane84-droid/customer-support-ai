-- Create social_connections table for Instagram/Facebook OAuth
CREATE TABLE IF NOT EXISTS social_connections (
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

-- Enable RLS
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own social connections"
  ON social_connections FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Users can insert their own social connections"
  ON social_connections FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Users can update their own social connections"
  ON social_connections FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Users can delete their own social connections"
  ON social_connections FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_social_connections_business_id ON social_connections(business_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_platform ON social_connections(platform);
CREATE INDEX IF NOT EXISTS idx_social_connections_active ON social_connections(is_active);

-- Grant permissions
GRANT ALL ON social_connections TO authenticated;
GRANT ALL ON social_connections TO service_role;
