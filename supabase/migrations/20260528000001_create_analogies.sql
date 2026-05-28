-- Analogies must exist before explanation_skins (FK dependency)
CREATE TABLE analogies (
  analogy_id            TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  analogy_type          TEXT NOT NULL
                          CHECK (analogy_type IN ('folk','cinema','myth','everyday','game','scripture')),
  origin                TEXT,
  suitable_concepts     TEXT[] DEFAULT '{}',
  suitable_personas     TEXT[] DEFAULT '{}',
  unsuitable_personas   TEXT[] DEFAULT '{}',
  suitable_locales      TEXT[] DEFAULT '{}',
  contributed_by        TEXT DEFAULT 'content_team',
  content_hi_setup      TEXT,
  content_hi_punchline  TEXT,
  content_hi_bridge     TEXT,
  content_bn_setup      TEXT,
  content_bn_punchline  TEXT,
  content_bn_bridge     TEXT,
  content_en_setup      TEXT,
  content_en_punchline  TEXT,
  content_en_bridge     TEXT,
  usage_count           INTEGER DEFAULT 0,
  resonance_score       REAL DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE analogies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Analogies public read" ON analogies FOR SELECT USING (TRUE);
CREATE POLICY "Only service role can write analogies"
  ON analogies FOR ALL USING (auth.role() = 'service_role');
