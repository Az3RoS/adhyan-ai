# SCHEMA.md — Database Schema

All tables live in Supabase (PostgreSQL). Row Level Security is enabled on every table. Migration files live in `supabase/migrations/`.

---

## Table: `concept_nodes`

The 12 canonical concept records. One row per concept. Never more than 12 rows in production. Content team manages this via Supabase Studio.

```sql
CREATE TABLE concept_nodes (
  id                    TEXT PRIMARY KEY,         -- e.g. 'concept_10_scam_literacy'
  version               TEXT NOT NULL DEFAULT '1.0.0',  -- semver
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  status                TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','review','published','deprecated')),

  -- Taxonomy
  pillar                TEXT NOT NULL
                          CHECK (pillar IN ('understand','use','evaluate','protect')),
  concept_number        INTEGER NOT NULL UNIQUE CHECK (concept_number BETWEEN 1 AND 12),
  tags                  TEXT[] DEFAULT '{}',
  safety_critical       BOOLEAN NOT NULL DEFAULT FALSE,
  occupation_relevant   TEXT[] DEFAULT '{all}',

  -- Canonical content (English, persona-agnostic)
  canonical_title       TEXT NOT NULL,
  canonical_one_liner   TEXT NOT NULL,
  canonical_explanation TEXT NOT NULL,
  learning_outcome      TEXT NOT NULL,
  estimated_minutes     INTEGER NOT NULL DEFAULT 5,

  -- Graph links
  prerequisite_ids      TEXT[] DEFAULT '{}',  -- concept_ids that must be mastered first
  unlocks_ids           TEXT[] DEFAULT '{}',  -- concept_ids this unlocks
  related_ids           TEXT[] DEFAULT '{}',

  -- Display
  icon_emoji            TEXT NOT NULL DEFAULT '💡',
  color_token           TEXT NOT NULL DEFAULT 'gold',

  -- Spaced repetition defaults
  sr_initial_interval   INTEGER DEFAULT 3,    -- days

  -- Metrics (updated by triggers)
  avg_completion_rate   REAL DEFAULT 0,
  avg_retention_score   REAL DEFAULT 0
);

-- Index
CREATE INDEX idx_concept_pillar ON concept_nodes(pillar);
CREATE INDEX idx_concept_status ON concept_nodes(status);

-- RLS
ALTER TABLE concept_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published concepts readable by all"
  ON concept_nodes FOR SELECT USING (status = 'published');
CREATE POLICY "Only service role can write"
  ON concept_nodes FOR ALL USING (auth.role() = 'service_role');
```

---

## Table: `explanation_skins`

One skin per (concept × locale × persona) combination. This is the main content table.

```sql
CREATE TABLE explanation_skins (
  skin_id               TEXT PRIMARY KEY,  -- e.g. 'c10_hi_elderly'
  concept_id            TEXT NOT NULL REFERENCES concept_nodes(id),
  version               TEXT NOT NULL DEFAULT '1.0.0',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  status                TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','review','published','deprecated')),

  -- Identity
  locale                TEXT NOT NULL CHECK (locale IN ('en','hi','bn','ta','te','mr','kn')),
  persona               TEXT NOT NULL
                          CHECK (persona IN ('elderly','farmer','student','gig_worker',
                                            'clerk','shop_owner','homemaker',
                                            'domestic_worker','professional','generic')),
  age_group             TEXT CHECK (age_group IN ('13-18','18-27','28-43','44-59','60+')),
  literacy_level        TEXT DEFAULT 'medium' CHECK (literacy_level IN ('low','medium','high')),

  -- Safety gate
  is_safety_critical    BOOLEAN NOT NULL DEFAULT FALSE,
  human_reviewed        BOOLEAN NOT NULL DEFAULT FALSE,
  reviewer_id           TEXT,               -- Supabase user ID of reviewer
  reviewed_at           TIMESTAMPTZ,

  -- The 5-day micro-card content
  day1_hook             TEXT NOT NULL,      -- Story/analogy, no concept name yet
  day2_reveal           TEXT NOT NULL,      -- Concept explained in plain language
  day3_practice         TEXT NOT NULL,      -- "Try this now" instruction
  day4_retrieval_q      TEXT NOT NULL,      -- The campfire question
  day4_acceptable_ans   TEXT[] NOT NULL,    -- Keywords accepted as correct
  day5_check_prompt     TEXT NOT NULL,      -- "Did this help today?"
  one_liner             TEXT NOT NULL,      -- 10-word summary

  -- Analogy references
  primary_analogy_id    TEXT REFERENCES analogies(analogy_id),
  secondary_analogy_id  TEXT REFERENCES analogies(analogy_id),

  -- Format specification
  primary_format        TEXT DEFAULT 'audio'
                          CHECK (primary_format IN ('audio','visual','interactive','text')),
  reading_required      BOOLEAN DEFAULT FALSE,
  max_words_per_screen  INTEGER DEFAULT 18,
  font_size_class       TEXT DEFAULT 'md' CHECK (font_size_class IN ('sm','md','lg','xl')),
  voice_speed           TEXT DEFAULT 'normal' CHECK (voice_speed IN ('slow','normal','fast')),
  tts_voice_id          TEXT,              -- Bhashini voice identifier
  offline_cacheable     BOOLEAN DEFAULT TRUE,

  -- Audio
  audio_url             TEXT,              -- Cloudflare CDN URL to pre-rendered MP3
  audio_duration_seconds INTEGER,

  -- Completion
  completion_message    TEXT NOT NULL,
  completion_style      TEXT DEFAULT 'quiet_glow'
                          CHECK (completion_style IN ('quiet_glow','warm_pulse','confetti')),
  family_bridge_summary TEXT,             -- Weekly summary sent to registered family member

  -- WhatsApp card
  wa_headline           TEXT,
  wa_body               TEXT,
  wa_cta                TEXT,
  wa_image_key          TEXT,             -- Key in Supabase Storage

  -- Metrics
  completion_rate       REAL DEFAULT 0,
  retention_score       REAL DEFAULT 0,
  helpful_rating        REAL DEFAULT 0,   -- % who tapped "this helped me today"
  drop_off_day          INTEGER           -- Which day 1-5 users quit
);

-- Indexes
CREATE INDEX idx_skins_concept ON explanation_skins(concept_id);
CREATE INDEX idx_skins_locale_persona ON explanation_skins(locale, persona);
CREATE INDEX idx_skins_status ON explanation_skins(status);

-- Composite unique: one skin per concept × locale × persona
CREATE UNIQUE INDEX idx_skins_unique ON explanation_skins(concept_id, locale, persona);

-- RLS: block safety-critical unreviewed content
ALTER TABLE explanation_skins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published and reviewed skins only"
  ON explanation_skins FOR SELECT
  USING (
    status = 'published'
    AND NOT (is_safety_critical = TRUE AND human_reviewed = FALSE)
  );
```

---

## Table: `analogies`

Reusable analogy library. One analogy can serve multiple concepts and personas.

```sql
CREATE TABLE analogies (
  analogy_id            TEXT PRIMARY KEY,   -- e.g. 'a07_confident_relative'
  name                  TEXT NOT NULL,
  analogy_type          TEXT NOT NULL
                          CHECK (analogy_type IN ('folk','cinema','myth','everyday','game','scripture')),
  origin                TEXT,               -- cultural origin tag
  suitable_concepts     TEXT[] DEFAULT '{}',
  suitable_personas     TEXT[] DEFAULT '{}',
  unsuitable_personas   TEXT[] DEFAULT '{}',
  suitable_locales      TEXT[] DEFAULT '{}',
  contributed_by        TEXT DEFAULT 'content_team',

  -- Content per locale
  content_hi_setup      TEXT,
  content_hi_punchline  TEXT,
  content_hi_bridge     TEXT,
  content_bn_setup      TEXT,
  content_bn_punchline  TEXT,
  content_bn_bridge     TEXT,
  content_en_setup      TEXT,
  content_en_punchline  TEXT,
  content_en_bridge     TEXT,

  -- Metrics
  usage_count           INTEGER DEFAULT 0,
  resonance_score       REAL DEFAULT 0,     -- % concept completion after seeing this analogy
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE analogies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Analogies public read" ON analogies FOR SELECT USING (TRUE);
```

---

## Table: `user_profiles`

Server-side user state. Mirrors the local SQLite but syncs for family bridge and WhatsApp features.

```sql
CREATE TABLE user_profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),

  -- Preferences
  locale                TEXT NOT NULL DEFAULT 'hi'
                          CHECK (locale IN ('en','hi','bn','ta','te','mr','kn')),
  persona               TEXT DEFAULT 'generic',
  occupation            TEXT,
  age_group             TEXT,

  -- Streak
  streak_days           INTEGER DEFAULT 0,
  longest_streak        INTEGER DEFAULT 0,
  last_active_date      DATE,
  streak_freeze_available INTEGER DEFAULT 0,  -- earnable, prevents streak break

  -- Milestones
  highest_milestone_day INTEGER DEFAULT 0,
  is_mentor             BOOLEAN DEFAULT FALSE,
  is_contributor        BOOLEAN DEFAULT FALSE,
  ai_age_level          TEXT DEFAULT 'curious_child'
                          CHECK (ai_age_level IN ('curious_child','apprentice','journeyman',
                                                   'craftsperson','elder','keeper_of_fire')),

  -- Family bridge
  family_contact_phone  TEXT,               -- E.164 format, encrypted
  family_bridge_enabled BOOLEAN DEFAULT FALSE,

  -- WhatsApp
  whatsapp_phone        TEXT,               -- E.164, encrypted
  wa_morning_digest     BOOLEAN DEFAULT FALSE,
  wa_urgent_alerts      BOOLEAN DEFAULT TRUE,
  wa_weekly_story       BOOLEAN DEFAULT FALSE,

  -- Privacy
  district              TEXT,               -- For local feed assembly
  state                 TEXT,
  data_deletion_requested BOOLEAN DEFAULT FALSE
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
```

---

## Table: `user_progress`

One row per (user × concept). Updated as user advances through the 5-day sequence.

```sql
CREATE TABLE user_progress (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES user_profiles(id),
  concept_id            TEXT NOT NULL REFERENCES concept_nodes(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),

  -- Progress
  status                TEXT NOT NULL DEFAULT 'not_started'
                          CHECK (status IN ('not_started','in_progress','mastered')),
  current_day           INTEGER DEFAULT 0 CHECK (current_day BETWEEN 0 AND 5),
  started_at            TIMESTAMPTZ,
  mastered_at           TIMESTAMPTZ,

  -- Spaced repetition (SM-2)
  review_due_at         TIMESTAMPTZ,
  ease_factor           REAL DEFAULT 2.5,
  interval_days         INTEGER DEFAULT 1,
  repetitions           INTEGER DEFAULT 0,
  last_review_quality   INTEGER,           -- 0-5 SM-2 quality rating

  -- Engagement
  helpful_today         BOOLEAN,           -- Day 5 check response
  retrieval_answered    BOOLEAN,           -- Day 4 retrieval completed

  UNIQUE (user_id, concept_id)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own progress only"
  ON user_progress FOR ALL USING (auth.uid() = user_id);

-- Function: update streak on progress insert/update
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET
    last_active_date = CURRENT_DATE,
    streak_days = CASE
      WHEN last_active_date = CURRENT_DATE - 1 THEN streak_days + 1
      WHEN last_active_date = CURRENT_DATE THEN streak_days
      ELSE 1
    END,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_progress_update
  AFTER INSERT OR UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_user_streak();
```

---

## Table: `prompt_cookbook`

User-saved prompts. The core stickiness feature.

```sql
CREATE TABLE prompt_cookbook (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES user_profiles(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),

  prompt_text           TEXT NOT NULL,
  context_note          TEXT,             -- User's own annotation
  occupation_tag        TEXT,
  concept_id            TEXT REFERENCES concept_nodes(id),  -- Which concept produced this
  locale                TEXT NOT NULL,
  use_count             INTEGER DEFAULT 0,
  last_used_at          TIMESTAMPTZ,
  is_starred            BOOLEAN DEFAULT FALSE
);

ALTER TABLE prompt_cookbook ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own cookbook" ON prompt_cookbook FOR ALL USING (auth.uid() = user_id);
```

---

## Table: `messages_in_a_bottle`

Peer tips queued for delivery at the right concept + progress stage.

```sql
CREATE TABLE messages_in_a_bottle (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ DEFAULT NOW(),

  -- Author (anonymised)
  author_occupation     TEXT,
  author_state          TEXT,
  author_ai_age         TEXT,             -- ai_age_level at time of writing

  -- Content
  message_text          TEXT NOT NULL,
  locale                TEXT NOT NULL,

  -- Targeting: surface to users who reach this concept on this day
  target_concept_id     TEXT NOT NULL REFERENCES concept_nodes(id),
  target_day            INTEGER DEFAULT 3 CHECK (target_day BETWEEN 1 AND 5),

  -- Moderation
  moderation_status     TEXT DEFAULT 'pending'
                          CHECK (moderation_status IN ('pending','approved','rejected')),
  moderated_by          TEXT,
  moderated_at          TIMESTAMPTZ,

  -- Delivery tracking
  delivery_count        INTEGER DEFAULT 0,
  positive_reactions    INTEGER DEFAULT 0
);

ALTER TABLE messages_in_a_bottle ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved bottles readable"
  ON messages_in_a_bottle FOR SELECT USING (moderation_status = 'approved');
```

---

## Table: `community_stories`

User-submitted stories for the daily feed.

```sql
CREATE TABLE community_stories (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_at          TIMESTAMPTZ DEFAULT NOW(),

  -- Story content
  story_text            TEXT NOT NULL,      -- Max 200 words
  locale                TEXT NOT NULL,
  occupation            TEXT,
  state                 TEXT,
  district              TEXT,

  -- Classification
  story_type            TEXT DEFAULT 'success'
                          CHECK (story_type IN ('success','warning','tip','question')),
  relevant_concept_id   TEXT REFERENCES concept_nodes(id),

  -- Moderation
  moderation_status     TEXT DEFAULT 'pending'
                          CHECK (moderation_status IN ('pending','approved','rejected','featured')),
  moderated_by          TEXT,
  moderated_at          TIMESTAMPTZ,
  editorial_note        TEXT,             -- Arnab's 2-line framing

  -- Display
  display_name          TEXT DEFAULT 'Anonymous',
  publish_date          DATE              -- When to include in daily feed
);

ALTER TABLE community_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved stories readable"
  ON community_stories FOR SELECT USING (moderation_status IN ('approved','featured'));
CREATE POLICY "Anyone can submit"
  ON community_stories FOR INSERT WITH CHECK (TRUE);
```

---

## Table: `tool_directory`

The curated AI tool listings for the "Tool of the Week" feature and horizon map.

```sql
CREATE TABLE tool_directory (
  id                    TEXT PRIMARY KEY,  -- e.g. 'meghdoot_weather'
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),

  -- Identity
  name                  TEXT NOT NULL,
  name_hi               TEXT,
  name_bn               TEXT,
  url                   TEXT NOT NULL,
  icon_url              TEXT,

  -- Classification
  category              TEXT NOT NULL,
  suitable_occupations  TEXT[] DEFAULT '{all}',
  suitable_age_groups   TEXT[] DEFAULT '{all}',
  supported_locales     TEXT[] DEFAULT '{en}',
  is_free               BOOLEAN DEFAULT TRUE,
  requires_account      BOOLEAN DEFAULT FALSE,
  works_offline         BOOLEAN DEFAULT FALSE,
  data_connectivity     TEXT DEFAULT '3g' CHECK (data_connectivity IN ('2g','3g','wifi')),

  -- Content
  description_en        TEXT NOT NULL,
  description_hi        TEXT,
  description_bn        TEXT,
  one_user_review_en    TEXT,
  one_user_review_hi    TEXT,
  one_user_review_bn    TEXT,
  reviewer_occupation   TEXT,
  reviewer_state        TEXT,

  -- Curation
  featured_week         DATE,           -- If tool of the week, the Sunday date
  is_active             BOOLEAN DEFAULT TRUE,
  verified_by           TEXT,
  verified_at           TIMESTAMPTZ
);

ALTER TABLE tool_directory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active tools public read" ON tool_directory FOR SELECT USING (is_active = TRUE);
```

---

## Table: `daily_feed_cache`

Pre-assembled daily feed results, cached per (occupation, locale, district, date).

```sql
CREATE TABLE daily_feed_cache (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_date            DATE NOT NULL,
  occupation            TEXT NOT NULL,
  locale                TEXT NOT NULL,
  district              TEXT,

  feed_json             JSONB NOT NULL,   -- Array of DailyCard objects
  generated_at          TIMESTAMPTZ DEFAULT NOW(),
  expires_at            TIMESTAMPTZ DEFAULT NOW() + INTERVAL '36 hours',

  UNIQUE (cache_date, occupation, locale, district)
);

-- Auto-cleanup
CREATE OR REPLACE FUNCTION cleanup_old_feed_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM daily_feed_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## Table: `scam_alerts`

Active scam alerts sourced from Cyber Dost + community reports.

```sql
CREATE TABLE scam_alerts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_at           TIMESTAMPTZ DEFAULT NOW(),
  expires_at            TIMESTAMPTZ,

  -- Content
  alert_title_en        TEXT NOT NULL,
  alert_title_hi        TEXT,
  alert_title_bn        TEXT,
  scam_message_sample   TEXT,           -- The actual scam message text
  warning_signs         TEXT[] DEFAULT '{}',
  safe_action           TEXT NOT NULL,

  -- Targeting
  affected_states       TEXT[] DEFAULT '{all}',
  affected_occupations  TEXT[] DEFAULT '{all}',
  severity              TEXT DEFAULT 'medium'
                          CHECK (severity IN ('low','medium','high','critical')),

  -- Source
  source                TEXT DEFAULT 'cyber_dost',
  source_url            TEXT,
  verified              BOOLEAN DEFAULT FALSE
);

ALTER TABLE scam_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active alerts readable" ON scam_alerts FOR SELECT
  USING (expires_at IS NULL OR expires_at > NOW());
```

---

## Table: `sandbox_system_prompts`

Per-persona system prompts for the AI sandbox. Managed by content team.

```sql
CREATE TABLE sandbox_system_prompts (
  id                    TEXT PRIMARY KEY,   -- e.g. 'elderly_hi'
  persona               TEXT NOT NULL,
  locale                TEXT NOT NULL,
  system_prompt         TEXT NOT NULL,
  safety_instructions   TEXT NOT NULL,
  max_response_words    INTEGER DEFAULT 100,
  is_active             BOOLEAN DEFAULT TRUE,
  updated_at            TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (persona, locale)
);

ALTER TABLE sandbox_system_prompts ENABLE ROW LEVEL SECURITY;
-- No public read — accessed only via Edge Function with service role
```

---

## Table: `weekly_good_reads`

Curated external content for the weekly read feature.

```sql
CREATE TABLE weekly_good_reads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publish_date          DATE NOT NULL UNIQUE,  -- The Sunday it goes live
  created_at            TIMESTAMPTZ DEFAULT NOW(),

  -- Content
  title_en              TEXT NOT NULL,
  title_hi              TEXT,
  title_bn              TEXT,
  source_name           TEXT NOT NULL,
  source_url            TEXT NOT NULL,
  why_this_matters_en   TEXT NOT NULL,        -- Max 2 sentences
  why_this_matters_hi   TEXT,
  why_this_matters_bn   TEXT,
  read_time_minutes     INTEGER DEFAULT 5,
  content_type          TEXT DEFAULT 'article'
                          CHECK (content_type IN ('article','video','podcast','interactive')),

  -- Targeting
  suitable_personas     TEXT[] DEFAULT '{all}',
  suitable_age_groups   TEXT[] DEFAULT '{all}',
  related_concept_id    TEXT REFERENCES concept_nodes(id)
);

ALTER TABLE weekly_good_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published reads"
  ON weekly_good_reads FOR SELECT USING (publish_date <= CURRENT_DATE);
```

---

## Supabase Storage Buckets

```sql
-- Audio files (pre-rendered TTS)
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true);

-- Card images and illustrations
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- WhatsApp card images
INSERT INTO storage.buckets (id, name, public)
VALUES ('wa-cards', 'wa-cards', true);

-- Storage policies
CREATE POLICY "Public audio read" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio');

CREATE POLICY "Public image read" ON storage.objects
  FOR SELECT USING (bucket_id IN ('images', 'wa-cards'));

CREATE POLICY "Service role uploads" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

---

## Migrations Order

```
001_create_concept_nodes.sql
002_create_explanation_skins.sql
003_create_analogies.sql
004_create_user_profiles.sql
005_create_user_progress.sql
006_create_prompt_cookbook.sql
007_create_messages_in_a_bottle.sql
008_create_community_stories.sql
009_create_tool_directory.sql
010_create_daily_feed_cache.sql
011_create_scam_alerts.sql
012_create_sandbox_prompts.sql
013_create_weekly_good_reads.sql
014_create_streak_trigger.sql
015_seed_concept_nodes.sql          -- The 12 concepts
016_seed_analogies.sql               -- Starter analogy library
017_seed_tool_directory.sql          -- First 10 tools
018_seed_sandbox_prompts.sql         -- Per-persona system prompts
019_seed_scam_alerts.sql             -- Launch scam alerts
```
