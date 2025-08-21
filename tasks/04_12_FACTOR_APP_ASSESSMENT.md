# 04_12_FACTOR_APP_ASSESSMENT

## Objective
Decide how 12‑Factor applies to Helios services; record decisions.

## Outputs
- `docs/12-factor.md` mapping each factor to services, with exceptions.

## Steps
- Map config -> env (secrets in Vault).
- Treat Postgres/NATS/object store as backing services.
- Stateless processes; logs as streams; build-release-run separation.

## Acceptance Criteria
- Documented mapping and rationale per factor.

## References
- https://12factor.net/
