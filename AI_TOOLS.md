# AI Tool Registry

## Tool contract
Every AI tool must declare:

```json
{"name":"search_customer","description":"Search current tenant customers","input_schema":{},"permission":"contacts.read","requires_confirmation":false,"audit_action":"ai.search_customer"}
```

## Execution rules
1. Authenticate agent and user context.
2. Resolve tenant from session/job context.
3. Validate input against schema.
4. Check permission and approval policy.
5. Execute through a service function, never direct model SQL.
6. Redact sensitive output.
7. Validate result schema.
8. Write an AI audit event.
9. Return result plus confidence/source metadata.

## Implemented tools
`ai-tools.js` registers the following tenant-scoped CRM tools:

| Tool | Permission | Description |
|------|-----------|-------------|
| `search_customer` | `contacts.read` | Search current tenant customers. |
| `get_customer_history` | `contacts.read` | Returns tenant-scoped contact, opportunities, conversations, and tasks. |
| `search_products` | `products.read` | Search current tenant product catalog. |
| `create_lead` | `leads.write` | Create a new lead with field allowlist, tenant scoping, and validation. |
| `update_lead` | `leads.write` | Update lead fields with allowlist and soft-delete exclusion. |
| `create_task` | `tasks.write` | Create a task linked to a lead, contact, or deal. |
| `send_message` | `messages.write` | Send outbound message (approval-required). |
| `generate_quote` | `quotes.write` | Generate a CPQ quote (approval-required). |
| `escalate_to_human` | `handoffs.write` | Create a human handoff request. |

## Protected tool wrapper
`protected-tool.js` wraps a tool with the tenant AI policy guard. It returns `approval_required` and an approval ID instead of executing when policy requires review. Behavior depends on agent mode:
- **Copilot mode:** All CRM mutations create approvals.
- **Assisted mode:** Only approval-listed tools create approvals.
- **Autonomous mode:** Configured non-approval tools execute; approval-listed tools still require review.

## High-risk tools
Outbound messaging, discounts, quotes, deletion, refunds, and policy exceptions require configured approval or autonomous permission. Low-confidence outputs must not execute actions.

## Policy enforcement
`ai-service.js` checks the tenant's `ai_policies` record at execution time. An empty `allowed_tools` array blocks all tool execution. Disabled agents cannot execute any tools. Policy changes immediately affect new actions.

## Test coverage
- `ai-service.test.js` — Policy enforcement and disabled/allowed-tool checks.
- `ai-guardrails.test.js` — Copilot approval vs autonomous execution.
- `protected-tool.test.js` — High-risk tool wrapping in copilot mode.
- `test-security.js` check #36 — Empty allowed_tools array enforcement.
