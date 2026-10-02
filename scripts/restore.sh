#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

SQL_FILE="${1:-}"
if [ -z "$SQL_FILE" ] || [ ! -f "$SQL_FILE" ]; then
  echo "Usage: $0 <backup-file.sql.gz>" >&2
  exit 1
fi

echo "WARNING: This will drop and recreate the public schema. All existing data will be lost."
read -p "Are you sure? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "Restoring database from ${SQL_FILE}..."
gunzip -c "$SQL_FILE" | psql "$DATABASE_URL"

echo "Restore completed."
npx prisma migrate deploy
