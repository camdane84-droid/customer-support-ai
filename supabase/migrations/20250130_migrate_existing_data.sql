-- Migrate existing single-user businesses to team collaboration structure
-- This creates business_members entries for all existing business owners

-- Step 1: Migrate existing users to business_members table as owners
INSERT INTO business_members (business_id, user_id, role, joined_at)
SELECT
  b.id as business_id,
  b.user_id,
  'owner' as role,
  b.created_at as joined_at
FROM businesses b
WHERE b.user_id IS NOT NULL
ON CONFLICT (business_id, user_id) DO NOTHING;

-- Step 2: Create user preferences for existing users (set their business as active)
INSERT INTO user_preferences (user_id, active_business_id)
SELECT
  b.user_id,
  b.id
FROM businesses b
WHERE b.user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Log migration stats
DO $$
DECLARE
  member_count INTEGER;
  pref_count INTEGER;
  business_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO member_count FROM business_members;
  SELECT COUNT(*) INTO pref_count FROM user_preferences;
  SELECT COUNT(*) INTO business_count FROM businesses WHERE user_id IS NOT NULL;

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  - % businesses with user_id', business_count;
  RAISE NOTICE '  - % business_members entries created', member_count;
  RAISE NOTICE '  - % user_preferences created', pref_count;
END $$;
