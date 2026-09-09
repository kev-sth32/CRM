# migrations/README.md
# Database Migration Strategy (BACK-4)

## Current State
Migrations are SQL files in this directory. Previously they were chained with && in package.json with no state tracking.

## Target State
Use 
ode-pg-migrate for tracked, reversible, transaction-wrapped migrations.

## Setup
`ash
npm install node-pg-migrate --save-dev
`

Add to package.json scripts:
`json
"db:migrate:tracked": "node-pg-migrate up --database-url-var DATABASE_URL --migrations-dir ./migrations --schema public",
"db:migrate:down": "node-pg-migrate down --database-url-var DATABASE_URL --migrations-dir ./migrations --schema public",
"db:migrate:status": "node-pg-migrate status --database-url-var DATABASE_URL --migrations-dir ./migrations"
`

## Migration Naming Convention
{NNN}_{description}.sql where NNN is zero-padded 3-digit sequence number.

## Migration Rules
1. Every migration must be reversible (provide both up and down).
2. All schema changes must run in a transaction.
3. Never modify a committed migration — create a new one instead.
4. Always test with db:migrate:down after applying.

## Current Migrations
| # | File | Status |
|---|------|--------|
| 001 | enforce_tenant_id_not_null | pending |
