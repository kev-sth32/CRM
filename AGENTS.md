# AI Agent Configuration

`agent-config.js` validates tenant agent configuration before persistence. `agent-service.js` provides tenant-scoped listing, creation, and activation operations. Supported agent modes are `copilot`, `assisted`, and `autonomous`; tenant-wide policy still controls whether a mode may run.

## Required behavior
- Keep agent configuration tenant-scoped.
- Validate tools against the tool registry.
- Require escalation rules before autonomous activation.
- Preserve language, tone, and system policy versions.
- Audit all activation and policy changes.
- Default new agents to Copilot mode.

## Agent lifecycle
Agents follow managed state transitions (`agent-state.js`):
- `draft` → `active` (requires escalation rules and valid tools).
- `active` → `paused` (immediate, preserves configuration).
- `paused` → `active` (re-validates escalation rules).
- `active` → `deactivated` (audited).

Invalid transitions are rejected. All changes are tenant-scoped and audited.

## Activation safety
`agent-state.js` provides an activation safety predicate that verifies:
- Escalation rules are configured.
- All tools are registered in the tool registry.
- Tenant AI policy allows the requested mode.
- Required approval-listed tools have approval workflow configured.

## AI Policy enforcement
`ai-service.js` loads the current tenant policy at execution time (not only at agent start). Disabled agents cannot execute. Tools not in the allowed list are rejected. Empty allowed_tools arrays block all tool execution. Policy changes immediately affect new actions.

## Protected tools
`protected-tool.js` wraps high-risk tools with the tenant AI policy guard. In copilot mode, it returns `approval_required` with an approval ID instead of executing. In autonomous mode with approval-listed tools, it creates an approval record.

## Closed-loop evaluation
AI copilot suggestions are enriched with tenant-approved quality evaluations. Positive reviews (`rating === 'good'`) become few-shot learning demonstrations. Negative reviews (`rating === 'bad'`) flag anti-patterns. This feedback loop is implemented in `ai-service.js` via `enrichWithEvaluations()`.

## Prompt injection defense
Inbound user messages are screened for adversarial prompt injection attempts. Known jailbreak patterns are neutralized before reaching the AI provider. Implemented in `server.js` cognitive AppSec layer.

## Test coverage
- `agent-config.test.js` — Configuration validation and mode enforcement.
- `ai-service.test.js` — Policy enforcement and disabled/allowed-tool checks.
- `ai-guardrails.test.js` — Copilot approval creation and autonomous execution.
- `protected-tool.test.js` — High-risk tool approval wrapping.
- `test-specialist-round2.js` — Prompt injection defense verification.
