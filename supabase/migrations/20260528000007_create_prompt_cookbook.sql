CREATE TABLE prompt_cookbook (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  prompt_text  TEXT NOT NULL,
  context_note TEXT,
  occupation_tag TEXT,
  concept_id   TEXT REFERENCES concept_nodes(id),
  locale       TEXT NOT NULL,
  use_count    INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_starred   BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_cookbook_user ON prompt_cookbook(user_id);

ALTER TABLE prompt_cookbook ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own cookbook"
  ON prompt_cookbook FOR ALL USING (auth.uid() = user_id);
