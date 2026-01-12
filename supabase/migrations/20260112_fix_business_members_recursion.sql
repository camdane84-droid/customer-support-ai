-- Fix infinite recursion in business_members RLS policies (final fix)
-- The issue: businesses UPDATE policy checks business_members,
-- but business_members SELECT policy also checks business_members (subquery), causing recursion

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own memberships" ON business_members;
DROP POLICY IF EXISTS "Users can view other members" ON business_members;
DROP POLICY IF EXISTS "Users view their memberships directly" ON business_members;
DROP POLICY IF EXISTS "Users view members in same business" ON business_members;

-- Solution: Create a SECURITY DEFINER function that bypasses RLS
-- This function returns business_ids where the user is a member
CREATE OR REPLACE FUNCTION user_business_ids(user_id_param uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT business_id
  FROM business_members
  WHERE user_id = user_id_param;
$$;

-- Now create simple, non-recursive policies using the function
-- Policy 1: Users can view their own membership rows directly
CREATE POLICY "Users view own membership"
  ON business_members FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: Users can view members in businesses they belong to
-- Uses SECURITY DEFINER function to avoid recursion
CREATE POLICY "Users view team members"
  ON business_members FOR SELECT
  USING (business_id IN (SELECT user_business_ids(auth.uid())));

-- Verify RLS is enabled
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON FUNCTION user_business_ids(uuid) IS
  'SECURITY DEFINER function to get business IDs for a user without triggering RLS recursion';
COMMENT ON POLICY "Users view own membership" ON business_members IS
  'Direct check: no subqueries or recursion';
COMMENT ON POLICY "Users view team members" ON business_members IS
  'Uses SECURITY DEFINER function to bypass RLS and avoid recursion';
