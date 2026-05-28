CREATE TABLE tool_directory (
  id                   TEXT PRIMARY KEY,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  name                 TEXT NOT NULL,
  name_hi              TEXT,
  name_bn              TEXT,
  url                  TEXT NOT NULL,
  icon_url             TEXT,
  category             TEXT NOT NULL,
  suitable_occupations TEXT[] DEFAULT '{all}',
  suitable_age_groups  TEXT[] DEFAULT '{all}',
  supported_locales    TEXT[] DEFAULT '{en}',
  is_free              BOOLEAN DEFAULT TRUE,
  requires_account     BOOLEAN DEFAULT FALSE,
  works_offline        BOOLEAN DEFAULT FALSE,
  data_connectivity    TEXT DEFAULT '3g' CHECK (data_connectivity IN ('2g','3g','wifi')),
  description_en       TEXT NOT NULL,
  description_hi       TEXT,
  description_bn       TEXT,
  one_user_review_en   TEXT,
  one_user_review_hi   TEXT,
  one_user_review_bn   TEXT,
  reviewer_occupation  TEXT,
  reviewer_state       TEXT,
  featured_week        DATE,
  is_active            BOOLEAN DEFAULT TRUE,
  verified_by          TEXT,
  verified_at          TIMESTAMPTZ
);

ALTER TABLE tool_directory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active tools public read"
  ON tool_directory FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Only service role can write tools"
  ON tool_directory FOR ALL USING (auth.role() = 'service_role');
