ALTER TABLE connector_events ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE connector_events ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;
ALTER TABLE connector_events ADD COLUMN IF NOT EXISTS available_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE connector_events ADD COLUMN IF NOT EXISTS worker_id TEXT;
CREATE INDEX IF NOT EXISTS connector_events_available_idx ON connector_events(status,available_at);
