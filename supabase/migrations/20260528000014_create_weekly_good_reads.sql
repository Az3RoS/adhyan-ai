CREATE TABLE weekly_good_reads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publish_date          DATE NOT NULL UNIQUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  title_en              TEXT NOT NULL,
  title_hi              TEXT,
  title_bn              TEXT,
  source_name           TEXT NOT NULL,
  source_url            TEXT NOT NULL,
  why_this_matters_en   TEXT NOT NULL,
  why_this_matters_hi   TEXT,
  why_this_matters_bn   TEXT,
  read_time_minutes     INTEGER DEFAULT 5,
  content_type          TEXT DEFAULT 'article'
                          CHECK (content_type IN ('article','video','podcast','interactive')),
  suitable_personas     TEXT[] DEFAULT '{all}',
  suitable_age_groups   TEXT[] DEFAULT '{all}',
  related_concept_id    TEXT REFERENCES concept_nodes(id)
);

ALTER TABLE weekly_good_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published reads"
  ON weekly_good_reads FOR SELECT USING (publish_date <= CURRENT_DATE);
CREATE POLICY "Only service role can write reads"
  ON weekly_good_reads FOR ALL USING (auth.role() = 'service_role');
