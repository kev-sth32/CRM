CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  access_token TEXT NOT NULL UNIQUE,
  quote_number TEXT NOT NULL,
  title TEXT NOT NULL,
  deal_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  currency CHAR(3) NOT NULL DEFAULT 'NPR',
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  terms TEXT,
  signer_name TEXT,
  signer_email TEXT,
  signature_data TEXT,
  evidence_bundle JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  secret TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS quotes_tenant_idx ON quotes(tenant_id);
CREATE INDEX IF NOT EXISTS quotes_token_idx ON quotes(access_token);
CREATE INDEX IF NOT EXISTS webhooks_tenant_idx ON webhooks(tenant_id);
