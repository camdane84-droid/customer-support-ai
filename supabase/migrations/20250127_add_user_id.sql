-- Add user_id column to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);

-- Migrate existing businesses: try to match email with auth.users
-- This will set user_id for any existing accounts where the email matches
UPDATE businesses b
SET user_id = au.id
FROM auth.users au
WHERE b.email = au.email
  AND b.user_id IS NULL;

-- Add a comment for documentation
COMMENT ON COLUMN businesses.user_id IS 'References auth.users.id - the user who owns this business';
