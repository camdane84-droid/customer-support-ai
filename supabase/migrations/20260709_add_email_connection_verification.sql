-- Email connection ownership verification:
-- prevents a business from claiming an email address it doesn't control.
-- New email connections start unverified; a 6-digit code is sent to the
-- address and must be confirmed before the connection receives mail.

-- 1. Verification columns
ALTER TABLE social_connections ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE social_connections ADD COLUMN IF NOT EXISTS verification_code TEXT;
ALTER TABLE social_connections ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;
ALTER TABLE social_connections ADD COLUMN IF NOT EXISTS verification_attempts INTEGER NOT NULL DEFAULT 0;

-- 2. Grandfather existing connections:
--    - OAuth platforms (instagram/whatsapp/tiktok) are verified by the OAuth flow itself
--    - existing email connections were backfilled from businesses.email at signup
UPDATE social_connections SET verified = true;

-- 3. At most one business can hold a verified, active claim on an email address
CREATE UNIQUE INDEX IF NOT EXISTS uniq_verified_email_connection
  ON social_connections (platform_user_id)
  WHERE platform = 'email' AND is_active = true AND verified = true;
