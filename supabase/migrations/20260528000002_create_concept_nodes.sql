CREATE TABLE concept_nodes (
  id                    TEXT PRIMARY KEY,
  version               TEXT NOT NULL DEFAULT '1.0.0',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  status                TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','review','published','deprecated')),
  pillar                TEXT NOT NULL
                          CHECK (pillar IN ('understand','use','evaluate','protect')),
  concept_number        INTEGER NOT NULL UNIQUE CHECK (concept_number BETWEEN 1 AND 12),
  tags                  TEXT[] DEFAULT '{}',
  safety_critical       BOOLEAN NOT NULL DEFAULT FALSE,
  occupation_relevant   TEXT[] DEFAULT '{all}',
  canonical_title       TEXT NOT NULL,
  canonical_one_liner   TEXT NOT NULL,
  canonical_explanation TEXT NOT NULL,
  learning_outcome      TEXT NOT NULL,
  estimated_minutes     INTEGER NOT NULL DEFAULT 5,
  prerequisite_ids      TEXT[] DEFAULT '{}',
  unlocks_ids           TEXT[] DEFAULT '{}',
  related_ids           TEXT[] DEFAULT '{}',
  icon_emoji            TEXT NOT NULL DEFAULT '💡',
  color_token           TEXT NOT NULL DEFAULT 'understand',
  sr_initial_interval   INTEGER DEFAULT 3,
  avg_completion_rate   REAL DEFAULT 0,
  avg_retention_score   REAL DEFAULT 0
);

CREATE INDEX idx_concept_pillar ON concept_nodes(pillar);
CREATE INDEX idx_concept_status ON concept_nodes(status);

ALTER TABLE concept_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published concepts readable by all"
  ON concept_nodes FOR SELECT USING (status = 'published');
CREATE POLICY "Only service role can write concepts"
  ON concept_nodes FOR ALL USING (auth.role() = 'service_role');
