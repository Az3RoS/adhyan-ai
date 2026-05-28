CREATE TABLE user_progress (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  concept_id          TEXT NOT NULL REFERENCES concept_nodes(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  status              TEXT NOT NULL DEFAULT 'not_started'
                        CHECK (status IN ('not_started','in_progress','mastered')),
  current_day         INTEGER DEFAULT 0 CHECK (current_day BETWEEN 0 AND 5),
  started_at          TIMESTAMPTZ,
  mastered_at         TIMESTAMPTZ,
  review_due_at       TIMESTAMPTZ,
  ease_factor         REAL DEFAULT 2.5,
  interval_days       INTEGER DEFAULT 1,
  repetitions         INTEGER DEFAULT 0,
  last_review_quality INTEGER,
  helpful_today       BOOLEAN,
  retrieval_answered  BOOLEAN,
  UNIQUE (user_id, concept_id)
);

CREATE INDEX idx_progress_user     ON user_progress(user_id);
CREATE INDEX idx_progress_due      ON user_progress(user_id, review_due_at);

CREATE TRIGGER user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own progress only"
  ON user_progress FOR ALL USING (auth.uid() = user_id);
