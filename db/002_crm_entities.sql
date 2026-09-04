CREATE TABLE IF NOT EXISTS companies (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
 name TEXT NOT NULL, industry TEXT, website TEXT, phone TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS contacts (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
 company_id UUID REFERENCES companies(id) ON DELETE SET NULL, name TEXT NOT NULL, email TEXT, phone TEXT,
 title TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS opportunities (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
 contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL, company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
 name TEXT NOT NULL, stage TEXT NOT NULL DEFAULT 'New lead', amount NUMERIC(14,2) NOT NULL DEFAULT 0, probability INTEGER NOT NULL DEFAULT 10 CHECK(probability BETWEEN 0 AND 100), expected_close_date DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS activities (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
 lead_id UUID REFERENCES leads(id) ON DELETE CASCADE, opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
 user_id UUID REFERENCES users(id) ON DELETE SET NULL, type TEXT NOT NULL, title TEXT NOT NULL, due_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS contacts_tenant_idx ON contacts(tenant_id); CREATE INDEX IF NOT EXISTS companies_tenant_idx ON companies(tenant_id); CREATE INDEX IF NOT EXISTS opportunities_tenant_idx ON opportunities(tenant_id,stage); CREATE INDEX IF NOT EXISTS activities_tenant_idx ON activities(tenant_id,due_at);
