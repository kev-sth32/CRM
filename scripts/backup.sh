#!/usr/bin/env bash
# ==============================================================================
# SalesOS Automated Database Backup Script (PostgreSQL / pg_dump)
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/salesos}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/salesos_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date -Iseconds)] Starting SalesOS database backup..."

if [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "${DATABASE_URL}" | gzip > "${BACKUP_FILE}"
else
  PGUSER="${POSTGRES_USER:-salesos_user}"
  PGPASSWORD="${POSTGRES_PASSWORD:-salesos_secure_password}"
  PGDATABASE="${POSTGRES_DB:-salesos_db}"
  PGHOST="${POSTGRES_HOST:-localhost}"
  PGPORT="${POSTGRES_PORT:-5432}"

  export PGPASSWORD
  pg_dump -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" | gzip > "${BACKUP_FILE}"
fi

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date -Iseconds)] Backup completed successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Optional S3 upload if S3_BUCKET is set
if [ -n "${S3_BUCKET:-}" ] && command -v aws >/dev/null 2>&1; then
  echo "[$(date -Iseconds)] Syncing backup to AWS S3: s3://${S3_BUCKET}/"
  aws s3 cp "${BACKUP_FILE}" "s3://${S3_BUCKET}/backups/$(basename "${BACKUP_FILE}")"
fi

# Rotate backups older than RETENTION_DAYS
echo "[$(date -Iseconds)] Purging local backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "salesos_backup_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -delete

echo "[$(date -Iseconds)] Backup routine finished cleanly."
