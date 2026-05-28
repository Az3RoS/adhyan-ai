CREATE TABLE user_profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  locale                  TEXT NOT NULL DEFAULT 'hi'
                            CHECK (locale IN ('en','hi','bn','ta','te','mr','kn')),
  persona                 TEXT DEFAULT 'generic',
  occupation              TEXT,
  age_group               TEXT,
  streak_days             INTEGER DEFAULT 0,
  longest_streak          INTEGER DEFAULT 0,
  last_active_date        DATE,
  streak_freeze_available INTEGER DEFAULT 0,
  highest_milestone_day   INTEGER DEFAULT 0,
  is_mentor               BOOLEAN DEFAULT FALSE,
  is_contributor          BOOLEAN DEFAULT FALSE,
  ai_age_level            TEXT DEFAULT 'curious_child'
                            CHECK (ai_age_level IN ('curious_child','apprentice','journeyman',
                                                     'craftsperson','elder','keeper_of_fire')),
  family_contact_phone    TEXT,
  family_bridge_enabled   BOOLEAN DEFAULT FALSE,
  whatsapp_phone          TEXT,
  wa_morning_digest       BOOLEAN DEFAULT FALSE,
  wa_urgent_alerts        BOOLEAN DEFAULT TRUE,
  wa_weekly_story         BOOLEAN DEFAULT FALSE,
  district                TEXT,
  state                   TEXT,
  interests_enabled       TEXT[] DEFAULT '{news,health}',
  data_deletion_requested BOOLEAN DEFAULT FALSE
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Auto-create profile row when a new auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile"   ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
