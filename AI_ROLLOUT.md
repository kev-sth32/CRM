# SalesOS AI Copilot Rollout Plan

## Progressive Rollout Phases

SalesOS uses a staged progressive activation model to ensure zero disruption, strict tenant data isolation, and comprehensive human-in-the-loop oversight.

| Stage | Mode | Description | Promotion Criteria |
| :--- | :--- | :--- | :--- |
| **Stage 0** | `disabled` | AI provider inactive or missing credentials. Safe fallbacks only. | System initialization; DB migrations applied. |
| **Stage 1** | `shadow` | Generates suggestions logged for internal review; 0 CRM mutation, no customer dispatch. | Groundedness score > 90%, zero uncited claims on 100 benchmark queries. |
| **Stage 2** | `copilot` | Real-time suggestions shown to sales reps in Inbox / Deal view. Every CRM mutation or message requires human approval. | Rep approval rating > 85%, prompt injection defense verified in staging. |
| **Stage 3** | `assisted` | Safe low-risk actions (e.g. read search, draft preparation, task logging) run automatically. Messages and deal stage updates require approval. | Rep override rate < 5%, 0 critical SLA breaches. |
| **Stage 4** | `autonomous` | Pre-approved actions execute autonomously within tenant-configured spending & rate quotas. Escalation triggers active. | 14 days stable in assisted mode; human escalation rules verified. |

## Promotion & Gating Gates

1. **Evaluation Quality Thresholds (`AI_EVALUATION.md`):**
   - Groundedness > 90% against approved knowledge base articles.
   - 0 prompt injection bypasses detected in test suite (`test-specialist-round2.js`).
   - Latency P95 < 2500ms for conversational completions.
2. **Operational Safeguards:**
   - Active escalation rules configured per tenant.
   - 24-hour approval expiry worker operational (`approval-worker.js`).
   - Tenant budget ceilings configured (`daily_budget_micros`).
3. **Emergency Kill-Switch & Rollback:**
   - Single-click emergency kill-switch in tenant settings (`POST /api/ai/policy` with `kill_switch: true`).
   - Instantly halts autonomous & copilot tool executions, reverting to manual agent workflow.
   - All pending approvals remain safely queued or transition to expired without destructive side effects.
