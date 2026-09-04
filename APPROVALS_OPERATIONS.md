# SalesOS AI Approvals Operations Guide

## Overview
High-risk AI actions (such as sending emails, dispatching webhooks, or updating high-value deals) are intercepted by `protected-tool.js` and queued into `ai_approvals`. Operators review and act on these items via the web interface (`/approvals.html`) or through REST endpoints.

## Approval Lifecycle

```
       [AI Suggestion Triggered]
                  │
                  ▼
         ┌─────────────────┐
         │ Status: PENDING │ ── (24hr timeout) ──► ┌─────────────────┐
         └─────────────────┘                       │ Status: EXPIRED │
            │           │                          └─────────────────┘
            │           │
    (Approve)       (Reject)
            │           │
            ▼           ▼
   ┌───────────┐  ┌────────────┐
   │ APPROVED  │  │  REJECTED  │
   └───────────┘  └────────────┘
         │
    (Execution)
         │
         ▼
   ┌───────────┐
   │ EXECUTED  │
   └───────────┘
```

## Expiry Engine & Worker (`approval-worker.js`)
- **Default TTL:** 24 hours from creation (`expires_at = created_at + 24h`).
- **Worker Execution:** Periodic background cron running every 60 seconds scans for `status = 'pending' AND expires_at < NOW()`.
- **State Transition:** Automatically sets status to `expired`. Expired approvals cannot be approved or replayed. A fresh proposal must be initiated if the action is still desired.

## Operational Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/ai/approvals` | List tenant approval requests (filterable by `status=pending,approved,rejected,expired`). |
| `POST` | `/api/ai/approvals/:id/approve` | Approve a pending item. Atomically updates status to `approved` and records operator UUID. |
| `POST` | `/api/ai/approvals/:id/reject` | Reject a pending item with required reason comment. Updates status to `rejected`. |
| `POST` | `/api/ai/approvals/:id/execute` | Execute an approved item via `approval-executor.js` to trigger underlying tool actions. |

## Web UI Operations (`/approvals.html`)
The Approvals dashboard offers:
- Filterable counters (Pending, Approved, Rejected, Expired).
- Diff / payload viewer highlighting the suggested parameters, target entity (Deal, Contact, Lead), and estimated impact.
- 1-click Approve with execution confirmation or Reject with feedback.
- Toast notifications and audit trail tracking.

## Incident & Escalation Playbook
1. **High Expiry Volume:** Indicates human operators are falling behind queue backlog or SLAs are too short. Check operator alert integrations.
2. **Execution Failures:** If an approved item fails during execution (e.g. SMTP down or target entity deleted), the item is flagged `execution_failed` with error logs in `ai_runs`.
3. **Replay Protection:** Approvals can only transition ONCE out of `pending`. Re-submitting approval for already `approved` or `rejected` requests returns HTTP 409 Conflict.

## Automated Testing
- `protected-tool.test.js` — High-risk tool interception.
- `ai-guardrails.test.js` — State transition enforcement and execution gate.
- `test-prd-completion.js` — End-to-end approval queue creation, approval, and execution verification.
