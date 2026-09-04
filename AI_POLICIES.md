# Tenant AI Policies & Governance

`ai_policies` defines tenant-level AI rollout controls, runtime constraints, and tool permissions. Every AI execution dynamically inspects the executing tenant's policy in real time before scheduling or invoking tools.

## Policy Schema & Controls

```json
{
  "tenant_id": "tenant_default",
  "mode": "copilot",
  "allowed_tools": [
    "search_customer",
    "create_lead",
    "schedule_task",
    "draft_email",
    "send_email",
    "create_deal",
    "update_deal_stage"
  ],
  "approval_required_tools": [
    "send_email",
    "create_deal",
    "update_deal_stage"
  ],
  "daily_budget_micros": 50000000,
  "max_tokens_per_call": 2048,
  "kill_switch": false,
  "updated_by": "user-uuid",
  "updated_at": "2026-09-04T12:00:00Z"
}
```

## AI Operating Modes

| Mode | Behavior | Execution Permitted |
| :--- | :--- | :--- |
| `disabled` | AI engine completely inactive for the tenant. | ❌ None |
| `shadow` | Generates suggestions logged for admin evaluation; no customer or CRM mutation. | ❌ Evaluation only |
| `copilot` | Real-time assistance; read tools execute, mutation tools generate pending approvals for human review. | ⚠️ Approval-gated |
| `assisted` | Safe low-risk tools run automatically; high-risk tools still require explicit human approval. | ⚠️ Safe tools auto, rest approval-gated |
| `autonomous`| Pre-approved autonomous tools execute within budget limits; requires active escalation rules. | ✅ Policy-constrained |

## Real-Time Enforcement Architecture

1. **Runtime Fetching (`ai-service.js`):**
   - Policies are queried directly from the tenant store or cache at the exact moment of tool invocation, not cached statically at server boot.
   - If `kill_switch === true` or `mode === 'disabled'`, all AI requests immediately terminate with `AI_EXECUTION_BLOCKED`.
2. **Tool Whitelist Guard:**
   - If an agent requests a tool not present in `allowed_tools`, execution is rejected with `TOOL_DISALLOWED`.
   - If `allowed_tools` is empty `[]`, all tool executions are blocked.
3. **Approval Gate (`protected-tool.js`):**
   - Any tool present in `approval_required_tools` or running in `copilot` mode generates an entry in `ai_approvals` table with status `pending`.
   - Returns `{ status: "approval_required", approval_id: "app-..." }` instead of making side effects.
4. **Budget & Rate Quotas:**
   - Checks tenant cumulative token/cost spend against `daily_budget_micros`.
   - Overages halt AI operations until budget reset or operator limit elevation.

## Management Endpoints

- `GET /api/ai/policy` — Retrieves the current tenant's AI governance policy.
- `POST /api/ai/policy` — Updates policy permissions, active mode, tool whitelist, or triggers tenant kill-switch (audited in tenant audit log).

## Verification & Test Coverage

- `ai-service.test.js` — Unit tests for policy verification and disabled tool enforcement.
- `protected-tool.test.js` — Verifies protection gates for high-risk tools.
- `test-specialist-fixes.js` — Validates kill-switch and approval-required tool behavior under simulated adversarial prompt conditions.
