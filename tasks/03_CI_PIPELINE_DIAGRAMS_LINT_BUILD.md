# 03_CI_PIPELINE_DIAGRAMS_LINT_BUILD

## Objective
GitHub Actions pipeline to lint/test, render diagrams, and upload artifacts.

## Inputs
- Repo, Node 20, Mermaid CLI.

## Outputs
- `.github/workflows/ci.yml` runs install -> render -> upload artifacts.

## Steps
1. Author `ci.yml` with Node setup and render step.
2. Save `docs/diagrams/svg|png` as artifacts.
3. Add status badges later when repos are public.

## Acceptance Criteria
- PR shows passing checks; artifacts include rendered diagrams.

## References
- GitHub Actions: https://docs.github.com/actions
