# Follow-up Sequence Foundation

Sequences are tenant-owned JSON step definitions. Enrollments track lead, current step, status, and next execution time.

## Preflight safety checks
Every outbound step must re-check the following immediately before sending (`followup-execution.js`):
- Opt-out status (lead has not unsubscribed).
- Frequency limits (not exceeding configured contact frequency).
- Working hours (within tenant business hours).
- Channel policy (channel is active and authorized).
- AI policy (tenant policy allows the action).
- Human handoff state (lead is not in active handoff).
- Enrollment status (enrollment is active, not paused/completed/cancelled).

Paused, resolved, opted-out, or handed-off leads must not receive automated follow-ups.

## Tenant isolation
Cross-tenant sequence enrollment is blocked. `followup-policy.js` enforces that enrollments belong to the enrolling tenant. Verified by `test-security.js` check #52 and `followup-policy.test.js`.

## Follow-up pause
`followup-service.js` provides a pause service that halts active sequence execution for a lead without cancelling the enrollment. Paused enrollments can be resumed.

## Test coverage
- `followup-policy.test.js` — Policy enforcement and opt-out/frequency checks.
- `test-security.js` check #52 — Cross-tenant sequence enrollment isolation.
- `phase4-utils.test.js` — Follow-up policy integration with agent lifecycle.
