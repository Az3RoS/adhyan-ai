CREATE TABLE messages_in_a_bottle (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  author_occupation TEXT,
  author_state      TEXT,
  author_ai_age     TEXT,
  message_text      TEXT NOT NULL,
  locale            TEXT NOT NULL,
  target_concept_id TEXT NOT NULL REFERENCES concept_nodes(id),
  target_day        INTEGER DEFAULT 3 CHECK (target_day BETWEEN 1 AND 5),
  moderation_status TEXT DEFAULT 'pending'
                      CHECK (moderation_status IN ('pending','approved','rejected')),
  moderated_by      TEXT,
  moderated_at      TIMESTAMPTZ,
  delivery_count    INTEGER DEFAULT 0,
  positive_reactions INTEGER DEFAULT 0
);

CREATE INDEX idx_bottles_concept ON messages_in_a_bottle(target_concept_id, target_day);

ALTER TABLE messages_in_a_bottle ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved bottles readable"
  ON messages_in_a_bottle FOR SELECT USING (moderation_status = 'approved');
CREATE POLICY "Anyone can submit a bottle"
  ON messages_in_a_bottle FOR INSERT WITH CHECK (TRUE);
