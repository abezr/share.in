# Change Management — SemVer, Parallel Change, Deprecation

Versioning

- Adopt SemVer for public APIs/SDKs: MAJOR.MINOR.PATCH.
- Tag container images and packages with SemVer + commit SHA.

Parallel Change Strategy (Expand/Contract)

1. Expand: add new DB columns/fields/endpoints; accept both old/new shapes; dual-write; backfill.
2. Flip: switch readers to the new shape; monitor metrics and errors; maintain fallback logic.
3. Contract: remove old columns/fields/endpoints after deprecation window.

Deprecation Policy

- Minimum deprecation window: 2 minor releases or 90 days (whichever longer) for public APIs.
- Communicate via CHANGELOG, docs, and deprecation headers. Provide migration guides.

Feature Flags

- Gate risky capability behind flags; per-tenant overrides; gradual rollout.

PR Checklist for Public Interface Changes

- [ ] SemVer impact assessed (major/minor/patch)
- [ ] Backward compatibility plan (expand/contract) documented
- [ ] Migrations/backfills defined and reversible plan noted
- [ ] Feature flags and rollout plan
- [ ] Monitoring and alerting in place
- [ ] Docs and CHANGELOG updates prepared
