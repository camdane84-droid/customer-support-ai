-- Chat widget gets its own auto-reply switch, separate from the email
-- schedule. Chat visitors expect instant answers, so the default is
-- 'always'; email keeps its after_hours/all_day/custom schedule.
--   always        - AI answers every chat message instantly (default)
--   same_as_email - follow the email auto-reply schedule
--   off           - never auto-reply in chat
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS chat_auto_reply_mode TEXT DEFAULT 'always'
CHECK (chat_auto_reply_mode IN ('always', 'same_as_email', 'off'));
