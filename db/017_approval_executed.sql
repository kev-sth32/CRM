ALTER TABLE ai_approvals DROP CONSTRAINT IF EXISTS ai_approvals_status_check;
ALTER TABLE ai_approvals ADD CONSTRAINT ai_approvals_status_check CHECK(status IN ('pending','approved','rejected','expired','executed'));
