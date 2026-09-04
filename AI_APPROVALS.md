# AI Approval Queue

High-risk AI actions must create a pending approval rather than execute immediately. `ai-approval.js` implements tenant-scoped approval requests and one-time approval transitions.

`ai-guardrails.js` provides an execution gate: actions execute only when the tenant is explicitly in autonomous mode and the action is not approval-required. Otherwise it creates a pending approval.

## High-risk actions
- External messages
- Quotes and proposals
- Discounts
- Deletion
- Refunds
- Policy exceptions

## Expiration
Requests expire after 24 hours by default. `approval-worker.js` marks stale pending requests as `expired`; expired requests cannot be approved.

## Lifecycle
```text
pending -> approved -> executed
pending -> rejected
pending -> expired
```

## Execution
`POST /api/ai-approvals/:id/execute` runs the approved action with the following enforcement:
- **Tenant boundary:** Cross-tenant execution returns 403 Forbidden.
- **Status gate:** Only `approved` status may execute. Pending/rejected/expired return 400.
- **Idempotency:** Duplicate execution returns 409 Conflict.
- All executions are audited.

## API endpoints
```http
GET   /api/ai-approvals              # List tenant approvals
PATCH /api/ai-approvals/:id          # Approve or reject (status: approved/rejected)
POST  /api/ai-approvals/:id/execute  # Execute an approved action
```

## UI
The `approvals.html` page provides a dual-tab interface:
1. **AI Approvals** — Pending/approved/rejected/executed actions with approve/reject/execute controls.
2. **Quality Evaluations** — Good/bad/needs-improvement AI conversation reviews used for closed-loop feedback injection.

## Security
- Approvals are tenant-scoped, linked to an AI run, and retain the requested action payload, reviewer, reason, and timestamps.
- Cross-tenant patch and state tampering are rejected (verified by `test-security.js` check #48).
- Never execute a high-risk action from an unapproved or expired request.

## Test coverage
- `ai-guardrails.test.js` — Copilot actions create approvals; autonomous non-approval actions execute.
- `protected-tool.test.js` — High-risk tools return approval requests in copilot mode.
- `test-security.js` checks #26, #48 — Cross-tenant authorization, state gates, execution idempotency, and state tampering rejection.
