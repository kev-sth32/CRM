# SalesOS AI Evaluation Plan

## Guardrail evaluation
`protected-tool.test.js` verifies that a high-risk tool in Copilot mode returns an approval request and does not execute the underlying action.
`ai-guardrails.test.js` verifies copilot actions create pending approvals while explicitly autonomous, non-approval-listed actions may execute. Add regression cases for policy changes, denied permissions, expired approvals, and tenant mismatch.

## Grounded response validation
`response-validator.js` rejects empty answers, missing citations, and citations that do not belong to the retrieved source set. Valid responses retain normalized text and supported citation IDs.

## AI run observability
Migration `012_ai_runs.sql` provides tenant-scoped execution records for agent name, model, task, status, confidence, latency, cost, input references, output, and error. Sensitive prompt content should be redacted or referenced rather than stored directly.

## Closed-loop evaluation feedback
`ai-service.js` implements `enrichWithEvaluations(request, evaluations)`: automatically extracts positive human reviews (`rating === 'good'`) as few-shot learning demonstrations and flags anti-patterns (`rating === 'bad'`). The copilot suggestion endpoint dynamically cites alignment with tenant-approved quality evaluations.

## Conversation quality review
`POST /api/ai/evaluations` records `good`, `bad`, or `needs_improvement` review feedback. `GET /api/ai/evaluations` lists tenant-scoped reviews. The `approvals.html` page provides the Quality Evaluations tab for operator review.

`evaluation-trends.js` computes descriptive quality trends from tenant evaluations for monitoring AI performance over time.

## Prompt injection defense
Cognitive AppSec layer screens inbound messages for adversarial prompt injection attempts and known jailbreak patterns. Verified by `test-specialist-round2.js`.

## Goals
Measure groundedness, tool correctness, qualification quality, escalation accuracy, response quality, latency, cost, customer satisfaction, and AI-influenced revenue.

## Test sets
Maintain tenant-safe, anonymized examples for:
- Lead capture and duplicate detection
- BANT/custom qualification
- Product recommendation
- Pricing and policy grounding
- Objection handling
- Multilingual English, Nepali, and Hindi conversations
- Prompt injection and data-exfiltration attempts
- Human handoff
- Follow-up timing and opt-out compliance

## Deterministic scoring baseline
`lead-scoring.js` provides a configurable, explainable baseline before model-based scoring. Each matched rule returns points and a reason; scores are clamped to 0–100 and mapped to hot, warm, or nurture.

## Metrics
- Intent accuracy
- Score agreement with reviewed labels
- Hallucination rate
- Citation/knowledge support rate
- Tool-call validity
- Unauthorized-action rate
- Escalation precision and recall
- Response latency and cost
- AI containment and assisted conversion
- SLA compliance rate

## Review workflow
1. Sample conversations by tenant and agent version.
2. Redact sensitive data.
3. Review as Good, Bad, or Needs improvement.
4. Label failure type and severity.
5. Compare model/prompt/knowledge versions.
6. Block releases that regress safety or authorization.

## Release gates
No autonomous release if unauthorized actions, invented prices/inventory, opt-out violations, cross-tenant leakage, or critical escalation failures are detected. High-risk tools remain approval-gated until evaluation thresholds are met.

## Test coverage
- `ai-guardrails.test.js` — Approval creation vs autonomous execution.
- `protected-tool.test.js` — Protected tool wrapper behavior.
- `response-validator.test.js` — Grounded response and citation validation.
- `lead-scoring.test.js` — Deterministic scoring and rule matching.
- `test-specialist-fixes.js` — Closed-loop evaluation feedback injection.
- `test-specialist-round2.js` — Prompt injection defense.
