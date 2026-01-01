-- Add UNIQUE constraint to business name_slug to prevent duplicate business names
-- This ensures each business has a unique name across the platform

-- Step 1: Temporarily disable the trigger that prevents owner removal
ALTER TABLE business_members DISABLE TRIGGER prevent_last_owner_removal_trigger;

-- Step 2: For duplicate businesses, merge their members into the oldest business
-- Then delete the duplicate businesses
DO $$
DECLARE
  duplicate_record RECORD;
  oldest_business_id UUID;
BEGIN
  -- Find all duplicate name_slugs
  FOR duplicate_record IN
    SELECT name_slug
    FROM businesses
    WHERE name_slug IS NOT NULL
    GROUP BY name_slug
    HAVING COUNT(*) > 1
  LOOP
    -- Get the oldest business with this name_slug
    SELECT id INTO oldest_business_id
    FROM businesses
    WHERE name_slug = duplicate_record.name_slug
    ORDER BY created_at ASC
    LIMIT 1;

    -- Reassign members from duplicate businesses to the oldest one
    UPDATE business_members
    SET business_id = oldest_business_id
    WHERE business_id IN (
      SELECT id
      FROM businesses
      WHERE name_slug = duplicate_record.name_slug
      AND id != oldest_business_id
    )
    AND NOT EXISTS (
      -- Avoid duplicate memberships
      SELECT 1 FROM business_members bm2
      WHERE bm2.business_id = oldest_business_id
      AND bm2.user_id = business_members.user_id
    );

    -- Delete members that would create duplicates (already exist in oldest business)
    DELETE FROM business_members
    WHERE business_id IN (
      SELECT id
      FROM businesses
      WHERE name_slug = duplicate_record.name_slug
      AND id != oldest_business_id
    );

    -- Now delete the duplicate businesses (oldest one remains)
    DELETE FROM businesses
    WHERE name_slug = duplicate_record.name_slug
    AND id != oldest_business_id;

    RAISE NOTICE 'Merged duplicates for business name: %', duplicate_record.name_slug;
  END LOOP;
END $$;

-- Step 3: Re-enable the trigger
ALTER TABLE business_members ENABLE TRIGGER prevent_last_owner_removal_trigger;

-- Step 4: Add the UNIQUE constraint
ALTER TABLE businesses
ADD CONSTRAINT businesses_name_slug_unique UNIQUE (name_slug);

COMMENT ON CONSTRAINT businesses_name_slug_unique ON businesses IS 'Ensures each business has a unique name across the platform';
