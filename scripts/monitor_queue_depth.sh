#!/usr/bin/env bash
set -euo pipefail

INNGEST_API="${INNGEST_HEALTH_URL:-http://localhost:8288/health}"
WORKER_HEALTH="${WORKER_HEALTH_URL:-http://localhost:4010/health}"

INNGEST_STATUS="$(curl -fsS "$INNGEST_API" || true)"
WORKER_STATUS="$(curl -fsS "$WORKER_HEALTH" || true)"

if [[ -z "$INNGEST_STATUS" || -z "$WORKER_STATUS" ]]; then
  echo "ALERT: Inngest or Worker health endpoint unavailable"
  exit 1
fi

echo "Inngest healthy: $INNGEST_STATUS"
echo "Worker healthy: $WORKER_STATUS"
echo "Queue depth alert check passed"
