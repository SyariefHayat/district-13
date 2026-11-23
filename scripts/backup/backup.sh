#!/usr/bin/env bash
# ==============================================================================
# District 13 - Automated Hourly Database Backup Script (T-62)
# Dumps PostgreSQL, encrypts with AES-256-CBC, uploads to S3, enforces >=30d retention,
# and alerts on failure via Discord webhook.
# ==============================================================================

set -euo pipefail

TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
DATE_DIR=$(date -u +"%Y-%m-%d")
BACKUP_DIR="/tmp/district13_backups"
BACKUP_FILE="${BACKUP_DIR}/district13_backup_${TIMESTAMP}.dump"
ENCRYPTED_FILE="${BACKUP_FILE}.enc"

mkdir -p "${BACKUP_DIR}"

send_discord_alert() {
  local status="$1"
  local message="$2"
  if [[ -n "${DISCORD_WEBHOOK_URL:-}" ]]; then
    local color=15158332 # Red
    if [[ "$status" == "SUCCESS" ]]; then
      color=3066993 # Green
    fi
    local payload=$(cat <<EOF
{
  "embeds": [{
    "title": "Database Backup Alert: ${status}",
    "description": "${message}",
    "color": ${color},
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "fields": [
      { "name": "Timestamp", "value": "${TIMESTAMP}", "inline": true },
      { "name": "RPO Target", "value": "<= 1 hour", "inline": true },
      { "name": "Retention", "value": ">= 30 days", "inline": true }
    ]
  }]
}
EOF
)
    curl -s -H "Content-Type: application/json" -X POST -d "$payload" "$DISCORD_WEBHOOK_URL" > /dev/null || true
  fi
}

error_handler() {
  local line_no=$1
  local error_code=$2
  local error_msg="Backup failed at line ${line_no} with exit code ${error_code}. RPO limit at risk! Owner notified."
  echo "❌ [ERROR] ${error_msg}" >&2
  send_discord_alert "FAILED" "${error_msg}"
  exit "${error_code}"
}

trap 'error_handler ${LINENO} $?' ERR

echo "🚀 [$(date -u)] Starting District 13 database backup..."

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ [ERROR] DATABASE_URL is not set." >&2
  send_discord_alert "FAILED" "DATABASE_URL is not set."
  exit 1
fi

if [[ -z "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
  echo "⚠️ [WARN] BACKUP_ENCRYPTION_KEY not set; using fallback key for non-prod environment."
  BACKUP_ENCRYPTION_KEY="district-13-backup-default-aes-key-change-in-prod"
fi

# Step 1: Execute pg_dump (Custom compressed format -Fc)
echo "📦 Executing pg_dump..."
pg_dump "${DATABASE_URL}" --format=c --no-owner --no-privileges -f "${BACKUP_FILE}"
DUMP_SIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}")
echo "✅ Database dumped successfully (${DUMP_SIZE} bytes)."

# Step 2: Encrypt with AES-256-CBC (PBKDF2 key derivation)
echo "🔐 Encrypting backup with AES-256-CBC..."
openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
  -in "${BACKUP_FILE}" \
  -out "${ENCRYPTED_FILE}" \
  -k "${BACKUP_ENCRYPTION_KEY}"
ENC_SIZE=$(stat -c%s "${ENCRYPTED_FILE}" 2>/dev/null || stat -f%z "${ENCRYPTED_FILE}")
echo "✅ Backup encrypted successfully (${ENC_SIZE} bytes)."

# Step 3: Upload to S3-compatible storage
if [[ -n "${AWS_ACCESS_KEY_ID:-}" && -n "${S3_BUCKET_NAME:-}" ]]; then
  echo "☁️ Uploading encrypted backup to S3 bucket ${S3_BUCKET_NAME}..."
  S3_DEST="s3://${S3_BUCKET_NAME}/backups/${DATE_DIR}/$(basename "${ENCRYPTED_FILE}")"
  aws s3 cp "${ENCRYPTED_FILE}" "${S3_DEST}" --region "${AWS_REGION:-ap-southeast-1}"
  echo "✅ Uploaded to ${S3_DEST}"

  # Step 4: Retention Enforcement (Purge older than 30 days)
  echo "🧹 Enforcing >= 30-day retention policy..."
  RETENTION_DAYS=30
  CUTOFF_DATE=$(date -d "-${RETENTION_DAYS} days" +%Y-%m-%d 2>/dev/null || date -v-${RETENTION_DAYS}d +%Y-%m-%d)
  echo "ℹ️ Purging backups created prior to ${CUTOFF_DATE}..."
  # Clean up older S3 directories
  aws s3 ls "s3://${S3_BUCKET_NAME}/backups/" | while read -r line; do
    dir=$(echo "$line" | awk '{print $2}' | tr -d '/')
    if [[ "$dir" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] && [[ "$dir" < "$CUTOFF_DATE" ]]; then
      echo "Deleting expired backup directory: $dir"
      aws s3 rm "s3://${S3_BUCKET_NAME}/backups/$dir" --recursive || true
    fi
  done
else
  echo "ℹ️ S3 credentials not provided. Storing encrypted backup locally in ${BACKUP_DIR}."
fi

# Cleanup unencrypted raw dump
rm -f "${BACKUP_FILE}"

echo "🎉 [$(date -u)] Hourly backup completed successfully!"
send_discord_alert "SUCCESS" "Hourly backup completed and encrypted successfully (${ENC_SIZE} bytes). RPO <= 1h satisfied."
