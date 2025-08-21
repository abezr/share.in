# 01_PROJECT_BOOTSTRAP_REPO

## Objective
Initialize Helios mono-repo with baseline layout, build scripts, and commit hooks.

## Inputs
- Local Git, Node 18+/pnpm, Go (if chosen), Rust (if chosen).
- GitHub account.

## Outputs
- Git repo with `/apps` (frontend, extension), `/services` (orchestrator, agent-mgr, qc, monitoring), `/agents`, `/infra`, `/docs/diagrams`, `/policies`, `/scripts`.
- Initial README and CI stub.

## Steps
1. Init repo:
```bash
mkdir helios && cd helios
git init
gh repo create helios --private --source=. --remote=origin --push
```
2. Add workspaces (pnpm) and baseline folders.
3. Add linting (ESLint/Prettier) + commit hooks (Husky).
4. Commit & push.

## Acceptance Criteria
- Fresh clone installs with `pnpm -w -r install` (or npm) without errors.
- Top-level README has Quickstart.
