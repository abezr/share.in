# 06_DB_MIGRATIONS_AND_UPDATES

## Objective
Stand up DB migration tooling (Flyway or Liquibase) with examples and CI validation.

## Outputs
- `/db/migrations` with versioned scripts; CI job to validate.

## Steps (Flyway)
- Add Flyway CLI/container; `V001__init.sql`; `flyway validate` then `migrate`.

## Steps (Liquibase)
- Initialize changelog; use `generate-changelog` if brownfield.

## Acceptance Criteria
- Migrations run idempotently; rollback plan documented.

## References
- Flyway: https://documentation.red-gate.com/fd
- Liquibase: https://docs.liquibase.com/
