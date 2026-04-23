#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is required"
  exit 1
fi

if [[ -z "${S3_BACKUP_BUCKET:-}" ]]; then
  echo "S3_BACKUP_BUCKET is required"
  exit 1
fi

FILENAME="supabase_dump_${TIMESTAMP}.sql.gz"
TARGET_PATH="${BACKUP_DIR}/${FILENAME}"

pg_dump "$SUPABASE_DB_URL" --no-owner --no-privileges | gzip > "$TARGET_PATH"
aws s3 cp "$TARGET_PATH" "${S3_BACKUP_BUCKET}/${FILENAME}"

# Retention: keep only last 7 daily backups in bucket prefix.
aws s3 ls "$S3_BACKUP_BUCKET/" | sort | head -n -7 | awk '{print $4}' | while read -r OLD; do
  if [[ -n "$OLD" ]]; then
    aws s3 rm "${S3_BACKUP_BUCKET}/${OLD}"
  fi
done

echo "Backup complete: ${TARGET_PATH}"
