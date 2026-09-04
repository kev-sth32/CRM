ALTER TABLE ai_approvals ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (now()+interval '24 hours');
CREATE INDEX IF NOT EXISTS ai_approvals_expiry_idx ON ai_approvals(status,expires_at);
