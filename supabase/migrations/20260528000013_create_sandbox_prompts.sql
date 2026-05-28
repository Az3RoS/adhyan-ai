CREATE TABLE sandbox_system_prompts (
  id                  TEXT PRIMARY KEY,
  persona             TEXT NOT NULL,
  locale              TEXT NOT NULL,
  system_prompt       TEXT NOT NULL,
  safety_instructions TEXT NOT NULL,
  max_response_words  INTEGER DEFAULT 100,
  is_active           BOOLEAN DEFAULT TRUE,
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (persona, locale)
);

-- No public read — accessed only via Edge Function with service role
ALTER TABLE sandbox_system_prompts ENABLE ROW LEVEL SECURITY;
