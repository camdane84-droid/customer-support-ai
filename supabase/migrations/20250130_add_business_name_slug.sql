-- Add normalized business name column for matching during signup
-- Enables users to join existing businesses by typing the business name

-- Add slug column
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS name_slug TEXT;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_businesses_name_slug ON businesses(name_slug);

-- Function to create slug from business name (lowercase, remove special chars)
CREATE OR REPLACE FUNCTION slugify(text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    trim(
      regexp_replace(
        regexp_replace(text, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Populate existing slugs
UPDATE businesses
SET name_slug = slugify(name)
WHERE name_slug IS NULL;

-- Trigger to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION generate_business_name_slug()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name_slug = slugify(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_name_slug_trigger
  BEFORE INSERT OR UPDATE OF name ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION generate_business_name_slug();

COMMENT ON COLUMN businesses.name_slug IS 'Normalized business name for fuzzy matching during signup (join by business name feature)';
