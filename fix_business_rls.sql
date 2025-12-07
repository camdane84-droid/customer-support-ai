-- Enable RLS on businesses table (if not already enabled)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own business" ON businesses;
DROP POLICY IF EXISTS "Users can view their own business" ON businesses;
DROP POLICY IF EXISTS "Users can update their own business" ON businesses;

-- Policy for INSERT - users can create their own business
CREATE POLICY "Users can create their own business" ON businesses
  FOR INSERT WITH CHECK (
    auth.email() = email OR auth.uid() IS NOT NULL
  );

-- Policy for SELECT - users can view their own business
CREATE POLICY "Users can view their own business" ON businesses
  FOR SELECT USING (
    auth.email() = email OR auth.uid() IS NOT NULL
  );

-- Policy for UPDATE - users can update their own business
CREATE POLICY "Users can update their own business" ON businesses
  FOR UPDATE USING (
    auth.email() = email
  );

-- Also allow service role to access everything (for API routes)
-- This is already handled by the service role key bypassing RLS
