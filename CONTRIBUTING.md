# Contributing to SalesOS

## Principles
Extend existing architecture, avoid hardcoded industries, keep AI behind controlled tools, and never replace working functionality without tests.

## Technology stack
- **Runtime:** Node.js (>=18), single-process HTTP server (`server.js`).
- **Database:** PostgreSQL (production) with JSON fallback (development).
- **Frontend:** Vanilla HTML/CSS/JS — 21 templates sharing `app.css` + `app.js` design system.
- **Typography:** Plus Jakarta Sans, JetBrains Mono (Google Fonts).
- **Testing:** 19 automated test suites via `npm run test:all`.
- **Billing:** Stripe checkout sessions and billing portal.

## Change workflow
1. Inspect current architecture (`ARCHITECTURE.md`).
2. Write a short implementation plan.
3. Add or update migrations before dependent code (use numbered files in `db/`).
4. Implement API, persistence, and UI together.
5. Add loading, empty, error, success, and permission states.
6. Add tenant-isolation and authorization tests.
7. Run `npm run test:all` and verify all 19 suites pass.
8. Update documentation and known issues.

## UI/UX standards
- Use the shared design system in `app.css` (design tokens, glassmorphic accents, micro-interactions).
- Use `SalesOS.init()` from `app.js` for consistent navigation, topbar, and toast notifications.
- All pages must include the grouped sidebar navigation and glassmorphic topbar.
- Use `SalesOS.escapeHtml()` for any user-supplied content rendered in the DOM.
- Follow WCAG 2.1 AA accessibility standards (keyboard navigation, ARIA labels).
- Support mobile viewports with touch ergonomics.

## Database changes
Use numbered idempotent SQL migrations in `db/` (current: 001–022). Avoid destructive changes. Add indexes for tenant-scoped access. Include rollback notes for operationally risky migrations.

## AI changes
Document model, prompt, tools, permissions, grounding source, confidence behavior, escalation rules, evaluation set, and cost/latency impact. Do not claim placeholder AI is live. Agent configuration must be tenant-scoped and validated against the tool registry. See `AGENTS.md` for required behavior.

## Security requirements
- All user input must be escaped before DOM rendering (XSS defense).
- All SQL queries must use parameterized inputs.
- Tenant context must be derived from authenticated session, never from request body.
- Rate limiting must be applied to authentication and registration endpoints.
- Secrets must never appear in logs, API responses, or client-side code.
- Run `node test-security.js` to verify all 52 security checks pass.

## Pull request checklist
- [ ] API and UI are end-to-end connected.
- [ ] Tenant isolation verified.
- [ ] Permission behavior verified.
- [ ] Input/output validation added.
- [ ] XSS escaping applied to all user content.
- [ ] Audit behavior documented.
- [ ] All 19 test suites pass (`npm run test:all`).
- [ ] Documentation updated.
- [ ] No secrets or hardcoded production credentials.
- [ ] UI follows design system (Plus Jakarta Sans, glassmorphic accents, micro-interactions).
