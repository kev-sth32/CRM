CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  webhook_id TEXT NOT NULL,
  webhook_name TEXT,
  url TEXT NOT NULL,
  event TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'delivered',
  attempts INT NOT NULL DEFAULT 1,
  http_status INT,
  response_time_ms INT,
  error TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  replayed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS lead_slas (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'standard',
  max_minutes INT NOT NULL DEFAULT 240,
  elapsed_minutes INT NOT NULL DEFAULT 0,
  is_breached BOOLEAN NOT NULL DEFAULT false,
  deadline_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wh_deliveries_tenant_idx ON webhook_deliveries(tenant_id);
CREATE INDEX IF NOT EXISTS wh_deliveries_hook_idx ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS lead_slas_tenant_idx ON lead_slas(tenant_id);
CREATE INDEX IF NOT EXISTS lead_slas_lead_idx ON lead_slas(lead_id);
