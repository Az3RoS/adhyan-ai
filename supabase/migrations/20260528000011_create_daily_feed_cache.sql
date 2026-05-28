CREATE TABLE daily_feed_cache (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_date   DATE NOT NULL,
  occupation   TEXT NOT NULL,
  locale       TEXT NOT NULL,
  district     TEXT,
  feed_json    JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ DEFAULT NOW() + INTERVAL '36 hours',
  UNIQUE (cache_date, occupation, locale, COALESCE(district, ''))
);

CREATE INDEX idx_feed_cache_lookup
  ON daily_feed_cache(cache_date, occupation, locale);

-- Auto-cleanup stale cache entries (run via pg_cron or on each write)
CREATE OR REPLACE FUNCTION cleanup_old_feed_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM daily_feed_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
