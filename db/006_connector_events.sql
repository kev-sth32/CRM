CREATE TABLE IF NOT EXISTS connector_events (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
 channel_id UUID REFERENCES channels(id) ON DELETE SET NULL, provider TEXT NOT NULL, external_id TEXT NOT NULL,
 event_type TEXT NOT NULL, payload JSONB NOT NULL DEFAULT '{}'::jsonb, status TEXT NOT NULL DEFAULT 'received',
 error TEXT, received_at TIMESTAMPTZ NOT NULL DEFAULT now(), processed_at TIMESTAMPTZ,
 UNIQUE(tenant_id,provider,external_id)
);
CREATE INDEX IF NOT EXISTS connector_events_pending_idx ON connector_events(tenant_id,status,received_at);
