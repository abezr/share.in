# Agent Runtime Isolation & Sandboxing

Preferred isolation:

- Default: WASM/WASI for portable steps.
- Elevated: gVisor for containerized untrusted workloads.
- High isolation: Firecracker microVMs for shared/community tasks.

Templates and Benchmarks: TBD in future tasks. Measure overhead and escape attempts.
