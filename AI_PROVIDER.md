# AI Provider Abstraction & Adapters

## Overview
SalesOS decouples AI generation from proprietary SDKs via a unified `AIProvider` contract. All AI operations (completions, structured tool calls, embeddings, and moderation) route through this interface.

## Provider Interface Contract

```javascript
class AIProvider {
  /**
   * Generates a chat completion or tool calls.
   * @param {Object} request - Tenant-scoped prompt, history, tools, and constraints.
   * @returns {Promise<{content: string, tool_calls?: Array, usage: {prompt_tokens: number, completion_tokens: number, total_tokens: number}, model: string}>}
   */
  async generate(request) {}

  /**
   * Generates vector embeddings for knowledge retrieval.
   * @param {string|string[]} input - Text strings to embed.
   * @returns {Promise<Array<number[]>>} Vector coordinates.
   */
  async embed(input) {}

  /**
   * Checks inbound or outbound text for safety/jailbreak/policy violations.
   * @param {string} input - Content to moderate.
   * @returns {Promise<{flagged: boolean, categories: Object}>}
   */
  async moderate(input) {}
}
```

## Implemented Adapters

### 1. OpenAI-Compatible Adapter (`providers/openai-compatible.js`)
- Standard HTTP fetch integration compatible with OpenAI, Azure OpenAI, Groq, Together, and Ollama.
- Configurable via environment variables:
  ```env
  AI_PROVIDER=openai-compatible
  AI_API_KEY=sk-...
  AI_BASE_URL=https://api.openai.com/v1
  AI_MODEL=gpt-4o-mini
  ```
- Strips any raw API keys from responses or telemetry.
- Enforces HTTP timeouts (default 15s) to prevent stalled agent workers.

### 2. Mock / Deterministic Provider (`providers/mock.js` or fallback mode)
- Enables end-to-end integration tests without live API keys or external billing.
- Generates reproducible tool-call payloads and citation responses for CI/CD test suites.

## Request Pipeline & Tenant Isolation
1. **Tenant Context Boundary:** Only customer and knowledge records belonging to `req.tenantId` are assembled into the prompt context.
2. **Cognitive Defense Sanitization:** All inbound user turns pass through the prompt-injection barrier (`server.js` AppSec layer) before provider dispatch.
3. **Structured Tool Schemas:** Injected tools match JSON Schema specifications declared in `AI_TOOLS.md`.
4. **Usage & Budget Accounting:** Tokens and computed costs are recorded into `ai_runs` upon completion; budget ceilings are enforced per tenant policy.

## Fallback & Error Handling
- **Provider Outage / 5xx:** Automatically falls back closed (returns helpful fallback message to human agent; does NOT guess or emit hallucinations).
- **Rate Limit (429):** Implements exponential backoff with jitter up to 3 retries.
- **Context Window Truncation:** Automatically preserves system prompt, active tools, and recent turns, pruning older conversational history if token thresholds are reached.

## Testing & Verification
- `ai-service.test.js` — Adapter initialization and tool invocation validation.
- `ai-runtime.js` — Execution tracking and metrics telemetry.
