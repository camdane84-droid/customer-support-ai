-- Better RLS policies for businesses table
-- This version uses auth.jwt() which is more reliable than auth.email()

-- Enable RLS on businesses table
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can create their own business" ON businesses;
DROP POLICY IF EXISTS "Users can view their own business" ON businesses;
DROP POLICY IF EXISTS "Users can update their own business" ON businesses;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON businesses;
DROP POLICY IF EXISTS "Enable read access for own business" ON businesses;
DROP POLICY IF EXISTS "Enable update for own business" ON businesses;

-- Policy for INSERT - authenticated users can create businesses
CREATE POLICY "Enable insert for authenticated users" ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Policy for SELECT - users can only see their own business (matched by email)
CREATE POLICY "Enable read access for own business" ON businesses
  FOR SELECT
  TO authenticated
  USING (
    email = (auth.jwt() ->> 'email')
  );

-- Policy for UPDATE - users can only update their own business
CREATE POLICY "Enable update for own business" ON businesses
  FOR UPDATE
  TO authenticated
  USING (
    email = (auth.jwt() ->> 'email')
  )
  WITH CHECK (
    email = (auth.jwt() ->> 'email')
  );

-- Grant necessary permissions
GRANT ALL ON businesses TO authenticated;
GRANT ALL ON businesses TO service_role;
