-- Add UNIQUE constraint to business name_slug to prevent duplicate business names
-- This ensures each business has a unique name across the platform

-- First, remove any duplicate business names (keeping the oldest one)
DELETE FROM businesses a
USING businesses b
WHERE a.id > b.id
  AND a.name_slug = b.name_slug
  AND a.name_slug IS NOT NULL;

-- Add the UNIQUE constraint
ALTER TABLE businesses
ADD CONSTRAINT businesses_name_slug_unique UNIQUE (name_slug);

COMMENT ON CONSTRAINT businesses_name_slug_unique ON businesses IS 'Ensures each business has a unique name across the platform';
