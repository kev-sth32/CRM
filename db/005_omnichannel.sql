CREATE TABLE IF NOT EXISTS channels (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
 type TEXT NOT NULL, name TEXT NOT NULL, provider TEXT, config JSONB NOT NULL DEFAULT '{}'::jsonb, is_active BOOLEAN NOT NULL DEFAULT true,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(tenant_id,type,name)
);
CREATE TABLE IF NOT EXISTS conversations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
 contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL, lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
 opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL, channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
 assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL, status TEXT NOT NULL DEFAULT 'open', subject TEXT,
 last_message_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS messages (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
 conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, external_id TEXT, direction TEXT NOT NULL CHECK(direction IN ('inbound','outbound')),
 sender_type TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'received', metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
 occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(tenant_id,external_id)
);
CREATE INDEX IF NOT EXISTS conversations_tenant_idx ON conversations(tenant_id,status,last_message_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(tenant_id,conversation_id,occurred_at);
