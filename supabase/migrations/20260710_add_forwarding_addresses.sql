-- Forwarding-based onboarding: each email connection gets a unique parse
-- address (e.g. support-a3f9@in.yourdomain.com). Businesses auto-forward
-- their existing mailbox to it — no MX record changes needed on their domain.

ALTER TABLE social_connections ADD COLUMN IF NOT EXISTS forwarding_address TEXT;

-- Set when the first forwarded message arrives — proves the forwarding rule works
ALTER TABLE social_connections ADD COLUMN IF NOT EXISTS forwarding_confirmed_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_forwarding_address
  ON social_connections (forwarding_address)
  WHERE forwarding_address IS NOT NULL;
