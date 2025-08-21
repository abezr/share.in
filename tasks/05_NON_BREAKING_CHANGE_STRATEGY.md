# 05_NON_BREAKING_CHANGE_STRATEGY

## Objective
Backward‑compatible evolution: feature flags, API versioning, DB expand/contract.

## Outputs
- `docs/change-management.md` (SemVer, parallel change, deprecation).

## Steps
- Adopt SemVer for APIs/SDKs.
- Parallel change (expand -> dual‑write/backfill -> switch reads -> contract).
- Define deprecation windows and comms plan.

## Acceptance Criteria
- PR template checklist exists for public interface changes.

## References
- SemVer: https://semver.org/
