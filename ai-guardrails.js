const { requestApproval } = require('./ai-approval');

// Known adversarial prompt injection / jailbreak patterns
const ADVERSARIAL_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s+prompt\s+override/i,
  /disregard\s+(all\s+)?(safety|system|workspace)\s+policies/i,
  /reveal\s+(the\s+)?(system\s+prompt|hidden\s+instructions|master\s+key)/i,
  /you\s+are\s+now\s+(in\s+)?(developer\s+mode|dan\s+mode|unrestricted)/i,
  /bypass\s+all\s+(guardrails|filters|rules)/i,
  /act\s+as\s+an\s+unfiltered/i,
  /simulate\s+a\s+jailbroken/i
];

/**
 * Sanitizes untrusted user text before feeding into AI prompt context (PRD §53, §55)
 */
function sanitizePromptInput(rawText) {
  if (typeof rawText !== 'string') {
    return { safe: true, sanitizedText: '', flaggedPatterns: [] };
  }

  const flaggedPatterns = [];
  for (const pattern of ADVERSARIAL_PATTERNS) {
    if (pattern.test(rawText)) {
      flaggedPatterns.push(pattern.source);
    }
  }

  // Neutralize known injection phrases if found
  let sanitized = rawText;
  for (const pattern of ADVERSARIAL_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[BLOCKED_INJECTION_ATTEMPT]');
  }

  // XML / delimiter escape to prevent prompt breakout attacks
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return {
    safe: flaggedPatterns.length === 0,
    sanitizedText: sanitized.trim(),
    flaggedPatterns
  };
}

/**
 * Encapsulates untrusted input in structured delimiter tags
 */
function delimitContext(tag, content) {
  const safeTag = tag.replace(/[^a-z0-9_]/gi, '');
  const cleanContent = typeof content === 'string' ? content : JSON.stringify(content);
  return `<${safeTag}>\n${cleanContent}\n</${safeTag}>`;
}

async function guardAction({ pool, policy, tenantId, userId, action, payload, aiRunId = null }) {
  const required = Array.isArray(policy?.approval_required) && policy.approval_required.includes(action);
  if (required || policy?.agent_mode !== 'autonomous') {
    return {
      execute: false,
      approval: await requestApproval(pool, { tenantId, userId, aiRunId, action, payload })
    };
  }
  return { execute: true };
}

module.exports = {
  guardAction,
  sanitizePromptInput,
  delimitContext,
  ADVERSARIAL_PATTERNS
};
