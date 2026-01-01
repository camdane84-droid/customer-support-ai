-- Create business_members junction table for many-to-many relationship
-- This enables multiple users to belong to the same business (team collaboration)

CREATE TABLE IF NOT EXISTS business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'agent', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate memberships
  UNIQUE(business_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_business_members_business_id ON business_members(business_id);
CREATE INDEX idx_business_members_user_id ON business_members(user_id);
CREATE INDEX idx_business_members_role ON business_members(role);

-- Enable RLS
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can see members of businesses they belong to
CREATE POLICY "Users can view members of their businesses"
  ON business_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = business_members.business_id
      AND bm.user_id = auth.uid()
    )
  );

-- Only owners and admins can add members
CREATE POLICY "Owners and admins can add members"
  ON business_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = business_members.business_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin')
    )
  );

-- Only owners and admins can update member roles
CREATE POLICY "Owners and admins can update member roles"
  ON business_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = business_members.business_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin')
    )
  );

-- Only owners and admins can remove members (with protection for last owner)
CREATE POLICY "Owners and admins can remove members"
  ON business_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_id = business_members.business_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin')
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_members_updated_at
  BEFORE UPDATE ON business_members
  FOR EACH ROW
  EXECUTE FUNCTION update_business_members_updated_at();

-- Function to prevent removing the last owner from a business
CREATE OR REPLACE FUNCTION prevent_last_owner_removal()
RETURNS TRIGGER AS $$
DECLARE
  owner_count INTEGER;
BEGIN
  -- Only check if deleting an owner
  IF OLD.role = 'owner' THEN
    SELECT COUNT(*) INTO owner_count
    FROM business_members
    WHERE business_id = OLD.business_id
    AND role = 'owner'
    AND id != OLD.id;

    IF owner_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last owner from a business';
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_last_owner_removal_trigger
  BEFORE DELETE ON business_members
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_owner_removal();

-- Add comment
COMMENT ON TABLE business_members IS 'Junction table for many-to-many relationship between users and businesses. Enables team collaboration.';
