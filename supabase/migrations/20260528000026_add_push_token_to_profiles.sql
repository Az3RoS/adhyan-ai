-- Add push_token column to user_profiles for Expo Push Notifications
-- Used by streak reminder and scam alert push notifications

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Index for batch notification sends (service role only)
CREATE INDEX IF NOT EXISTS idx_profiles_push_token
  ON user_profiles(push_token)
  WHERE push_token IS NOT NULL;
