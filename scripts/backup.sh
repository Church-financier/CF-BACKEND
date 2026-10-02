#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="church_financier_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

echo "Starting database backup..."
pg_dump "$DATABASE_URL" | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "Backup completed: ${BACKUP_DIR}/${FILENAME}"
echo "Size: $(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)"
