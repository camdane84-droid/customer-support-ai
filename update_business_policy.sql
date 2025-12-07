-- Drop the old INSERT policy
DROP POLICY IF EXISTS "Users can create their own business" ON businesses;

-- Create new INSERT policy that works during signup
CREATE POLICY "Users can create their own business" ON businesses
  FOR INSERT WITH CHECK (
    auth.email() = email OR auth.uid() IS NOT NULL
  );
