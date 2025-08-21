# 11_AGENT_RUNTIME_ISOLATION_SANDBOXING

## Objective
Isolate agent execution with gVisor/Firecracker; optionally WASM/WASI.

## Outputs
- Sandbox job templates and measurements of overhead.

## Steps
- Evaluate gVisor vs Firecracker; choose per task class.
- Run agents under sandbox with least privileges.

## Acceptance Criteria
- Escape attempts are blocked; performance overhead acceptable.
