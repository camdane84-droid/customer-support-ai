-- Multi-Email Channels: let businesses connect multiple email addresses
-- into one unified inbox via social_connections

-- 1. Update social_connections platform CHECK to allow 'email'
ALTER TABLE social_connections DROP CONSTRAINT IF EXISTS social_connections_platform_check;
ALTER TABLE social_connections ADD CONSTRAINT social_connections_platform_check
  CHECK (platform IN ('instagram', 'whatsapp', 'tiktok', 'email'));

-- 2. Make access_token nullable (email connections don't need tokens)
ALTER TABLE social_connections ALTER COLUMN access_token DROP NOT NULL;

-- 3. Add columns to conversations for multi-email routing
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS social_connection_id UUID REFERENCES social_connections(id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS channel_address TEXT;

-- 4. Backfill: create a social_connections row (platform='email') for each business that has an email
INSERT INTO social_connections (business_id, platform, platform_user_id, platform_username, is_active)
SELECT id, 'email', email, email, true
FROM businesses
WHERE email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM social_connections sc
    WHERE sc.business_id = businesses.id
      AND sc.platform = 'email'
      AND sc.platform_user_id = businesses.email
  );

-- 5. Backfill: set social_connection_id and channel_address on existing email conversations
UPDATE conversations c
SET
  channel_address = b.email,
  social_connection_id = sc.id
FROM businesses b
JOIN social_connections sc ON sc.business_id = b.id AND sc.platform = 'email' AND sc.platform_user_id = b.email
WHERE c.business_id = b.id
  AND c.channel = 'email'
  AND c.social_connection_id IS NULL;
