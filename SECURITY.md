# SalesOS Security and Privacy

## Threat model
Protect tenant data, credentials, customer conversations, business knowledge, pricing, AI prompts, connector secrets, and generated proposals from unauthorized access, leakage, alteration, and abuse.

## Implemented controls

### Authentication & Sessions
- Scrypt password hashing with constant-time comparison.
- HTTP-only, SameSite=Lax session cookies with configurable Secure flag.
- Memory session store with periodic garbage collection.
- Session invalidation on password reset and logout.
- Self-serve registration with automatic tenant provisioning.

### Authorization
- Role-based access control (owner, admin, manager, salesperson, superadmin).
- Tenant context derived from authenticated session, never from request body/query.
- Record-level tenant scope checks on all CRM collections.
- Superadmin role enforcement for platform operations.
- Workspace data export restricted to owner/admin roles.

### Input Validation & Injection Defense
- Strict column name sanitization against SQL injection.
- Stored XSS payload escaping across leads, inbox, superadmin, and AI approvals.
- CSV formula injection defense (CWE-1236) in reports and exports.
- Prompt injection defense and adversarial jailbreak neutralization.
- Payload size limits with HTTP 413 for CWE-400 memory exhaustion defense.
- Entity whitelist validation for custom fields.

### Network & Transport Security
- Content-Security-Policy and Permissions-Policy response headers.
- SSRF defense blocking cloud metadata, loopback, and private subnet requests.
- CORS credential reflection defense (no arbitrary origin mirroring).
- Password reset Host-header poisoning defense.
- Static asset sandboxing (database and source file read prevention).
- TLS enforcement in production via Secure cookie flag.

### Rate Limiting
- Sliding window brute-force rate limiter for login attempts (429).
- Dedicated self-serve registration rate limiter (429).
- API request rate limiting per IP.

### Data Protection & Privacy
- GDPR Article 17 Right to Erasure with permanent PII scrub and legal certificate.
- GDPR Article 20 full workspace data portability export (JSON archive).
- CAN-SPAM and RFC 8058 one-click automated unsubscribe with HMAC token enforcement.
- Audit log secret redaction and credential masking.
- Outbound webhook secret masking in settings directory.
- Memory session credential stripping on `/api/auth/me`.

### E-Signature & Contract Integrity
- ESIGN Act non-repudiation audit bundle (SHA-256 hash, IP address, User-Agent, certificate chain).
- Contract immutability enforcement (re-signing rejected with 409 Conflict).
- 48-character high-entropy access tokens for public quote URLs (anti-IDOR).

### Tenant Isolation
- Cross-tenant data access blocked with 403 Forbidden.
- EventStream (SSE) authentication and tenant-scoped event isolation.
- AI approval cross-tenant authorization enforcement.
- Mass assignment tenant reassignment defense.
- Omnichannel message cross-tenant leakage prevention.
- Custom field and webhook deletion cross-tenant BOLA defense.
- Cross-tenant sequence enrollment isolation in follow-up service.
- Per-tenant workspace settings partitioning.

### AI safety
- AI accesses tenant data through typed, permissioned tools only.
- No unrestricted database credentials in prompts.
- Grounded answers in approved knowledge and catalog records.
- Approval required for external messaging, pricing exceptions, discounts, quotes, deletion, and refunds.
- Escalation for low confidence, complaints, legal matters, sensitive data requests, and explicit human requests.
- Cognitive AppSec: prompt injection defense neutralizes adversarial jailbreak attempts.
- Tenant AI policy enforcement at execution time (not only at agent start).

## Incident response
1. Disable compromised token/connector.
2. Preserve audit and infrastructure logs.
3. Identify tenant and data scope.
4. Rotate affected secrets.
5. Patch and deploy through review.
6. Notify affected parties according to applicable law and contract.
7. Record root cause and corrective actions.

## Automated security verification
The production security test suite (`test-security.js`) runs 52 automated checks covering all implemented controls. Run with:

```bash
node test-security.js
```

Or as part of the full suite:

```bash
npm run test:all
```
