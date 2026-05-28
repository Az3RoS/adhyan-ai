CREATE TABLE scam_alerts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_at         TIMESTAMPTZ DEFAULT NOW(),
  expires_at          TIMESTAMPTZ,
  alert_title_en      TEXT NOT NULL,
  alert_title_hi      TEXT,
  alert_title_bn      TEXT,
  scam_message_sample TEXT,
  warning_signs       TEXT[] DEFAULT '{}',
  safe_action         TEXT NOT NULL,
  affected_states     TEXT[] DEFAULT '{all}',
  affected_occupations TEXT[] DEFAULT '{all}',
  severity            TEXT DEFAULT 'medium'
                        CHECK (severity IN ('low','medium','high','critical')),
  source              TEXT DEFAULT 'cyber_dost',
  source_url          TEXT,
  verified            BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_alerts_active ON scam_alerts(expires_at, severity);

ALTER TABLE scam_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active alerts readable"
  ON scam_alerts FOR SELECT
  USING (expires_at IS NULL OR expires_at > NOW());
CREATE POLICY "Only service role can write alerts"
  ON scam_alerts FOR ALL USING (auth.role() = 'service_role');
