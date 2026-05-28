CREATE TABLE community_stories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_at        TIMESTAMPTZ DEFAULT NOW(),
  story_text          TEXT NOT NULL,
  locale              TEXT NOT NULL,
  occupation          TEXT,
  state               TEXT,
  district            TEXT,
  story_type          TEXT DEFAULT 'success'
                        CHECK (story_type IN ('success','warning','tip','question')),
  relevant_concept_id TEXT REFERENCES concept_nodes(id),
  moderation_status   TEXT DEFAULT 'pending'
                        CHECK (moderation_status IN ('pending','approved','rejected','featured')),
  moderated_by        TEXT,
  moderated_at        TIMESTAMPTZ,
  editorial_note      TEXT,
  display_name        TEXT DEFAULT 'Anonymous',
  publish_date        DATE
);

CREATE INDEX idx_stories_status ON community_stories(moderation_status, publish_date);

ALTER TABLE community_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved stories readable"
  ON community_stories FOR SELECT
  USING (moderation_status IN ('approved','featured'));
CREATE POLICY "Anyone can submit a story"
  ON community_stories FOR INSERT WITH CHECK (TRUE);
