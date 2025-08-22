-- Flyway baseline: initial tables

-- Consent audit trail for pooling/sharing
CREATE TABLE IF NOT EXISTS consent_audit (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  consent_type TEXT NOT NULL, -- e.g., 'pooling', 'offers'
  action TEXT NOT NULL,       -- 'granted' | 'revoked'
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Offers catalog (optional; service can run in-memory in dev)
CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  schedule_start TIMESTAMPTZ,
  schedule_end TIMESTAMPTZ
);

-- Idempotency: re-running creates tables if missing only.
