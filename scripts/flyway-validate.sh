#!/usr/bin/env bash
set -euo pipefail

# Usage: DB_URL, DB_USER, DB_PASSWORD env vars should be set for CI or local.
# For local dev without DB, this script will skip validation.
if [ -z "${DB_URL:-}" ]; then
  echo "DB_URL not set, skipping flyway validation (dev mode)" >&2
  exit 0
fi

IMAGE=flyway/flyway:10.17.0

exec docker run --rm \
  -e FLYWAY_URL="$DB_URL" \
  -e FLYWAY_USER="${DB_USER:-postgres}" \
  -e FLYWAY_PASSWORD="${DB_PASSWORD:-postgres}" \
  -v "$PWD/db/migrations:/flyway/sql" \
  $IMAGE -baselineOnMigrate=true -validateMigrationNaming=true validate
