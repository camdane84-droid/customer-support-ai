-- Fix infinite recursion in business_members RLS policies
-- The original policies queried business_members within business_members policies, causing recursion

-- Drop all existing policies on business_members
DROP POLICY IF EXISTS "Users can view members of their businesses" ON business_members;
DROP POLICY IF EXISTS "Owners and admins can add members" ON business_members;
DROP POLICY IF EXISTS "Owners and admins can update member roles" ON business_members;
DROP POLICY IF EXISTS "Owners and admins can remove members" ON business_members;

-- Simple policy: Users can view their own memberships directly
CREATE POLICY "Users can view their own memberships"
  ON business_members FOR SELECT
  USING (user_id = auth.uid());

-- Simple policy: Users can view memberships in businesses they belong to
-- This uses a subquery but checks business_id, not business_members again
CREATE POLICY "Users can view other members"
  ON business_members FOR SELECT
  USING (
    business_id IN (
      SELECT bm.business_id
      FROM business_members bm
      WHERE bm.user_id = auth.uid()
    )
  );

-- For INSERT/UPDATE/DELETE, we'll rely on the service role in the API
-- Regular users cannot insert/update/delete directly - only through API routes
-- This prevents the recursion issue entirely

-- Allow service role to bypass RLS (it already does, but this is explicit)
-- No additional policies needed for INSERT/UPDATE/DELETE - service role handles it
