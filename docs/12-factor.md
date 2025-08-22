# 12-Factor Applicability — Helios

This document maps the 12-Factor principles to Helios services and notes exceptions.

Services: API Gateway, Orchestrator, Agent Manager, Quality Control, Quota Monitor.
Backing services: Postgres (state), NATS JetStream (events/checkpoints), Object Store (artifacts), Cache.

1. Codebase

- One mono-repo, multiple deploys (envs). Git as the canonical source.

2. Dependencies

- Explicit: package managers (pnpm/npm) with lockfiles; containers pin major versions. Supply-chain scans (Semgrep/Trivy).

3. Config

- Strictly via environment variables; secrets in Vault/SM injected at runtime. No config in code.

4. Backing services

- Treat Postgres/NATS/object store as attached resources; swap via env without code change.

5. Build, release, run

- Separate pipelines: build immutable images; release by config + image; run as stateless deployments.

6. Processes

- Stateless services; persist state to backing services. Horizontal scaling by processes/replicas.

7. Port binding

- Services expose HTTP/gRPC via bound ports; gateways/ingress handle routing and TLS.

8. Concurrency

- Scale out via process/replica counts; use JetStream consumers for work distribution.

9. Disposability

- Fast start/shutdown; handle SIGTERM; idempotent steps with checkpoint replay.

10. Dev/prod parity

- Similar stacks and dependencies; ephemeral preview envs; seed data fixtures.

11. Logs

- Emit structured logs to stdout; ship to collector; retain in object store/NATS streams if needed.

12. Admin processes

- Run migrations/ops tasks as one-off jobs with the same build image.

Exceptions/Notes

- Long-running agent tasks rely on checkpoints (JetStream) and object storage. Stateful DB migration steps use forward-only scripts with rollback playbooks.
