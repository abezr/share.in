# AGENTS.md — Helios Agent Insights (for GenAI + tooling)

This doc distills **Schema‑Guided Reasoning (SGR)**, **MCP auto‑connection**, **checkpoint DAGs**, **rotation**, and **self‑validation** for Helios agents.

## 1) Schema‑Guided Reasoning (SGR)
All agent outputs must be **JSON‑Schema / grammar‑constrained**. This guarantees machine‑actionable plans from both cloud and local models.

### Core Schemas (abridged)
**ConversionTask**
- `source` / `target` provider profiles (`name`, `runtime`, `entry`)
- `workload`: `container|k8s|edge-worker|db|queue`
- `constraints`: `{ budgetUSD, freeTierOnly, regionPref, zeroDowntime }`

**ConversionPlanStep**
- `{ id, action (analyze_repo|generate_artifact|apply_iac|deploy|switch_traffic|rollback|verify), inputs, expectedArtifacts, rollbackOf }`

**ValidationReport**
- `checks[]`: `{ name (health|opa_policy|sast|container_vuln|latency|diff_output), status(pass|fail|warn), details }`
- `recommendation`: `continue|retry|rollback`

## 2) MCP Auto‑Connector
Agents specify **capabilities**; the registry discovers and connects only the necessary MCP servers, exposing tools/resources to the step runtime. Prefer official/verified servers; disconnect when idle. Fallback to sandboxed CLI/REST shims if no MCP exists.

## 3) Checkpoint DAGs & Rotation
- Persist **durable checkpoints** per step (inputs, outputs, artifacts, hash).  
- Use **NATS JetStream** streams + KV for logs/checkpoints and at‑least‑once semantics.  
- On quota exhaustion, a fresh agent resumes from last acknowledged checkpoint. Steps must be **idempotent**.

## 4) Self‑Validation Mesh
After each step, produce a `ValidationReport` by running:
- **OPA/Rego** policy checks (ToS/residency/egress/secret rules).
- **Semgrep** SAST + secrets scanning on diffs.
- **Trivy** for images/IaC/SBOM vulns/misconfig.
- **Smoke/health** probes and **differential/metamorphic** tests.
On `fail`, emit remediation/rollback step and surface hints to the console stream.

## 5) Sandboxing & Security
- Default to **WASM/WASI** or container sandboxes; escalate to **gVisor/Firecracker** for untrusted or shared community workloads.
- Secrets via short‑lived tokens from Vault/SM; never print secrets.
- Enforce ToS via policy; block placements that violate provider free‑tier restrictions.

## 6) Local/Edge Reasoning
Prefer **on‑device** LLM (e.g., Chrome Prompt API / Gemini Nano) for lint/templating; escalate to cloud models when necessary.

## 7) Console Contract
- Publish progress/validation to `agent.console.<runId>` (JetStream).  
- Respond to remediation and human approvals.  
- Include pointers to artifacts and checkpoints.

— AGENTS.md
