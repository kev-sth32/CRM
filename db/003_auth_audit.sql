CREATE TABLE IF NOT EXISTS sessions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_logs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
 user_id UUID REFERENCES users(id) ON DELETE SET NULL, actor_type TEXT NOT NULL DEFAULT 'user', action TEXT NOT NULL,
 entity_type TEXT, entity_id UUID, details JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(token_hash); CREATE INDEX IF NOT EXISTS audit_tenant_time_idx ON audit_logs(tenant_id,created_at DESC);
INSERT INTO users(tenant_id,name,email,role) SELECT id,'Arjun Sharma','arjun@acmecloud.example','owner' FROM tenants WHERE slug='acme-cloud' ON CONFLICT (tenant_id,email) DO NOTHING;
