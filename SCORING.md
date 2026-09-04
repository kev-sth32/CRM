# SalesOS Lead Scoring & Qualification Engine

## Architecture
SalesOS provides an explainable, deterministic rule-based lead qualification engine supplemented by AI behavioral intent analysis. Every score adjustment preserves full transparency so sales representatives understand why a lead is classified as Hot, Warm, or Nurture.

## Rule Schema (`lead_scoring_rules`)

Each tenant configures custom rules evaluated on lead creation and activity updates:

```json
{
  "id": "rule-4412",
  "tenant_id": "tenant_1",
  "field": "title",
  "operator": "contains",
  "value": "VP,Director,Chief,Head",
  "points": 25,
  "explanation": "Decision Maker seniority level",
  "priority": 1,
  "active": true
}
```

### Supported Operators
- `equals` / `not_equals`: Exact string or numeric equality.
- `contains` / `not_contains`: Case-insensitive substring matching.
- `greater_than` / `less_than`: Numeric and date comparisons (e.g. employee count, ARR).
- `is_present` / `is_blank`: Field presence checks (e.g. valid phone number, work email).

## Score Bands & Qualification Status
The raw score is clamped to the range $[0, 100]$:
- 🔥 **Hot Lead (Score 75 - 100):** Immediate SDR outreach required; automated task generated; eligible for instant AI copilot meeting booking.
- ⚡ **Warm Lead (Score 45 - 74):** Enrolled in accelerated nurture sequence; monitored for high-intent signals.
- 🌱 **Nurture / Cold (Score 0 - 44):** Standard drip campaign; re-evaluated upon customer engagement.

## Real-Time Qualification API

### `POST /api/leads/:id/qualify`
Runs the lead against the tenant's active rule set and returns:

```json
{
  "lead_id": "lead_982",
  "score": 85,
  "qualification": "hot",
  "signals": [
    { "rule": "Seniority", "points": 25, "explanation": "Decision Maker seniority level" },
    { "rule": "Company Size", "points": 30, "explanation": "Enterprise tier (>250 employees)" },
    { "rule": "High Intent", "points": 20, "explanation": "Requested custom pricing demo" },
    { "rule": "Work Email", "points": 10, "explanation": "Corporate domain verified" }
  ],
  "scored_at": "2026-09-04T12:00:00Z"
}
```

## Explainability & Audit Trail
Every qualification event writes an audit record in `audit_logs` capturing:
1. Prior score vs. updated score.
2. List of triggered signals and points.
3. Timestamp and triggering event (e.g. form submission, email opened, inbound phone call).

## Automated Testing
- `lead-scoring.test.js` — Unit test suite verifying edge cases, boundary clamping, missing fields, and operator evaluation.
