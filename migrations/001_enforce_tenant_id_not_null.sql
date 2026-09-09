-- migrations/001_initial_schema.sql
-- Tracked migration: initial schema with tenant_id NOT NULL enforcement
-- Run with: node-pg-migrate up (see package.json db:migrate:tracked)

-- Migration state table (created by node-pg-migrate automatically)
-- Shown here for documentation only

-- Enforce NOT NULL on tenant_id columns (Phase 2 data integrity)
DO $$
BEGIN
  -- leads
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='tenant_id' AND is_nullable='YES') THEN
    ALTER TABLE leads ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
  -- contacts
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='tenant_id' AND is_nullable='YES') THEN
    ALTER TABLE contacts ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
  -- deals
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='tenant_id' AND is_nullable='YES') THEN
    ALTER TABLE deals ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
  -- activities
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='tenant_id' AND is_nullable='YES') THEN
    ALTER TABLE activities ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END
$$;
