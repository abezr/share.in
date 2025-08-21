# Helios — Seed Repository (Full)

Helios orchestrates free-tier (and low-cost) providers for compute, hosting, DB, storage, and AI — with **quota-aware placement**, **agent checkpoints & rotation**, **policy/QC gates**, optional **community P2P**, and **diagrammed architecture**.

This seed repo includes diagrams, tasks, CI, and a Chrome MV3 extension scaffold.

## Quick Start

```bash
# 1) Install Node 20+ (or 18+) and npm (or pnpm)
npm i

# 2) Render diagrams to SVG and PNG
node scripts/render-diagrams.mjs   # outputs to docs/diagrams/svg|png

# 3) Load the Chrome extension (dev)
#    Chrome -> chrome://extensions -> Developer mode -> Load unpacked -> ./apps/extension
```

## What’s inside
- `README.md` (this doc) — **human-facing** overview & setup
- `AGENTS.md` — **agent-facing** insights (SGR, MCP, checkpoints/rotation, validation)
- `tasks/` — flat, standalone execution tasks (00–19) for mid-level developers
- `docs/diagrams/` — 15 Mermaid diagrams (C4 + ops)
- `scripts/render-diagrams.mjs` — renders to **SVG+PNG** via Mermaid CLI
- `.github/workflows/ci.yml` — CI renders diagrams and uploads artifacts
- `apps/extension/` — Chrome MV3 Helios Companion (popup + icons)
- `policies/` — starter OPA/Rego policy examples
- `db/migrations/` — placeholder for Flyway/Liquibase migrations

## 12‑Factor Mindset — Applicability
Helios control-plane services (API Gateway, Orchestrator, Agent Manager, QC, Quota Monitor) should follow 12‑Factor principles: **config in env**, **stateless processes**, **logs as event streams**, **build/release/run separation**, **dev‑prod parity**. Stateful parts (Postgres, object storage, NATS JetStream) are backing services. See https://12factor.net/ .

## Non‑Breaking Change Development
Use **Parallel Change (expand/contract)** for APIs & DB:
1) Expand: add new fields/columns & accept new API shapes; dual‑write/backfill.  
2) Flip: move readers to new shape; monitor.  
3) Contract: remove old fields/endpoints when safe.  
Adopt **SemVer** for SDKs/adapters; gate risky features via **feature flags**.

## Automated Quality Monitoring
- **OpenTelemetry** for traces/metrics/logs (Collector receives and exports).  
- **OPA/Rego** policies; **Semgrep** SAST/secrets; **Trivy** container/IaC/SBOM scans.  
- Alerts via Prometheus/Alertmanager to agent-console webhooks.

References (official docs):
- 12‑Factor: https://12factor.net/  
- Mermaid CLI: https://github.com/mermaid-js/mermaid-cli  
- NATS JetStream: https://docs.nats.io/nats-concepts/jetstream  
- Open Policy Agent (Rego): https://www.openpolicyagent.org/docs/  
- Semgrep: https://semgrep.dev/docs/  
- Trivy: https://aquasecurity.github.io/trivy/latest/  
- OpenTelemetry Collector: https://opentelemetry.io/docs/collector/  
- Chrome MV3: https://developer.chrome.com/docs/extensions/mv3/  
- GitHub Actions: https://docs.github.com/actions
- Flyway: https://documentation.red-gate.com/fd  
- Liquibase: https://docs.liquibase.com/

## Migration & Update Strategy
- **Services**: blue‑green/canary with health probes; **auto‑rollback** on SLO breach; checkpoints/events in NATS JetStream for resumability.  
- **DB**: Flyway or Liquibase migrations; prefer forward‑only, idempotent scripts; expand/contract with dual‑read/dual‑write & backfill.  
- **Agents/Adapters**: sign artifacts (cosign), publish via OCI registry; rollout behind feature flags with per‑provider canaries.

## Chrome Extension (MV3) — Dev & Publish
**Dev**: Load `apps/extension` as unpacked in `chrome://extensions` (Developer mode).  
**Publish**: Zip `apps/extension` and submit to Chrome Web Store (requires developer account).

## CI
Workflow installs deps, renders diagrams, and uploads artifacts on push/PR. Extend with Semgrep/Trivy/OPA as services land.

— Helios
