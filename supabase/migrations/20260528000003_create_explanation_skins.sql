CREATE TABLE explanation_skins (
  skin_id               TEXT PRIMARY KEY,
  concept_id            TEXT NOT NULL REFERENCES concept_nodes(id) ON DELETE CASCADE,
  version               TEXT NOT NULL DEFAULT '1.0.0',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  status                TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','review','published','deprecated')),
  locale                TEXT NOT NULL CHECK (locale IN ('en','hi','bn','ta','te','mr','kn')),
  persona               TEXT NOT NULL
                          CHECK (persona IN ('elderly','farmer','student','gig_worker',
                                             'clerk','shop_owner','homemaker',
                                             'domestic_worker','professional','generic')),
  age_group             TEXT CHECK (age_group IN ('13-18','18-27','28-43','44-59','60+')),
  literacy_level        TEXT DEFAULT 'medium' CHECK (literacy_level IN ('low','medium','high')),
  is_safety_critical    BOOLEAN NOT NULL DEFAULT FALSE,
  human_reviewed        BOOLEAN NOT NULL DEFAULT FALSE,
  reviewer_id           TEXT,
  reviewed_at           TIMESTAMPTZ,
  day1_hook             TEXT NOT NULL,
  day2_reveal           TEXT NOT NULL,
  day3_practice         TEXT NOT NULL,
  day4_retrieval_q      TEXT NOT NULL,
  day4_acceptable_ans   TEXT[] NOT NULL DEFAULT '{}',
  day5_check_prompt     TEXT NOT NULL,
  one_liner             TEXT NOT NULL,
  primary_analogy_id    TEXT REFERENCES analogies(analogy_id),
  secondary_analogy_id  TEXT REFERENCES analogies(analogy_id),
  primary_format        TEXT DEFAULT 'audio'
                          CHECK (primary_format IN ('audio','visual','interactive','text')),
  reading_required      BOOLEAN DEFAULT FALSE,
  max_words_per_screen  INTEGER DEFAULT 18,
  font_size_class       TEXT DEFAULT 'md' CHECK (font_size_class IN ('sm','md','lg','xl')),
  voice_speed           TEXT DEFAULT 'normal' CHECK (voice_speed IN ('slow','normal','fast')),
  tts_voice_id          TEXT,
  offline_cacheable     BOOLEAN DEFAULT TRUE,
  audio_url             TEXT,
  audio_duration_seconds INTEGER,
  completion_message    TEXT NOT NULL,
  completion_style      TEXT DEFAULT 'quiet_glow'
                          CHECK (completion_style IN ('quiet_glow','warm_pulse','confetti')),
  family_bridge_summary TEXT,
  wa_headline           TEXT,
  wa_body               TEXT,
  wa_cta                TEXT,
  wa_image_key          TEXT,
  completion_rate       REAL DEFAULT 0,
  retention_score       REAL DEFAULT 0,
  helpful_rating        REAL DEFAULT 0,
  drop_off_day          INTEGER
);

CREATE INDEX idx_skins_concept    ON explanation_skins(concept_id);
CREATE INDEX idx_skins_locale_persona ON explanation_skins(locale, persona);
CREATE INDEX idx_skins_status     ON explanation_skins(status);
CREATE UNIQUE INDEX idx_skins_unique ON explanation_skins(concept_id, locale, persona);

ALTER TABLE explanation_skins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published and reviewed skins only"
  ON explanation_skins FOR SELECT
  USING (
    status = 'published'
    AND NOT (is_safety_critical = TRUE AND human_reviewed = FALSE)
  );
CREATE POLICY "Only service role can write skins"
  ON explanation_skins FOR ALL USING (auth.role() = 'service_role');
